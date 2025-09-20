import React, { useState } from 'react';

export default function ClearQueues() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleClear = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/admin-api/admin/clear-queues', { method: 'POST' });
      if (res.ok) {
        setResult('Queues cleared successfully!');
      } else {
        setResult('Failed to clear queues.');
      }
    } catch (e) {
      setResult('Error clearing queues.');
    }
    setLoading(false);
  };

  return (
  <div style={{width:'100%', display:'flex', flexDirection:'column', alignItems:'center'}}>
      <h2>Clear All Queues</h2>
      <button
        className="admin-btn-danger"
        onClick={handleClear}
        disabled={loading}
      >
        {loading ? 'Clearing...' : 'Clear Queues'}
      </button>
      {result && <div className={`admin-feedback ${result.includes('success') ? 'success' : 'error'}`}>{result}</div>}
    </div>
  );
}
