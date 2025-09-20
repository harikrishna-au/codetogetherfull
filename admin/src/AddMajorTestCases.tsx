import React, { useState, useEffect } from 'react';

export default function AddMajorTestCases({ nextId }: { nextId: string }) {
  const [questionId, setQuestionId] = useState(nextId || '');
  const [testCases, setTestCases] = useState('[{"input":{},"output":""}]');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (nextId && questionId !== nextId) {
      setQuestionId(nextId);
    }
  }, [nextId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const parsed = JSON.parse(testCases);
      if (!Array.isArray(parsed)) throw new Error('Test cases must be a JSON array');
      const res = await fetch(`/admin-api/testcases/${questionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases: parsed }),
      });
      if (res.ok) {
        setResult('Major test cases saved!');
      } else {
        setResult('Failed to save test cases.');
      }
    } catch (e) {
      setResult('Invalid JSON or error saving test cases.');
    }
    setLoading(false);
  };

  return (
    <div style={{width:'100%'}}>
      <form style={{width:'100%'}} onSubmit={handleSubmit}>
        <h2>Add Major Test Cases</h2>
        <div className="admin-form-group">
          <label className="admin-form-label">Question ID</label>
          <input className="admin-form-input" name="questionId" placeholder="Question ID" value={questionId} onChange={e => setQuestionId(e.target.value)} required />
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">Major Test Cases (JSON array)</label>
          <textarea className="admin-form-textarea" name="testCases" placeholder='[{"input":{},"output":""}]' value={testCases} onChange={e => setTestCases(e.target.value)} rows={5} />
        </div>
        <div className="admin-form-actions">
          <button className="admin-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Major Test Cases'}
          </button>
        </div>
        {result && <div className={`admin-feedback ${result.includes('saved') ? 'success' : 'error'}`}>{result}</div>}
      </form>
    </div>
  );
}
