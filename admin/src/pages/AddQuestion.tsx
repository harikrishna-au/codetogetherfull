import React, { useState, useEffect } from 'react';
import AddMajorTestCases from '../components/AddMajorTestCases';
import { api } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const initialQuestion = {
  questionId: '',
  title: '',
  description: '',
  difficulty: 'Easy',
  tags: '', // comma separated string for UI, array for backend
  starterCode: '{"java":"// Write your Java code here\\nclass Solution {\\n    \\n}","python":"# Write your Python code here\\nclass Solution:\\n    pass","cpp":"// Write your C++ code here\\n#include <iostream>\\nusing namespace std;\\n\\nclass Solution {\\n\\n};","javascript":"// Write your JavaScript code here\\nfunction solution() {\\n    \\n}"}', // JSON string for UI
  hints: '', // comma separated string for UI, array for backend
  examples: '[{"input":"","output":"","explanation":""}]', // JSON string for UI
  constraints: '["1 <= n <= 10^4", "1 <= nums[i] <= 10^9"]', // JSON string for UI, array for backend
  compileTestCases: '[{"input":{},"output":""}]', // JSON string for UI
  createdAt: '',
  updatedAt: '',
  majorTestCases: '[{"input":{},"output":""}]', // JSON string for UI
};

export default function AddQuestion({ nextId }: { nextId: string }) {
  const [form, setForm] = useState(initialQuestion);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [loading, setLoading] = useState(false);

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
        constraints: data.constraints ? JSON.stringify(data.constraints, null, 2) : '["1 <= n <= 10^4"]',
        compileTestCases: data.compileTestCases ? JSON.stringify(data.compileTestCases, null, 2) : '[{"input":{},"output":""}]',
        majorTestCases: data.majorTestCases ? JSON.stringify(data.majorTestCases, null, 2) : '[{"input":{},"output":""}]',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      }));
      setJsonInput('');
    } catch (error) {
      setJsonError('Invalid JSON format: ' + (error as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse JSON fields
      const tags = form.tags.split(',').map(t => t.trim()).filter(t => t);
      const hints = form.hints.split(',').map(h => h.trim()).filter(h => h);
      const starterCode = JSON.parse(form.starterCode);
      const examples = JSON.parse(form.examples);
      const constraints = JSON.parse(form.constraints);
      const compileTestCases = JSON.parse(form.compileTestCases);
      const majorTestCases = JSON.parse(form.majorTestCases);

      const questionData = {
        ...form,
        tags,
        hints,
        starterCode,
        examples,
        constraints,
        compileTestCases,
        majorTestCases,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await api.questions.add(questionData);
      alert('Question added successfully!');
      setForm(initialQuestion);
      // Update the question ID for the next question
      if (nextId) {
        setForm(f => ({ ...f, questionId: nextId }));
      }
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Add Question</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Question Form */}
        <Card className="h-fit">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Question Details</h2>

          {/* JSON Import */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Import from JSON (Optional)
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={4}
              placeholder="Paste JSON data here to auto-fill the form..."
            />
            {jsonError && (
              <p className="text-red-600 text-sm mt-1">{jsonError}</p>
            )}
            <div className="mt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handlePasteJson}
                type="button"
              >
                Import JSON
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Question ID"
              value={form.questionId}
              onChange={(e) => setForm({ ...form, questionId: e.target.value })}
              required
            />

            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <Input
              label="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="string, two-pointers, algorithms"
            />

            <Input
              label="Hints (comma separated)"
              value={form.hints}
              onChange={(e) => setForm({ ...form, hints: e.target.value })}
              placeholder="Try using two pointers, Consider edge cases"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starter Code (JSON)
              </label>
              <textarea
                value={form.starterCode}
                onChange={(e) => setForm({ ...form, starterCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                rows={8}
                placeholder='{"java":"..."}'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Examples (JSON)
              </label>
              <textarea
                value={form.examples}
                onChange={(e) => setForm({ ...form, examples: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                rows={6}
                placeholder='[{"input":"...","output":"...","explanation":"..."}]'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Constraints (JSON Array)
              </label>
              <textarea
                value={form.constraints}
                onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                rows={4}
                placeholder='["1 <= n <= 10^5"]'
              />
            </div>

            <Button
              type="submit"
              variant="success"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Adding Question...' : 'Add Question'}
            </Button>
          </form>
        </Card>

        {/* Major Test Cases */}
        <Card className="h-fit">
          <AddMajorTestCases nextId={nextId} />
        </Card>
      </div>
    </div>
  );
}
