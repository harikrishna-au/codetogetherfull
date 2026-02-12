import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';
import { FileText } from 'lucide-react';

interface Question {
  id?: string;
  questionId?: string; // Add questionId field
  title: string;
  difficulty: string;
  description: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
  tags?: string[];
  hints?: string[];
  starterCode?: any;
  compileTestCases?: any;
  majorTestCases?: any;
}

interface TestCase {
  input: any;
  output: string;
  explanation?: string;
}

export default function ViewQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedTestCases, setSelectedTestCases] = useState<TestCase[]>([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const questions = await api.questions.getAll();
      setQuestions(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestCases = async (questionId: string) => {
    setLoadingTestCases(true);
    try {
      const testCases = await api.testCases.getByQuestionId(questionId);
      setSelectedTestCases(testCases);
    } catch (error) {
      console.error('Error fetching test cases:', error);
      setSelectedTestCases([]);
    } finally {
      setLoadingTestCases(false);
    }
  };

  const handleQuestionSelect = (question: Question) => {
    setSelectedQuestion(question);
    const qId = question.questionId || question.id;
    if (qId) {
      fetchTestCases(qId);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.questions.delete(questionId);
      setQuestions(questions.filter(q => (q.questionId || q.id) !== questionId));
      if ((selectedQuestion?.questionId || selectedQuestion?.id) === questionId) {
        setSelectedQuestion(null);
        setSelectedTestCases([]);
      }
      alert('Question deleted successfully!');
    } catch (error) {
      alert('Failed to delete question: ' + error);
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || question.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 text-lg">Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Questions ({questions.length})</h1>
        <Button onClick={fetchQuestions}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[42px] bg-white"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Results ({filteredQuestions.length})
          </h2>

          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {filteredQuestions.map((question) => {
              const qId = question.questionId || question.id;
              const isSelected = (selectedQuestion?.questionId || selectedQuestion?.id) === qId;

              return (
                <div
                  key={qId}
                  onClick={() => handleQuestionSelect(question)}
                  className={`bg-white rounded-md p-4 cursor-pointer transition-all duration-200 border ${isSelected
                    ? 'border-black ring-1 ring-black'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{question.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{question.description}</p>
                    </div>
                    <Badge variant={getDifficultyVariant(question.difficulty) as any}>
                      {question.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500 font-mono">ID: {qId}</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (qId) deleteQuestion(qId);
                      }}
                      className="!px-2 !py-0.5 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm p-6">
              No questions found matching your criteria.
            </div>
          )}
        </div>

        {/* Question Details */}
        <div className="lg:col-span-2">
          {selectedQuestion ? (
            <Card className="sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedQuestion.title}</h2>
                  <Badge variant={getDifficultyVariant(selectedQuestion.difficulty) as any}>
                    {selectedQuestion.difficulty}
                  </Badge>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedQuestion.description}
                  </div>
                </div>

                {selectedQuestion.examples && selectedQuestion.examples.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Examples</h3>
                    <div className="space-y-4">
                      {selectedQuestion.examples.map((example, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wider">Example {index + 1}</h4>
                          <div className="space-y-2 font-mono text-sm">
                            <div><strong className="text-gray-500">Input:</strong> {example.input}</div>
                            <div><strong className="text-gray-500">Output:</strong> {example.output}</div>
                            {example.explanation && (
                              <div><strong className="text-gray-500">Explanation:</strong> {example.explanation}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuestion.constraints && selectedQuestion.constraints.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Constraints</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {selectedQuestion.constraints.map((constraint, index) => (
                        <li key={index} className="font-mono text-sm">{constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Test Cases Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Major Test Cases</h3>
                    <Badge variant="info" size="sm">{selectedTestCases.length} Cases</Badge>
                  </div>

                  {loadingTestCases ? (
                    <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading test cases...</span>
                    </div>
                  ) : selectedTestCases.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {selectedTestCases.map((testCase, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2 text-xs uppercase tracking-wider">Test Case {index + 1}</h4>
                          <div className="space-y-2 font-mono text-sm">
                            <div>
                              <strong className="text-gray-500 block mb-1">Input:</strong>
                              <pre className="bg-white p-2 rounded border border-gray-200 text-xs overflow-x-auto">
                                {typeof testCase.input === 'object'
                                  ? JSON.stringify(testCase.input, null, 2)
                                  : testCase.input}
                              </pre>
                            </div>
                            <div>
                              <strong className="text-gray-500 block mb-1">Expected Output:</strong>
                              <pre className="bg-white p-2 rounded border border-gray-200 text-xs overflow-x-auto">
                                {testCase.output}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                      No major test cases found for this question
                    </div>
                  )}
                </div>

                {/* Additional Question Info */}
                {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestion.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Technical Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block">Question ID</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">{selectedQuestion.questionId || selectedQuestion.id}</code>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center text-center text-gray-500 p-12">
              <div className="flex flex-col items-center">
                <FileText size={64} className="mb-4 opacity-20 text-gray-400" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Question Selected</h3>
                <p>Select a question from the list to view its full details.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
