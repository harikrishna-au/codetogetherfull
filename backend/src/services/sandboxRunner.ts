import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Docker-isolated execution backend for user-submitted code (A2).
 *
 * Each submission runs in a short-lived, locked-down container:
 *  - no network (`--network none`)
 *  - 256 MB memory, 0.5 CPU, max 64 processes
 *  - read-only root filesystem + read-only bind mount of the code dir
 *    (compile phases get a writable mount so artifacts land back on the host)
 *  - non-root user (host uid/gid so host-side cleanup still works)
 *  - hard wall-clock timeout enforced host-side via `docker kill`
 *
 * Images must be pre-pulled on the host (see SANDBOX_IMAGES below):
 *   docker pull node:20-alpine python:3.12-alpine eclipse-temurin:21-jdk-alpine gcc:13
 *
 * The regex blacklist in CodeRunner.validateCodeSafety stays as defense-in-depth;
 * this container boundary is the actual security boundary.
 */

export type SandboxLanguage = 'javascript' | 'python' | 'java' | 'cpp';

/** One official image per runtime — simple to pull and patch independently. */
export const SANDBOX_IMAGES: Record<SandboxLanguage, string> = {
    javascript: 'node:20-alpine',
    python: 'python:3.12-alpine',
    java: 'eclipse-temurin:21-jdk-alpine',
    cpp: 'gcc:13',
};

/** Hard wall-clock limit for the run phase (spec: 10s). */
export const SANDBOX_RUN_TIMEOUT_MS = 10_000;

export interface SandboxRunOptions {
    language: SandboxLanguage;
    /** argv executed inside the container; the code dir is mounted at /workspace */
    command: string[];
    /** Host directory containing the generated harness/code files */
    tmpDir: string;
    /** Piped to the container's stdin (test case payload for JS/Python) */
    stdinData?: string;
    timeoutMs: number;
    maxBuffer: number;
    /** Compile phases need to write artifacts (.class / binary) back to tmpDir */
    writableWorkspace?: boolean;
}

interface ProcessResult {
    stdout: string;
    stderr: string;
}

export class SandboxRunner {
    async run(opts: SandboxRunOptions): Promise<ProcessResult> {
        const image = SANDBOX_IMAGES[opts.language];
        const containerName = `arena-exec-${randomUUID()}`;

        // Run as the host user: non-root inside the container, and compile
        // artifacts written through the mount stay deletable by this process.
        const uid = typeof process.getuid === 'function' ? process.getuid() : 1000;
        const gid = typeof process.getgid === 'function' ? process.getgid() : 1000;

        const dockerArgs = [
            'run', '--rm', '-i',
            '--name', containerName,
            '--network', 'none',
            '--memory', '256m',
            '--memory-swap', '256m',
            '--cpus', '0.5',
            '--pids-limit', '64',
            '--read-only',
            '--security-opt', 'no-new-privileges',
            '--user', `${uid}:${gid}`,
            '-v', `${opts.tmpDir}:/workspace${opts.writableWorkspace ? '' : ':ro'}`,
            // JVM/g++ scratch space; noexec so nothing dropped there can run
            '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m',
            '-w', '/workspace',
            image,
            ...opts.command,
        ];

        return new Promise((resolve, reject) => {
            const child = spawn('docker', dockerArgs, {
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            let stdout = '';
            let stderr = '';
            let killed = false;

            // Host-side hard kill: SIGKILL the CLI and force-remove the container.
            const timer = setTimeout(() => {
                killed = true;
                child.kill('SIGKILL');
                const killer = spawn('docker', ['kill', containerName], { stdio: 'ignore' });
                killer.on('error', () => { /* container may already be gone */ });
            }, opts.timeoutMs);

            child.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
                if (stdout.length > opts.maxBuffer) {
                    killed = true;
                    child.kill('SIGKILL');
                    spawn('docker', ['kill', containerName], { stdio: 'ignore' }).on('error', () => { });
                }
            });

            child.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            child.on('close', (exitCode: number | null) => {
                clearTimeout(timer);
                if (killed) {
                    reject(Object.assign(new Error('TIMEOUT'), { killed: true }));
                } else if (exitCode !== 0) {
                    // Same shape as execFile errors so CodeRunner's handlers keep working
                    reject(Object.assign(
                        new Error(stderr || `Sandbox exited with code ${exitCode}`),
                        { stderr },
                    ));
                } else {
                    resolve({ stdout, stderr });
                }
            });

            child.on('error', (err: NodeJS.ErrnoException) => {
                clearTimeout(timer);
                if (err.code === 'ENOENT') {
                    logger.error('Docker CLI not found — is Docker installed and on PATH?');
                    reject(Object.assign(
                        new Error('Code execution is unavailable: Docker is not installed on the server. Set EXECUTION_MODE=local for development without Docker.'),
                        { stderr: '' },
                    ));
                } else {
                    reject(err);
                }
            });

            if (opts.stdinData !== undefined) {
                child.stdin.write(opts.stdinData);
            }
            child.stdin.end();
        });
    }
}
