import React, { useState, useEffect } from 'react';
import { useNextQuestionId } from './hooks/useNextQuestionId';


const initialQuestion = {
  questionId: '',
  title: '',
  description: '',
  difficulty: 'Easy',
  tags: '', // comma separated string for UI, array for backend
  starterCode: '{"java":"","python":"","cpp":"","javascript":""}', // JSON string for UI
  hints: '', // comma separated string for UI, array for backend
  examples: '[{"input":"","output":"","explanation":""}]', // JSON string for UI
  compileTestCases: '[{"input":{},"output":""}]', // JSON string for UI
  createdAt: '',
  updatedAt: '',
  majorTestCases: '[{"input":{},"output":""}]', // JSON string for UI
};

export default function AddQuestion({ nextId }: { nextId: string }) {
  const [form, setForm] = useState(initialQuestion);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');


  // Always update questionId in form when nextId changes
  useEffect(() => {
    if (nextId && form.questionId !== nextId) {
      setForm(f => ({ ...f, questionId: nextId }));
    }
  }, [nextId]);

  const handlePasteJson = () => {
    setJsonError('');
    try {
      const data = JSON.parse(jsonInput);
      setForm(f => ({
        ...f,
        questionId: nextId || '',
        title: data.title || '',
        description: data.description || '',
        difficulty: data.difficulty || 'Easy',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
        starterCode: data.starterCode ? JSON.stringify(data.starterCode, null, 2) : '{"java":"","python":"","cpp":"","javascript":""}',
        hints: Array.isArray(data.hints) ? data.hints.join(', ') : (data.hints || ''),
        examples: data.examples ? JSON.stringify(data.examples, null, 2) : '[{"input":"","output":"","explanation":""}]',
        compileTestCases: data.compileTestCases ? JSON.stringify(data.compileTestCases, null, 2) : '[{"input":{},"output":""}]',
        majorTestCases: data.majorTestCases ? JSON.stringify(data.majorTestCases, null, 2) : '[{"input":{},"output":""}]',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      }));
    } catch (e) {
      setJsonError('Invalid JSON');
    }
  };
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/admin-api/admin/add-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      });
      if (res.ok) {
        setResult('Question added successfully!');
        // After successful add, reset form and update questionId to nextId
        setForm(f => ({ ...initialQuestion, questionId: nextId }));
      } else {
        setResult('Failed to add question.');
      }
    } catch (e) {
      setResult('Error adding question.');
    }
    setLoading(false);
  };

  return (
      <div style={{width:'100%'}}>
        <div className="admin-card" style={{marginBottom: '2rem', background:'#f3f6fa'}}>
          <div className="admin-form-group">
            <label className="admin-form-label">Paste Full Question JSON</label>
            <textarea
              className="admin-form-textarea"
              rows={6}
              placeholder="Paste full question JSON here..."
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
            />
            <button className="admin-btn-primary" style={{marginTop:'0.5rem', width:'fit-content'}} type="button" onClick={handlePasteJson}>Fill Form</button>
            {jsonError && <div className="admin-feedback error">{jsonError}</div>}
          </div>
        </div>
        <form style={{width:'100%'}} onSubmit={handleSubmit}>
      <h2>Add New Question</h2>
  <div className="admin-form-group">
        <label className="admin-form-label">Question ID</label>
        <input className="admin-form-input" name="questionId" placeholder="Question ID" value={form.questionId} readOnly />
      </div>
      <div className="admin-form-group">
        <label className="admin-form-label">Title</label>
        <input className="admin-form-input" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
      </div>
      <div className="admin-form-group">
        <label className="admin-form-label">Tags (comma separated)</label>
        <input className="admin-form-input" name="tags" placeholder="Tags (comma separated)" value={form.tags} onChange={handleChange} />
      </div>
      <div className="admin-form-group">
        <label className="admin-form-label">Difficulty</label>
        <select className="admin-form-select" name="difficulty" value={form.difficulty} onChange={handleChange} required>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>
      <div className="admin-form-group">
        <label className="admin-form-label">Description</label>
        <textarea className="admin-form-textarea" name="description" placeholder="Description" value={form.description} onChange={handleChange} required rows={3} />
      </div>
      <div className="admin-form-group">
  <label className="admin-form-label">Starter Code (JSON: {'{"java":"","python":"","cpp":"","javascript":""}'} )</label>
        <textarea className="admin-form-textarea" name="starterCode" placeholder='{"java":"...","python":"...","cpp":"...","javascript":"..."}' value={form.starterCode} onChange={handleChange} rows={3} />
      </div>
      <div className="admin-form-group">
        <label className="admin-form-label">Hints (comma separated)</label>
        <textarea className="admin-form-textarea" name="hints" placeholder="Hints (comma separated)" value={form.hints} onChange={handleChange} rows={2} />
      </div>
      <div className="admin-form-group">
        <label className="admin-form-label">Examples (JSON array)</label>
        <textarea className="admin-form-textarea" name="examples" placeholder='[{"input":"","output":"","explanation":""}]' value={form.examples} onChange={handleChange} rows={3} />
      </div>
      <div className="admin-form-group">
        <label className="admin-form-label">Compile Test Cases (JSON array)</label>
        <textarea className="admin-form-textarea" name="compileTestCases" placeholder='[{"input":{},"output":""}]' value={form.compileTestCases} onChange={handleChange} rows={3} />
      </div>
      <div className="admin-form-actions">
        <button className="admin-btn-primary" type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Question'}
        </button>
      </div>
      {result && <div className={`admin-feedback ${result.includes('success') ? 'success' : 'error'}`}>{result}</div>}
    </form>
  </div>
);
}
