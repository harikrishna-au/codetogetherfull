import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { SandboxRunner, SANDBOX_RUN_TIMEOUT_MS } from './sandboxRunner.js';

const execFileAsync = promisify(execFile);

type Language = 'javascript' | 'python' | 'java' | 'cpp';

interface ExecuteInput {
    code: string;
    language: Language;
    starterCode: string;
    testCases: TestCaseInput[];
}

interface TestCaseInput {
    id: string;
    input: Record<string, any>;
    expectedOutput: any;
    isHidden: boolean;
}

interface TestCaseResult {
    testCaseId: string;
    passed: boolean;
    input?: Record<string, any>;
    expected?: any;
    actual: any;
    error: string | null;
    runtime: number;
    isHidden: boolean;
}

interface ExecuteResult {
    totalTests: number;
    passed: number;
    failed: number;
    results: TestCaseResult[];
    compilationError: string | null;
    overallRuntime: number;
}

interface FunctionSignature {
    funcName: string;
    paramNames: string[];
    paramTypes?: string[];
    returnType?: string;
}

export class CodeRunner {
    private static readonly TOTAL_TIMEOUT = 30_000;
    private static readonly COMPILE_TIMEOUT = 15_000;
    private static readonly MAX_BUFFER = 256 * 1024 * 1024;

    /** Docker-isolated backend (A2). `EXECUTION_MODE=local` bypasses it for dev. */
    private readonly sandbox = new SandboxRunner();

    private useDocker(): boolean {
        return env.EXECUTION_MODE === 'docker';
    }

    async execute(input: ExecuteInput): Promise<ExecuteResult> {
        const { code, language, starterCode, testCases } = input;

        this.validateCodeSafety(code, language);

        const signature = this.parseSignature(starterCode, language);
        const isVoid = this.isVoidReturn(starterCode, language);
        const tmpDir = await this.createTmpDir();

        try {
            let result: ExecuteResult;
            switch (language) {
                case 'javascript':
                    result = await this.runJavaScript(code, testCases, signature, isVoid, tmpDir);
                    break;
                case 'python':
                    result = await this.runPython(code, testCases, signature, isVoid, tmpDir);
                    break;
                case 'java':
                    result = await this.runJava(code, testCases, signature, isVoid, tmpDir);
                    break;
                case 'cpp':
                    result = await this.runCpp(code, testCases, signature, isVoid, tmpDir);
                    break;
            }

            // Redact hidden test case data (A5). Beyond input/expected, also strip
            // `actual` (oracle for probing hidden inputs) and raw `error` strings
            // (assertion/exception text can embed expected output) — hidden cases
            // only ever report pass/fail.
            result.results = result.results.map(r => {
                if (r.isHidden) {
                    return {
                        testCaseId: r.testCaseId,
                        passed: r.passed,
                        actual: null,
                        error: r.passed ? null : 'Hidden test failed',
                        runtime: r.runtime,
                        isHidden: true,
                    };
                }
                return r;
            });

            return result;
        } finally {
            await this.cleanupTmpDir(tmpDir);
        }
    }

    // ─── Signature Parsing ───────────────────────────────────────────

    private parseSignature(starterCode: string, language: Language): FunctionSignature {
        switch (language) {
            case 'javascript': return this.parseJSSignature(starterCode);
            case 'python': return this.parsePythonSignature(starterCode);
            case 'java': return this.parseJavaSignature(starterCode);
            case 'cpp': return this.parseCppSignature(starterCode);
        }
    }

