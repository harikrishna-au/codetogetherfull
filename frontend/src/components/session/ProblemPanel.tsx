import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Loader2 } from 'lucide-react';

interface ProblemPanelProps {
  difficulty: string;
  roomId?: string;
  initialQuestion?: Question;
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

const difficultyClass: Record<string, string> = {
  easy: 'text-green-400 border-accent/40 bg-accent/10',
  medium: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  hard: 'text-red-400 border-red-500/40 bg-red-500/10',
};

const ProblemPanel: React.FC<ProblemPanelProps> = ({ difficulty, roomId, initialQuestion }) => {
  const [question, setQuestion] = useState<Question | null>(initialQuestion ?? null);
  const [loading, setLoading] = useState(!initialQuestion);
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !roomId || initialQuestion) return;

    const fetchRoomQuestion = () => {
      socket.emit('getRoomQuestion', { roomId }, (response: { success: boolean; question?: Question; questionIndex?: number; error?: string }) => {
        if (response.success && response.question) {
          setQuestion(prev => prev ?? response.question!);
          setQuestionIndex(response.questionIndex ?? null);
        } else {
          console.error('Failed to fetch room question:', response.error);
          setQuestion({
            id: 'default',
            title: 'Two Sum',
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            difficulty,
            examples: [
              {
                input: 'nums = [2,7,11,15], target = 9',
                output: '[0,1]',
                explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
              },
            ],
            constraints: [
              '2 ≤ nums.length ≤ 10⁴',
              '-10⁹ ≤ nums[i] ≤ 10⁹',
              '-10⁹ ≤ target ≤ 10⁹',
              'Only one valid answer exists.',
            ],
          });
        }
        setLoading(false);
      });
    };

    fetchRoomQuestion();
  }, [socket, roomId, difficulty]);

  if (loading) {
    return (
      <div className="h-full bg-[#0d0d0d] border-r border-white/[0.06] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#6b7075] text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading question…
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="h-full bg-[#0d0d0d] border-r border-white/[0.06] flex items-center justify-center">
        <span className="text-[#6b7075] text-sm">No question available</span>
      </div>
    );
  }

  const diff = question.difficulty.toLowerCase();
  const badgeCls = difficultyClass[diff] ?? 'text-[#8a9099] border-white/20 bg-white/[0.04]';

  return (
    <div className="h-full bg-[#0d0d0d] border-r border-white/[0.06] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="p-5 space-y-5">

        {/* Title + badge */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-sm font-semibold text-[#e2e5e8] leading-snug">
            {questionIndex !== null ? `${questionIndex + 1}. ` : ''}{question.title}
          </h1>
          <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${badgeCls}`}>
            {question.difficulty}
          </span>
        </div>

        {/* Description */}
        <p className="text-[#a0a6ad] text-[13px] leading-relaxed">
          {question.description}
        </p>

        {/* Examples */}
        {question.examples && question.examples.length > 0 && (
          <div className="space-y-3">
            {question.examples.map((example, index) => (
              <div key={index}>
                <h3 className="text-[11px] uppercase tracking-widest text-[#4a5057] font-medium mb-2">
                  Example {index + 1}
                </h3>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-xs font-mono space-y-1.5 text-[#cfd3d6]">
                  <div>
                    <span className="text-[#6b7075]">Input: </span>
                    {example.input}
                  </div>
                  <div>
                    <span className="text-[#6b7075]">Output: </span>
                    {example.output}
                  </div>
                  {example.explanation && (
                    <div>
                      <span className="text-[#6b7075]">Explanation: </span>
                      <span className="text-[#8a9099]">{example.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {question.constraints && question.constraints.length > 0 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-widest text-[#4a5057] font-medium mb-2">
              Constraints
            </h3>
            <ul className="space-y-1.5">
              {question.constraints.map((constraint, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-[#8a9099]">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                  <span className="font-mono leading-relaxed">{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemPanel;
