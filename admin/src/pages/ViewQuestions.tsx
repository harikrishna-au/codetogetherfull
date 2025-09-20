import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface Question {
  id?: string;
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
    if (question.id) {
      fetchTestCases(question.id);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.questions.delete(questionId);
      setQuestions(questions.filter(q => q.id !== questionId));
      if (selectedQuestion?.id === questionId) {
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
    const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
    
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Questions ({questions.length})</h1>
        <button
          onClick={fetchQuestions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Questions ({filteredQuestions.length})
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                onClick={() => handleQuestionSelect(question)}
                className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
                  selectedQuestion?.id === question.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{question.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{question.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">ID: {question.id}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (question.id) {
                        deleteQuestion(question.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No questions found matching your criteria.
            </div>
          )}
        </div>

        {/* Question Details */}
        <div className="lg:col-span-2">
          {selectedQuestion ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedQuestion.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedQuestion.difficulty)}`}>
                    {selectedQuestion.difficulty}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedQuestion.description}</p>
                </div>

                {selectedQuestion.examples && selectedQuestion.examples.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Examples</h3>
                    <div className="space-y-4">
                      {selectedQuestion.examples.map((example, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Example {index + 1}</h4>
                          <div className="space-y-2 font-mono text-sm">
                            <div><strong>Input:</strong> {example.input}</div>
                            <div><strong>Output:</strong> {example.output}</div>
                            {example.explanation && (
                              <div><strong>Explanation:</strong> {example.explanation}</div>
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
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedQuestion.constraints.map((constraint, index) => (
                        <li key={index}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Test Cases Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Test Cases</h3>
                  {loadingTestCases ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading test cases...</span>
                    </div>
                  ) : selectedTestCases.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedTestCases.map((testCase, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                          <h4 className="font-medium text-gray-900 mb-2">Test Case {index + 1}</h4>
                          <div className="space-y-2 font-mono text-sm">
                            <div>
                              <strong>Input:</strong> 
                              <pre className="mt-1 bg-white p-2 rounded border text-xs overflow-x-auto">
                                {typeof testCase.input === 'object' 
                                  ? JSON.stringify(testCase.input, null, 2) 
                                  : testCase.input}
                              </pre>
                            </div>
                            <div>
                              <strong>Expected Output:</strong> 
                              <pre className="mt-1 bg-white p-2 rounded border text-xs overflow-x-auto">
                                {testCase.output}
                              </pre>
                            </div>
                            {testCase.explanation && (
                              <div>
                                <strong>Explanation:</strong> 
                                <p className="mt-1 text-gray-700">{testCase.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No test cases found for this question</p>
                  )}
                </div>

                {/* Additional Question Info */}
                {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestion.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuestion.hints && selectedQuestion.hints.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Hints</h3>
                    <div className="space-y-2">
                      {selectedQuestion.hints.map((hint, index) => (
                        <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                          <p className="text-yellow-800">{hint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Question ID</h3>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{selectedQuestion.id}</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p>Select a question from the list to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