    private parseJSSignature(code: string): FunctionSignature {
        const match = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);
        if (!match) throw new AppError('Cannot parse JavaScript function signature', 400);
        return {
            funcName: match[1],
            paramNames: match[2].split(',').map(p => p.trim()).filter(Boolean),
        };
    }

    private parsePythonSignature(code: string): FunctionSignature {
        const match = code.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:/);
        if (!match) throw new AppError('Cannot parse Python function signature', 400);
        return {
            funcName: match[1],
            paramNames: match[2].split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean),
        };
    }

    private parseJavaSignature(code: string): FunctionSignature {
        const match = code.match(/public\s+([\w<>[\]\s,]+?)\s+(\w+)\s*\(([^)]*)\)/);
        if (!match) throw new AppError('Cannot parse Java function signature', 400);
        const returnType = match[1].trim();
        const funcName = match[2];
        const paramNames: string[] = [];
        const paramTypes: string[] = [];
        if (match[3].trim()) {
            for (const param of this.splitParams(match[3])) {
                const parts = param.trim().split(/\s+/);
                paramNames.push(parts.pop()!);
                paramTypes.push(parts.join(' '));
            }
        }
        return { funcName, paramNames, paramTypes, returnType };
    }

    private parseCppSignature(code: string): FunctionSignature {
        // Try class Solution { public: ... } pattern first
        let match = code.match(/public:\s*\n?\s*([\w<>&*\s:]+?)\s+(\w+)\s*\(([^)]*)\)/);
        // Fallback: standalone function (after #include/using lines)
        if (!match) {
            match = code.match(/(?:^|\n)\s*([\w<>&*:]+(?:<[\w<>,\s]+>)?[*&\s]*)\s+(\w+)\s*\(([^)]*)\)\s*\{/m);
        }
        if (!match) throw new AppError('Cannot parse C++ function signature', 400);
        const returnType = match[1].trim();
        const funcName = match[2];
        const paramNames: string[] = [];
        const paramTypes: string[] = [];
        if (match[3].trim()) {
            for (const param of this.splitParams(match[3])) {
                const trimmed = param.trim();
                const lastSpace = trimmed.lastIndexOf(' ');
                if (lastSpace === -1) continue;
                paramTypes.push(trimmed.substring(0, lastSpace).trim());
                paramNames.push(trimmed.substring(lastSpace + 1).trim());
            }
        }
        return { funcName, paramNames, paramTypes, returnType };
    }

    private splitParams(paramsStr: string): string[] {
        const result: string[] = [];
        let depth = 0;
        let current = '';
        for (const ch of paramsStr) {
            if (ch === '<') depth++;
            else if (ch === '>') depth--;
            else if (ch === ',' && depth === 0) {
                result.push(current);
                current = '';
                continue;
            }
            current += ch;
        }
        if (current.trim()) result.push(current);
        return result;
    }

    private isVoidReturn(starterCode: string, language: Language): boolean {
        if (language === 'java') return /public\s+void\s+/.test(starterCode);
        if (language === 'cpp') {
            // Check class-based pattern
            const m = starterCode.match(/public:\s*\n?\s*([\w<>&*\s:]+?)\s+\w+\s*\(/);
            if (m) return m[1].trim() === 'void';
            // Check standalone function pattern
            const m2 = starterCode.match(/(?:^|\n)\s*(void)\s+\w+\s*\(/m);
            return !!m2;
        }
        // JS/Python: detect at runtime (return undefined/None => use first arg)
        return false;
    }

    private isCppClassBased(starterCode: string): boolean {
        return /class\s+Solution/.test(starterCode);
    }

    // ─── JavaScript Runner ───────────────────────────────────────────

    private async runJavaScript(
        code: string, testCases: TestCaseInput[], sig: FunctionSignature,
        _isVoid: boolean, tmpDir: string
    ): Promise<ExecuteResult> {
        const paramExtract = sig.paramNames.map(p => `__tc.input[${JSON.stringify(p)}]`).join(', ');
        const harness = `'use strict';
${code}

const __testCases = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const __results = [];
for (const __tc of __testCases) {
    const __start = process.hrtime.bigint();
    let __actual = null;
    let __error = null;
    try {
        const __args = [${paramExtract}];
        let __ret = ${sig.funcName}(...__args);
        if (__ret === undefined) __ret = __args[0];
        __actual = __ret;
    } catch (__e) {
        __error = __e.message || String(__e);
    }
    const __end = process.hrtime.bigint();
    __results.push({ actual: __actual, error: __error, runtime: Number(__end - __start) / 1e6 });
}
process.stdout.write(JSON.stringify(__results));
`;
        const filePath = join(tmpDir, 'solution.js');
        await writeFile(filePath, harness, 'utf8');
        const stdinData = JSON.stringify(testCases.map(tc => ({ input: tc.input })));

        try {
            const { stdout } = this.useDocker()
                ? await this.sandbox.run({
                    language: 'javascript',
                    command: ['node', '--max-old-space-size=256', '/workspace/solution.js'],
                    tmpDir,
                    stdinData,
                    timeoutMs: SANDBOX_RUN_TIMEOUT_MS,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                })
                : await this.runWithStdin('node', ['--max-old-space-size=256', filePath], stdinData, {
                    timeout: CodeRunner.TOTAL_TIMEOUT,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                    cwd: tmpDir,
                });
            return this.buildResult(stdout, testCases, tmpDir);
        } catch (err: any) {
            return this.buildErrorResult(err, testCases, tmpDir);
        }
    }

    // ─── Python Runner ───────────────────────────────────────────────

    private async runPython(
        code: string, testCases: TestCaseInput[], sig: FunctionSignature,
        _isVoid: boolean, tmpDir: string
    ): Promise<ExecuteResult> {
        const paramExtract = sig.paramNames.map(p => `__tc["input"][${JSON.stringify(p)}]`).join(', ');
        const harness = `import sys, json, time, copy

${code}

__test_cases = json.loads(sys.stdin.read())
__results = []
for __tc in __test_cases:
    __args = [${paramExtract}]
    __start = time.perf_counter_ns()
    __actual = None
    __error = None
    try:
        __ret = ${sig.funcName}(*__args)
        if __ret is None:
            __actual = __args[0]
        else:
            __actual = __ret
    except Exception as __e:
        __error = str(__e)
    __end = time.perf_counter_ns()
    __results.append({"actual": __actual, "error": __error, "runtime": (__end - __start) / 1e6})

sys.stdout.write(json.dumps(__results))
`;
        const filePath = join(tmpDir, 'solution.py');
        await writeFile(filePath, harness, 'utf8');
        const stdinData = JSON.stringify(testCases.map(tc => ({ input: tc.input })));

        try {
            const { stdout } = this.useDocker()
                ? await this.sandbox.run({
                    language: 'python',
                    command: ['python3', '/workspace/solution.py'],
                    tmpDir,
                    stdinData,
                    timeoutMs: SANDBOX_RUN_TIMEOUT_MS,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                })
                : await this.runWithStdin('python3', [filePath], stdinData, {
                    timeout: CodeRunner.TOTAL_TIMEOUT,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                    cwd: tmpDir,
                });
            return this.buildResult(stdout, testCases, tmpDir);
        } catch (err: any) {
            return this.buildErrorResult(err, testCases, tmpDir);
        }
    }

    // ─── Java Runner ─────────────────────────────────────────────────

    private async runJava(
        code: string, testCases: TestCaseInput[], sig: FunctionSignature,
        isVoid: boolean, tmpDir: string
    ): Promise<ExecuteResult> {
        const wrapper = this.generateJavaWrapper(code, testCases, sig, isVoid);
        const filePath = join(tmpDir, 'Main.java');
        await writeFile(filePath, wrapper, 'utf8');

        // Compile
        try {
            if (this.useDocker()) {
                await this.sandbox.run({
                    language: 'java',
                    command: ['javac', '/workspace/Main.java'],
                    tmpDir,
                    timeoutMs: CodeRunner.COMPILE_TIMEOUT,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                    writableWorkspace: true, // .class files must land back on the host
                });
            } else {
                await execFileAsync('javac', [filePath], {
                    timeout: CodeRunner.COMPILE_TIMEOUT,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                    cwd: tmpDir,
                });
            }
        } catch (err: any) {
            const msg = this.sanitizeError(err.stderr || err.message, tmpDir);
            return {
                totalTests: testCases.length,
                passed: 0,
                failed: testCases.length,
                results: testCases.map(tc => ({
                    testCaseId: tc.id, passed: false, actual: null,
                    error: 'Compilation failed', runtime: 0, isHidden: tc.isHidden,
                    ...(!tc.isHidden ? { input: tc.input, expected: tc.expectedOutput } : {}),
                })),
                compilationError: msg,
                overallRuntime: 0,
            };
        }

        // Execute
        try {
            const { stdout } = this.useDocker()
                ? await this.sandbox.run({
                    language: 'java',
                    command: ['java', '-cp', '/workspace', '-Xmx256m', 'Main'],
                    tmpDir,
                    timeoutMs: SANDBOX_RUN_TIMEOUT_MS,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                })
                : await execFileAsync('java', ['-cp', tmpDir, '-Xmx256m', 'Main'], {
                    timeout: CodeRunner.TOTAL_TIMEOUT,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                    cwd: tmpDir,
                    env: { PATH: process.env.PATH },
                });
            return this.buildResult(stdout, testCases, tmpDir);
        } catch (err: any) {
            return this.buildErrorResult(err, testCases, tmpDir);
        }
    }

    private generateJavaWrapper(
        code: string, testCases: TestCaseInput[], sig: FunctionSignature, isVoid: boolean
    ): string {
        const paramTypes = sig.paramTypes || [];
        const returnType = sig.returnType || 'void';

        const testBlocks = testCases.map((tc, i) => {
            const argDecls = sig.paramNames.map((name, j) => {
                const type = paramTypes[j] || 'Object';
                const declType = this.javaDeclType(type);
                const literal = this.jsonToJavaLiteral(tc.input[name], type);
                return `            ${declType} ${name}_${i} = ${literal};`;
            }).join('\n');

            const argsList = sig.paramNames.map(n => `${n}_${i}`).join(', ');

            let captureCode: string;
            if (isVoid) {
                captureCode = `            sol.${sig.funcName}(${argsList});
            String __rj = toJson(${sig.paramNames[0]}_${i});`;
            } else {
                const declType = this.javaDeclType(returnType);
                captureCode = `            ${declType} __r_${i} = sol.${sig.funcName}(${argsList});
            String __rj = toJson(__r_${i});`;
            }

            return `
            // Test ${i}
            try {
${argDecls}
                long __s_${i} = System.nanoTime();
${captureCode}
                long __e_${i} = System.nanoTime();
                sb.append("{\\"actual\\":").append(__rj).append(",\\"error\\":null,\\"runtime\\":").append((__e_${i}-__s_${i})/1e6).append("}");
            } catch (Exception __ex_${i}) {
                sb.append("{\\"actual\\":null,\\"error\\":\\"").append(__ex_${i}.getMessage() != null ? __ex_${i}.getMessage().replace("\\"","'") : "error").append("\\",\\"runtime\\":0}");
            }${i < testCases.length - 1 ? '\n            sb.append(",");' : ''}`;
        }).join('\n');

        return `import java.util.*;

${code}

public class Main {
    static String toJson(Object o) {
        if (o == null) return "null";
        if (o instanceof Boolean || o instanceof Integer || o instanceof Long || o instanceof Double || o instanceof Float)
            return o.toString();
        if (o instanceof String) return "\\"" + ((String)o).replace("\\"","'") + "\\"";
        if (o instanceof int[]) {
            int[] a = (int[])o; StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < a.length; i++) { if (i > 0) s.append(","); s.append(a[i]); }
            return s.append("]").toString();
        }
        if (o instanceof char[]) {
            char[] a = (char[])o; StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < a.length; i++) { if (i > 0) s.append(","); s.append("\\"").append(a[i]).append("\\""); }
            return s.append("]").toString();
        }
        if (o instanceof boolean[]) {
            boolean[] a = (boolean[])o; StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < a.length; i++) { if (i > 0) s.append(","); s.append(a[i]); }
            return s.append("]").toString();
        }
        if (o instanceof double[]) {
            double[] a = (double[])o; StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < a.length; i++) { if (i > 0) s.append(","); s.append(a[i]); }
            return s.append("]").toString();
        }
        if (o instanceof int[][]) {
            int[][] a = (int[][])o; StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < a.length; i++) { if (i > 0) s.append(","); s.append(toJson(a[i])); }
            return s.append("]").toString();
        }
        if (o instanceof String[]) {
            String[] a = (String[])o; StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < a.length; i++) { if (i > 0) s.append(","); s.append(toJson(a[i])); }
            return s.append("]").toString();
        }
        if (o instanceof List) {
            List<?> l = (List<?>)o; StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < l.size(); i++) { if (i > 0) s.append(","); s.append(toJson(l.get(i))); }
            return s.append("]").toString();
        }
        return o.toString();
    }

    static String toJson(int v) { return String.valueOf(v); }
    static String toJson(long v) { return String.valueOf(v); }
    static String toJson(double v) { return String.valueOf(v); }
    static String toJson(boolean v) { return String.valueOf(v); }

    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            StringBuilder sb = new StringBuilder();
            sb.append("[");
${testBlocks}
            sb.append("]");
            System.out.print(sb.toString());
        } catch (Exception e) {
            System.out.print("[{\\"actual\\":null,\\"error\\":\\"" + e.getMessage() + "\\",\\"runtime\\":0}]");
        }
    }
}
`;
    }

    private javaDeclType(type: string): string {
        return type;
    }

    private jsonToJavaLiteral(value: any, javaType: string): string {
        if (value === null || value === undefined) return 'null';
        const type = javaType.replace('&', '').trim();

        if (type === 'int') return String(value);
        if (type === 'long') return `${value}L`;
        if (type === 'double') return `${value}d`;
        if (type === 'float') return `${value}f`;
        if (type === 'boolean') return String(value);
        if (type === 'char') return `'${value}'`;
        if (type === 'String') return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

        if (type === 'int[]' && Array.isArray(value))
            return `new int[]{${value.join(', ')}}`;
        if (type === 'char[]' && Array.isArray(value))
            return `new char[]{${value.map((c: string) => `'${c}'`).join(', ')}}`;
        if (type === 'String[]' && Array.isArray(value))
            return `new String[]{${value.map((s: string) => `"${String(s).replace(/"/g, '\\"')}"`).join(', ')}}`;
        if (type === 'int[][]' && Array.isArray(value))
            return `new int[][]{${value.map((row: number[]) => `{${row.join(', ')}}`).join(', ')}}`;
        if (type === 'boolean[]' && Array.isArray(value))
            return `new boolean[]{${value.join(', ')}}`;
        if (type === 'double[]' && Array.isArray(value))
            return `new double[]{${value.map((v: number) => `${v}d`).join(', ')}}`;

        if (type.startsWith('List<') && Array.isArray(value)) {
            if (type === 'List<String>')
                return `new ArrayList<>(Arrays.asList(${value.map((s: string) => `"${String(s).replace(/"/g, '\\"')}"`).join(', ')}))`;
            if (type === 'List<Integer>')
                return `new ArrayList<>(Arrays.asList(${value.join(', ')}))`;
            if (type === 'List<List<String>>')
                return `new ArrayList<>(Arrays.asList(${value.map((row: string[]) =>
                    `new ArrayList<>(Arrays.asList(${row.map(s => `"${s}"`).join(', ')}))`
                ).join(', ')}))`;
            if (type === 'List<List<Integer>>')
                return `new ArrayList<>(Arrays.asList(${value.map((row: number[]) =>
                    `new ArrayList<>(Arrays.asList(${row.join(', ')}))`
                ).join(', ')}))`;
        }

        return String(value);
    }

    // ─── C++ Runner ──────────────────────────────────────────────────

    private async runCpp(
        code: string, testCases: TestCaseInput[], sig: FunctionSignature,
        isVoid: boolean, tmpDir: string
    ): Promise<ExecuteResult> {
        const wrapper = this.generateCppWrapper(code, testCases, sig, isVoid);
        const srcPath = join(tmpDir, 'solution.cpp');
        const binPath = join(tmpDir, 'solution');
        await writeFile(srcPath, wrapper, 'utf8');

        // Compile
        try {
            if (this.useDocker()) {
                await this.sandbox.run({
                    language: 'cpp',
                    command: ['g++', '-std=c++17', '-O2', '-o', '/workspace/solution', '/workspace/solution.cpp'],
                    tmpDir,
                    timeoutMs: CodeRunner.COMPILE_TIMEOUT,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                    writableWorkspace: true, // binary must land back on the host
                });
            } else {
                await execFileAsync('g++', ['-std=c++17', '-O2', '-o', binPath, srcPath], {
                    timeout: CodeRunner.COMPILE_TIMEOUT,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                    cwd: tmpDir,
                });
            }
        } catch (err: any) {
            const msg = this.sanitizeError(err.stderr || err.message, tmpDir);
            return {
                totalTests: testCases.length,
                passed: 0,
                failed: testCases.length,
                results: testCases.map(tc => ({
                    testCaseId: tc.id, passed: false, actual: null,
                    error: 'Compilation failed', runtime: 0, isHidden: tc.isHidden,
                    ...(!tc.isHidden ? { input: tc.input, expected: tc.expectedOutput } : {}),
                })),
                compilationError: msg,
                overallRuntime: 0,
            };
        }

        // Execute
        try {
            const { stdout } = this.useDocker()
                ? await this.sandbox.run({
                    language: 'cpp',
                    command: ['/workspace/solution'],
                    tmpDir,
                    timeoutMs: SANDBOX_RUN_TIMEOUT_MS,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                })
                : await execFileAsync(binPath, [], {
                    timeout: CodeRunner.TOTAL_TIMEOUT,
                    maxBuffer: CodeRunner.MAX_BUFFER,
                    cwd: tmpDir,
                    env: { PATH: process.env.PATH },
                });
            return this.buildResult(stdout, testCases, tmpDir);
        } catch (err: any) {
            return this.buildErrorResult(err, testCases, tmpDir);
        }
    }

    private generateCppWrapper(
        code: string, testCases: TestCaseInput[], sig: FunctionSignature, isVoid: boolean
    ): string {
        const paramTypes = sig.paramTypes || [];
        const classBased = this.isCppClassBased(code);
        const caller = classBased ? `sol.${sig.funcName}` : sig.funcName;

        const testBlocks = testCases.map((tc, i) => {
            const argDecls = sig.paramNames.map((name, j) => {
                const rawType = (paramTypes[j] || 'auto').replace('&', '').replace('const ', '').trim();
                const literal = this.jsonToCppLiteral(tc.input[name], rawType);
                return `        ${rawType} ${name}_${i} = ${literal};`;
            }).join('\n');

            const argsList = sig.paramNames.map(n => `${n}_${i}`).join(', ');

            let captureCode: string;
            if (isVoid) {
                captureCode = `        ${caller}(${argsList});
        string __rj_${i} = toJson(${sig.paramNames[0]}_${i});`;
            } else {
                captureCode = `        auto __r_${i} = ${caller}(${argsList});
        string __rj_${i} = toJson(__r_${i});`;
            }

            return `
        // Test ${i}
        try {
${argDecls}
            auto __ts_${i} = chrono::high_resolution_clock::now();
${captureCode}
            auto __te_${i} = chrono::high_resolution_clock::now();
            double __rt_${i} = chrono::duration<double, milli>(__te_${i} - __ts_${i}).count();
            cout << "{\\"actual\\":" << __rj_${i} << ",\\"error\\":null,\\"runtime\\":" << __rt_${i} << "}";
        } catch (const exception& __ex_${i}) {
            cout << "{\\"actual\\":null,\\"error\\":\\"" << __ex_${i}.what() << "\\",\\"runtime\\":0}";
        }${i < testCases.length - 1 ? '\n        cout << ",";' : ''}`;
        }).join('\n');

        // Strip #include and using from user code since we provide our own
        const cleanedCode = code
            .replace(/^\s*#include\s+<[^>]+>\s*$/gm, '')
            .replace(/^\s*using\s+namespace\s+\w+;\s*$/gm, '')
            .trim();

        const solInit = classBased ? '        Solution sol;\n' : '';

        return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <chrono>
#include <sstream>
#include <climits>
#include <cmath>
#include <numeric>

using namespace std;

string toJson(int v) { return to_string(v); }
string toJson(long long v) { return to_string(v); }
string toJson(double v) { ostringstream o; o << v; return o.str(); }
string toJson(bool v) { return v ? "true" : "false"; }
string toJson(const string& v) { return "\\"" + v + "\\""; }
string toJson(char v) { return string("\\"") + v + "\\""; }
string toJson(const vector<int>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += to_string(v[i]); }
    return s + "]";
}
string toJson(const vector<char>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += string("\\"") + v[i] + "\\""; }
    return s + "]";
}
string toJson(const vector<string>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += "\\"" + v[i] + "\\""; }
    return s + "]";
}
string toJson(const vector<bool>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += v[i] ? "true" : "false"; }
    return s + "]";
}
string toJson(const vector<double>& v) {
    string s = "["; ostringstream o;
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; o.str(""); o << v[i]; s += o.str(); }
    return s + "]";
}
string toJson(const vector<vector<int>>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += toJson(v[i]); }
    return s + "]";
}
string toJson(const vector<vector<string>>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += toJson(v[i]); }
    return s + "]";
}

