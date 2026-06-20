import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  input?: Record<string, any>;
  expected?: any;
  actual: any;
  error: string | null;
  runtime: number;
  isHidden: boolean;
}

export interface ExecuteResult {
  totalTests: number;
  passed: number;
  failed: number;
  results: TestCaseResult[];
  compilationError: string | null;
  overallRuntime: number;
  /** Client-side only: friendly message for request failures (429 rate limit, 5xx, timeout) */
  serviceError?: string | null;
}

interface ResultsPanelProps {
  isSubmitting: boolean;
  executeResult: ExecuteResult | null;
}

const TestCaseRow: React.FC<{ result: TestCaseResult; index: number }> = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg mb-1.5 overflow-hidden border"
         style={{ borderColor: result.passed ? 'rgba(78,201,176,0.22)' : 'rgba(255,107,94,0.22)', background: result.passed ? 'rgba(78,201,176,0.04)' : 'rgba(255,107,94,0.04)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          {result.passed ? (
            <CheckCircle className="w-4 h-4 text-[#6fe9cf] flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-[#ff8a7e] flex-shrink-0" />
          )}
          <span className={`font-medium ${result.passed ? 'text-[#6fe9cf]' : 'text-[#ff8a7e]'}`}>
            {result.isHidden ? `Hidden Test ${index + 1}` : `Test Case ${index + 1}`}
          </span>
          {result.error && (
            <span className="text-xs text-[#ff8a7e]/80 truncate max-w-[200px]">{result.error}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#5c636b] flex items-center gap-1 font-mono-ct">
            <Clock className="w-3 h-3" />{result.runtime}ms
          </span>
          {expanded ? <ChevronDown className="w-3 h-3 text-[#5c636b]" /> : <ChevronRight className="w-3 h-3 text-[#5c636b]" />}
        </div>
      </button>
      {expanded && !result.isHidden && (
        <div className="px-3 pb-2.5 space-y-1.5 text-xs border-t border-white/[0.06] pt-2">
          {result.input && (
            <div>
              <span className="text-[#5c636b]">Input: </span>
              <span className="text-[#cfd3d6] font-mono-ct">{JSON.stringify(result.input)}</span>
            </div>
          )}
          <div>
            <span className="text-[#5c636b]">Expected: </span>
            <span className="text-[#cfd3d6] font-mono-ct">{JSON.stringify(result.expected)}</span>
          </div>
          <div>
            <span className="text-[#5c636b]">Got: </span>
            <span className={`font-mono-ct ${result.passed ? 'text-[#6fe9cf]' : 'text-[#ff8a7e]'}`}>
              {JSON.stringify(result.actual)}
            </span>
          </div>
          {result.error && (
            <div className="bg-red-900/30 border border-red-700 rounded p-2 mt-1">
              <span className="text-red-300 font-mono whitespace-pre-wrap">{result.error}</span>
            </div>
          )}
        </div>
      )}
      {expanded && result.isHidden && (
        <div className="px-3 pb-2 text-xs border-t border-[#3e3e42] pt-2 text-[#888888]">
          Test case details are hidden.
          {result.error && (
            <div className="bg-red-900/30 border border-red-700 rounded p-2 mt-1">
              <span className="text-red-300 font-mono whitespace-pre-wrap">{result.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ResultsPanel: React.FC<ResultsPanelProps> = ({ isSubmitting, executeResult }) => {
  const allPassed = executeResult && executeResult.passed === executeResult.totalTests;

  const ratio = executeResult && executeResult.totalTests > 0
    ? executeResult.passed / executeResult.totalTests : 0;

  return (
    <div className="h-full bg-[#0a0c0e] border-t border-white/[0.08] flex flex-col">
      <div className="h-9 border-b border-white/[0.08] flex items-center justify-between px-4 flex-shrink-0"
           style={{ background: 'linear-gradient(180deg, #0e1114, #0a0c0e)' }}>
        <span className="flex items-center gap-1.5 text-xs font-mono-ct font-semibold text-[#9aa1a9]">
          <span className={`w-1.5 h-1.5 rounded-full ${allPassed ? 'bg-[#4ec9b0]' : executeResult ? 'bg-[#ff6b5e]' : 'bg-[#5c636b]'}`} />
          test results
        </span>
        {executeResult && !executeResult.serviceError && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${ratio * 100}%`, background: allPassed ? 'linear-gradient(90deg,#4ec9b0,#6fe9cf)' : 'linear-gradient(90deg,#ff6b5e,#ff8a7e)' }} />
            </div>
            <span className={`text-xs font-semibold tabular-nums ${allPassed ? 'text-[#6fe9cf]' : 'text-[#ff8a7e]'}`}>
              {executeResult.passed}/{executeResult.totalTests}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isSubmitting && (
          <div className="flex items-center gap-2 text-[#9aa1a9] text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-[#4ec9b0]" />
            <span>Running test cases…</span>
          </div>
        )}

        {!isSubmitting && !executeResult && (
          <div className="text-sm text-[#5c636b]">
            Hit <span className="text-[#6fe9cf] font-semibold">Submit</span> to run your code against every test case.
          </div>
        )}

        {!isSubmitting && executeResult?.serviceError && (
          <div className="flex items-start gap-2 text-sm text-yellow-300 bg-yellow-900/30 border border-yellow-700 rounded p-2 mb-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{executeResult.serviceError}</span>
          </div>
        )}

        {!isSubmitting && executeResult && !executeResult.serviceError && (
          <>
            {executeResult.compilationError ? (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Compilation Error</span>
                </div>
                <pre className="bg-red-900/30 border border-red-700 rounded p-2 text-xs text-red-300 font-mono whitespace-pre-wrap overflow-x-auto">
                  {executeResult.compilationError}
                </pre>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-3 text-xs text-[#5c636b]">
                  <span className="flex items-center gap-1 font-mono-ct">
                    <Clock className="w-3 h-3" />
                    {executeResult.overallRuntime}ms
                  </span>
                  <span className={`font-semibold ${allPassed ? 'text-[#6fe9cf]' : 'text-[#ff8a7e]'}`}>
                    {allPassed ? '✓ All tests passed' : `${executeResult.failed} test(s) failed`}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {executeResult.results.map((r, i) => (
                    <TestCaseRow key={r.testCaseId} result={r} index={i} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
