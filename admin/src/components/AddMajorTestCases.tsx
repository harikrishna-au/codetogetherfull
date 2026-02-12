import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import Badge from './Badge';

export default function AddMajorTestCases({ nextId }: { nextId: string }) {
    const [questionId, setQuestionId] = useState(nextId || '');
    const [testCases, setTestCases] = useState('[{"input":{},"output":""}]');
    const [result, setResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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

            await api.testCases.add(questionId, parsed);
            setResult({ message: 'Major test cases saved successfully!', type: 'success' });
            setTestCases('[{"input":{},"output":""}]'); // Reset form optionally
        } catch (e: any) {
            setResult({
                message: e.message || 'Error saving test cases.',
                type: 'error'
            });
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Add Major Test Cases</h2>
                <Badge variant="info" size="sm">Separate API</Badge>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Question ID"
                    value={questionId}
                    onChange={(e) => setQuestionId(e.target.value)}
                    placeholder="Enter Question ID"
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Major Test Cases (JSON Array)
                    </label>
                    <textarea
                        value={testCases}
                        onChange={(e) => setTestCases(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        rows={5}
                        placeholder='[{"input":{},"output":""}]'
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        These test cases are stored separately and used for full validation.
                    </p>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Saving...' : 'Save Major Test Cases'}
                    </Button>
                </div>

                {result && (
                    <div className={`p-3 rounded-md text-sm ${result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {result.message}
                    </div>
                )}
            </form>
        </div>
    );
}
