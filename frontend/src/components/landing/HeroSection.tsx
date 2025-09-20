import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ModeSelector } from '@/components/ModeSelector';
import { DifficultySelector } from '@/components/DifficultySelector';
import { LiveUserCounts } from '@/components/LiveUserCounts';
import { Zap } from 'lucide-react';

interface HeroSectionProps {
  selectedMode: 'friendly' | 'challenge' | null;
  setSelectedMode: (mode: 'friendly' | 'challenge' | null) => void;
  selectedDifficulty: 'easy' | 'medium' | 'hard' | null;
  setSelectedDifficulty: (difficulty: 'easy' | 'medium' | 'hard' | null) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ selectedMode, setSelectedMode, selectedDifficulty, setSelectedDifficulty }) => {
  const navigate = useNavigate();

  const handleStartCoding = () => {
    if (selectedMode && selectedDifficulty) {
      navigate('/matchmaking', { state: { mode: selectedMode, difficulty: selectedDifficulty } });
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Code Together, Grow Together
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Connect with fellow developers worldwide. Collaborate in friendly sessions or compete in timed challenges. 
            Practice coding problems together and learn from each other's solutions.
          </p>
          {/* Mode Selection */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-white mb-6">Choose Your Experience</h3>
            <ModeSelector 
              selectedMode={selectedMode} 
              onModeSelect={setSelectedMode} 
            />
          </div>
          {/* Difficulty Selection */}
          {selectedMode && (
            <div className="mb-8 animate-fade-in">
              <h3 className="text-2xl font-semibold text-white mb-6">Select Difficulty</h3>
              <DifficultySelector 
                selectedDifficulty={selectedDifficulty} 
                onDifficultySelect={setSelectedDifficulty} 
              />
            </div>
          )}
          {/* Live User Counts */}
          {selectedMode && selectedDifficulty && (
            <div className="mb-8 animate-fade-in">
              <LiveUserCounts mode={selectedMode} difficulty={selectedDifficulty} />
            </div>
          )}
          {/* Start Button */}
          {selectedMode && selectedDifficulty && (
            <div className="animate-fade-in">
              <Button 
                onClick={handleStartCoding}
                size="lg"
                className={`px-12 py-4 text-lg font-semibold transition-all duration-300 ${
                  selectedMode === 'friendly' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                } text-white shadow-lg hover:shadow-xl transform hover:scale-105`}
              >
                <Zap className="w-5 h-5 mr-2" />
                Start {selectedMode === 'friendly' ? 'Collaborating' : 'Competing'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
