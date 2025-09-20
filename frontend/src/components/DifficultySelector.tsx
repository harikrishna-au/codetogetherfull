
import { Badge } from '@/components/ui/badge';

interface DifficultySelectorProps {
  selectedDifficulty: 'easy' | 'medium' | 'hard' | null;
  onDifficultySelect: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

export const DifficultySelector = ({ selectedDifficulty, onDifficultySelect }: DifficultySelectorProps) => {
  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'bg-green-500 hover:bg-green-600' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { value: 'hard', label: 'Hard', color: 'bg-red-500 hover:bg-red-600' }
  ];

  return (
    <div className="flex justify-center space-x-4">
      {difficulties.map((difficulty) => (
        <Badge
          key={difficulty.value}
          variant={selectedDifficulty === difficulty.value ? "default" : "outline"}
          className={`px-6 py-3 text-lg cursor-pointer transition-all duration-300 hover:scale-110 ${
            selectedDifficulty === difficulty.value 
              ? `${difficulty.color} text-white border-transparent` 
              : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
          }`}
          onClick={() => onDifficultySelect(difficulty.value as 'easy' | 'medium' | 'hard')}
        >
          {difficulty.label}
        </Badge>
      ))}
    </div>
  );
};
