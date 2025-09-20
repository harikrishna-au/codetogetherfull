import React from 'react';
import { CheckCircle } from 'lucide-react';

const ResultsPanel: React.FC = () => {
  return (
    <div className="h-full bg-[#252526] border-t border-[#3e3e42]">
      <div className="h-8 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-4">
        <span className="text-sm text-[#cccccc]">Test Results</span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center space-x-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Test case 1 passed</span>
        </div>
        <div className="flex items-center space-x-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Test case 2 passed</span>
        </div>
        <div className="text-xs text-[#888888] mt-4">
          Runtime: 64 ms, faster than 85.2% of JavaScript submissions.
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
