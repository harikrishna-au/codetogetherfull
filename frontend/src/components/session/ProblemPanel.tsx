import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/context/SocketContext';
import { Loader2 } from 'lucide-react';

interface ProblemPanelProps {
  difficulty: string;
  roomId?: string;
}

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
}

const ProblemPanel: React.FC<ProblemPanelProps> = ({ difficulty, roomId }) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !roomId) return;

    const fetchRoomQuestion = () => {
      socket.emit('getRoomQuestion', { roomId }, (response: any) => {
        if (response.success && response.question) {
          setQuestion(response.question);
          setQuestionIndex(response.questionIndex);
        } else {
          console.error('Failed to fetch room question:', response.error);
          // Fallback to default question
          setQuestion({
            id: 'default',
            title: 'Two Sum',
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            difficulty: difficulty,
            examples: [
              {
                input: 'nums = [2,7,11,15], target = 9',
                output: '[0,1]',
                explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
              }
            ],
            constraints: [
              '2 ≤ nums.length ≤ 10⁴',
              '-10⁹ ≤ nums[i] ≤ 10⁹',
              '-10⁹ ≤ target ≤ 10⁹',
              'Only one valid answer exists.'
            ]
          });
        }
        setLoading(false);
      });
    };

    fetchRoomQuestion();
  }, [socket, roomId, difficulty]);

  if (loading) {
    return (
      <div className="h-full bg-[#252526] border-r border-[#3e3e42] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#cccccc]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading question...</span>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="h-full bg-[#252526] border-r border-[#3e3e42] flex items-center justify-center">
        <div className="text-[#cccccc]">No question available</div>
      </div>
    );
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'border-green-500 text-green-400';
      case 'medium':
        return 'border-yellow-500 text-yellow-400';
      case 'hard':
        return 'border-red-500 text-red-400';
      default:
        return 'border-gray-500 text-gray-400';
    }
  };

  return (
    <div className="h-full bg-[#252526] border-r border-[#3e3e42] overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-white">
            {questionIndex !== null ? `${questionIndex + 1}. ` : ''}{question.title}
          </h1>
          <Badge 
            variant="outline" 
            className={`text-xs ${getDifficultyColor(question.difficulty)}`}
          >
            {question.difficulty}
          </Badge>
        </div>
        
        <div className="space-y-4 text-[#cccccc] text-sm">
          <p className="leading-relaxed">
            {question.description}
          </p>
          
          {question.examples && question.examples.map((example, index) => (
            <div key={index}>
              <h3 className="font-semibold text-white mb-2">Example {index + 1}:</h3>
              <div className="bg-[#1e1e1e] p-3 rounded text-xs font-mono space-y-1">
                <div><strong>Input:</strong> {example.input}</div>
                <div><strong>Output:</strong> {example.output}</div>
                {example.explanation && (
                  <div><strong>Explanation:</strong> {example.explanation}</div>
                )}
              </div>
            </div>
          ))}
          
          {question.constraints && question.constraints.length > 0 && (
            <div>
              <h3 className="font-semibold text-white mb-2">Constraints:</h3>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {question.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemPanel;
