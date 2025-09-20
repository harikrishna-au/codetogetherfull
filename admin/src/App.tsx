import React from 'react';
import AddQuestion from './AddQuestion';
import AddMajorTestCases from './AddMajorTestCases';
import ClearQueues from './ClearQueues';
import { useNextQuestionId } from './hooks/useNextQuestionId';
// Removed stray string './AddQuestion'

export default function App() {
  const nextId = useNextQuestionId();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col items-center p-0">
      <header className="w-full bg-white/90 shadow-lg pt-6 pb-2 mb-8 flex flex-col items-center relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 shadow-md">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h.01M7 11h10M7 15h10"/></svg>
          </span>
          <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight">Admin Panel</h1>
        </div>
      </header>
      <main className="w-full flex-1 flex flex-col items-center justify-start px-4">
        <div className="admin-card" style={{marginTop:0, marginBottom:'2rem', maxWidth:'600px', minWidth:'320px', width:'100%'}}>
          <ClearQueues />
        </div>
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Add Question & Major Test Cases</h2>
        <div className="admin-flex-row">
          <div className="admin-card" style={{marginTop:0, marginBottom:0, maxWidth:'600px', minWidth:'320px', flex:1}}>
            <AddQuestion nextId={nextId} />
          </div>
          <div className="admin-card" style={{marginTop:0, marginBottom:0, maxWidth:'600px', minWidth:'320px', flex:1}}>
            <AddMajorTestCases nextId={nextId} />
          </div>
        </div>
      </main>
      <footer className="w-full text-center text-xs text-gray-400 py-4 mt-8">&copy; {new Date().getFullYear()} CodeTogether Admin</footer>
    </div>
  );
}
