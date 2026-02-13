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
}

interface ResultsPanelProps {
  isSubmitting: boolean;
  executeResult: ExecuteResult | null;
}

const TestCaseRow: React.FC<{ result: TestCaseResult; index: number }> = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#3e3e42] rounded mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-[#2d2d30] transition-colors"
      >
        <div className="flex items-center gap-2">
          {result.passed ? (
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
            {result.isHidden ? `Hidden Test ${index + 1}` : `Test Case ${index + 1}`}
          </span>
          {result.error && (
            <span className="text-xs text-red-300 truncate max-w-[200px]">{result.error}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#888888] flex items-center gap-1">
            <Clock className="w-3 h-3" />{result.runtime}ms
          </span>
          {expanded ? <ChevronDown className="w-3 h-3 text-[#888888]" /> : <ChevronRight className="w-3 h-3 text-[#888888]" />}
        </div>
      </button>
      {expanded && !result.isHidden && (
        <div className="px-3 pb-2 space-y-1.5 text-xs border-t border-[#3e3e42] pt-2">
          {result.input && (
            <div>
              <span className="text-[#888888]">Input: </span>
              <span className="text-[#cccccc] font-mono">{JSON.stringify(result.input)}</span>
            </div>
          )}
          <div>
            <span className="text-[#888888]">Expected: </span>
            <span className="text-[#cccccc] font-mono">{JSON.stringify(result.expected)}</span>
          </div>
          <div>
            <span className="text-[#888888]">Got: </span>
            <span className={`font-mono ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
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

  return (
    <div className="h-full bg-[#252526] border-t border-[#3e3e42] flex flex-col">
      <div className="h-8 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between px-4 flex-shrink-0">
        <span className="text-sm text-[#cccccc]">Test Results</span>
        {executeResult && (
          <span className={`text-xs font-medium ${allPassed ? 'text-green-400' : 'text-red-400'}`}>
            {executeResult.passed}/{executeResult.totalTests} passed
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isSubmitting && (
          <div className="flex items-center gap-2 text-[#cccccc] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Running test cases...</span>
          </div>
        )}

        {!isSubmitting && !executeResult && (
          <div className="text-sm text-[#888888]">
            Click <span className="text-white">Submit</span> to run your code against test cases.
          </div>
        )}

        {!isSubmitting && executeResult && (
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
                <div className="flex items-center gap-4 mb-3 text-xs text-[#888888]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Runtime: {executeResult.overallRuntime}ms
                  </span>
                  <span className={allPassed ? 'text-green-400' : 'text-yellow-400'}>
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