${cleanedCode}

int main() {
    try {
${solInit}        cout << "[";
${testBlocks}
        cout << "]";
    } catch (const exception& e) {
        cout << "[{\\"actual\\":null,\\"error\\":\\"" << e.what() << "\\",\\"runtime\\":0}]";
    }
    return 0;
}
`;
    }

    private jsonToCppLiteral(value: any, cppType: string): string {
        if (value === null || value === undefined) return '{}';
        const type = cppType.replace('&', '').replace('const ', '').trim();

        if (type === 'int') return String(value);
        if (type === 'long' || type === 'long long') return `${value}LL`;
        if (type === 'double') return `${value}`;
        if (type === 'float') return `${value}f`;
        if (type === 'bool') return value ? 'true' : 'false';
        if (type === 'char') return `'${value}'`;
        if (type === 'string') return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

        if (type === 'vector<int>' && Array.isArray(value))
            return `{${value.join(', ')}}`;
        if (type === 'vector<char>' && Array.isArray(value))
            return `{${value.map((c: string) => `'${c}'`).join(', ')}}`;
        if (type === 'vector<string>' && Array.isArray(value))
            return `{${value.map((s: string) => `"${String(s).replace(/"/g, '\\"')}"`).join(', ')}}`;
        if (type === 'vector<bool>' && Array.isArray(value))
            return `{${value.map((b: boolean) => b ? 'true' : 'false').join(', ')}}`;
        if (type === 'vector<double>' && Array.isArray(value))
            return `{${value.join(', ')}}`;
        if (type === 'vector<vector<int>>' && Array.isArray(value))
            return `{${value.map((row: number[]) => `{${row.join(', ')}}`).join(', ')}}`;
        if (type === 'vector<vector<string>>' && Array.isArray(value))
            return `{${value.map((row: string[]) => `{${row.map(s => `"${s}"`).join(', ')}}`).join(', ')}}`;

        return String(value);
    }

    // ─── Process Execution ───────────────────────────────────────────

    private runWithStdin(
        command: string, args: string[], stdinData: string,
        options: { timeout: number; maxBuffer: number; cwd: string }
    ): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                cwd: options.cwd,
                env: { PATH: process.env.PATH },
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            let stdout = '';
            let stderr = '';
            let killed = false;

            const timer = setTimeout(() => {
                killed = true;
                child.kill('SIGKILL');
            }, options.timeout);

            child.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
                if (stdout.length > options.maxBuffer) {
                    killed = true;
                    child.kill('SIGKILL');
                }
            });

            child.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            child.on('close', (exitCode: number | null) => {
                clearTimeout(timer);
                if (killed) {
                    reject(new Error('TIMEOUT'));
                } else if (exitCode !== 0) {
                    reject(new Error(stderr || `Process exited with code ${exitCode}`));
                } else {
                    resolve({ stdout, stderr });
                }
            });

            child.on('error', (err: Error) => {
                clearTimeout(timer);
                reject(err);
            });

            child.stdin.write(stdinData);
            child.stdin.end();
        });
    }

    // ─── Result Building ─────────────────────────────────────────────

    private buildResult(stdout: string, testCases: TestCaseInput[], tmpDir: string): ExecuteResult {
        let rawResults: Array<{ actual: any; error: string | null; runtime: number }>;
        try {
            rawResults = JSON.parse(stdout);
        } catch {
            return {
                totalTests: testCases.length,
                passed: 0,
                failed: testCases.length,
                results: testCases.map(tc => ({
                    testCaseId: tc.id, passed: false, actual: null,
                    error: `Invalid output: ${this.sanitizeError(stdout.substring(0, 500), tmpDir)}`,
                    runtime: 0, isHidden: tc.isHidden,
                    ...(!tc.isHidden ? { input: tc.input, expected: tc.expectedOutput } : {}),
                })),
                compilationError: null,
                overallRuntime: 0,
            };
        }

        let passed = 0;
        let overallRuntime = 0;

        const results: TestCaseResult[] = testCases.map((tc, i) => {
            const raw = rawResults[i];
            if (!raw) {
                return {
                    testCaseId: tc.id, passed: false, actual: null,
                    error: 'No output for this test case', runtime: 0,
                    isHidden: tc.isHidden,
                    ...(!tc.isHidden ? { input: tc.input, expected: tc.expectedOutput } : {}),
                };
            }

            const isPassed = raw.error === null && this.compareOutput(raw.actual, tc.expectedOutput);
            if (isPassed) passed++;
            overallRuntime += raw.runtime || 0;

            return {
                testCaseId: tc.id,
                passed: isPassed,
                actual: raw.actual,
                error: raw.error,
                runtime: Math.round((raw.runtime || 0) * 100) / 100,
                isHidden: tc.isHidden,
                ...(!tc.isHidden ? { input: tc.input, expected: tc.expectedOutput } : {}),
            };
        });

        return {
            totalTests: testCases.length,
            passed,
            failed: testCases.length - passed,
            results,
            compilationError: null,
            overallRuntime: Math.round(overallRuntime * 100) / 100,
        };
    }

    private buildErrorResult(err: any, testCases: TestCaseInput[], tmpDir: string): ExecuteResult {
        const isTimeout = err.message === 'TIMEOUT' || err.killed;
        const errorMsg = isTimeout
            ? 'Time Limit Exceeded'
            : this.sanitizeError(err.stderr || err.message || 'Runtime error', tmpDir);

        return {
            totalTests: testCases.length,
            passed: 0,
            failed: testCases.length,
            results: testCases.map(tc => ({
                testCaseId: tc.id, passed: false, actual: null,
                error: errorMsg, runtime: 0, isHidden: tc.isHidden,
                ...(!tc.isHidden ? { input: tc.input, expected: tc.expectedOutput } : {}),
            })),
            compilationError: null,
            overallRuntime: 0,
        };
    }

    // ─── Output Comparison ───────────────────────────────────────────

    private compareOutput(actual: any, expected: any): boolean {


        if (actual === null && expected === null) return true;
        if (actual === null || expected === null) return false;
        if (actual === undefined) return false;

        // Float tolerance
        if (typeof actual === 'number' && typeof expected === 'number') {
            return Math.abs(actual - expected) < 1e-6;
        }

        if (typeof actual === 'boolean' || typeof expected === 'boolean') {
            return actual === expected;
        }

        if (typeof actual === 'string' && typeof expected === 'string') {
            return actual === expected;
        }

        if (Array.isArray(actual) && Array.isArray(expected)) {
            if (actual.length !== expected.length) return false;
            return actual.every((val, idx) => this.compareOutput(val, expected[idx]));
        }

        const match = JSON.stringify(actual) === JSON.stringify(expected);
        return match;
    }

    // ─── Security ────────────────────────────────────────────────────

    private validateCodeSafety(code: string, language: Language): void {
        const patterns: Record<Language, RegExp[]> = {
            javascript: [
                /require\s*\(\s*['"]child_process['"]\)/,
                /require\s*\(\s*['"]fs['"]\)/,
                /require\s*\(\s*['"]net['"]\)/,
                /require\s*\(\s*['"]http['"]\)/,
                /require\s*\(\s*['"]https['"]\)/,
                /require\s*\(\s*['"]os['"]\)/,
                /process\.env/,
                /process\.exit/,
            ],
            python: [
                /import\s+os(?:\s|$|\.)/,
                /import\s+subprocess/,
                /import\s+socket/,
                /import\s+shutil/,
                /from\s+os\s+import/,
                /from\s+subprocess\s+import/,
                /__import__/,
            ],
            java: [
                /Runtime\.getRuntime/,
                /ProcessBuilder/,
                /java\.net\./,
                /System\.exit/,
            ],
            cpp: [
                /\bsystem\s*\(/,
                /\bpopen\s*\(/,
                /\bexecv?[lp]*\s*\(/,
                /\bfork\s*\(/,
            ],
        };

        for (const pattern of patterns[language]) {
            if (pattern.test(code)) {
                throw new AppError('Code contains prohibited patterns for security reasons', 400);
            }
        }

        if (code.length > 50_000) {
            throw new AppError('Code exceeds maximum length of 50,000 characters', 400);
        }
    }

    // ─── Utilities ───────────────────────────────────────────────────

    private async createTmpDir(): Promise<string> {
        const dir = join(tmpdir(), `code-exec-${randomUUID()}`);
        await mkdir(dir, { recursive: true });
        return dir;
    }

    private async cleanupTmpDir(dir: string): Promise<void> {
        try {
            await rm(dir, { recursive: true, force: true });
        } catch (err) {
            logger.warn('Failed to clean up temp directory', { dir });
        }
    }

    private sanitizeError(error: string, tmpDir: string): string {
        let sanitized = error;
        if (tmpDir) {
            sanitized = sanitized.replaceAll(tmpDir, '<tmp>');
        }
        if (sanitized.length > 2000) {
            sanitized = sanitized.substring(0, 2000) + '... (truncated)';
        }
        return sanitized;
    }
}
