
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Zap } from 'lucide-react';

interface ModeSelectorProps {
  selectedMode: 'friendly' | 'challenge' | null;
  onModeSelect: (mode: 'friendly' | 'challenge') => void;
}

export const ModeSelector = ({ selectedMode, onModeSelect }: ModeSelectorProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
      <Card 
        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
          selectedMode === 'friendly' 
            ? 'ring-2 ring-green-500 bg-green-500/10 border-green-500' 
            : 'bg-white/5 border-white/20 hover:bg-white/10'
        }`}
        onClick={() => onModeSelect('friendly')}
      >
        <CardContent className="p-6 text-center">
          <Heart className={`w-12 h-12 mx-auto mb-4 ${selectedMode === 'friendly' ? 'text-green-400' : 'text-gray-400'}`} />
          <h3 className="text-xl font-semibold text-white mb-2">Friendly Mode</h3>
          <p className="text-gray-300 text-sm">
            Relaxed collaboration, learning together, and sharing knowledge in a supportive environment.
          </p>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
          selectedMode === 'challenge' 
            ? 'ring-2 ring-orange-500 bg-orange-500/10 border-orange-500' 
            : 'bg-white/5 border-white/20 hover:bg-white/10'
        }`}
        onClick={() => onModeSelect('challenge')}
      >
        <CardContent className="p-6 text-center">
          <Zap className={`w-12 h-12 mx-auto mb-4 ${selectedMode === 'challenge' ? 'text-orange-400' : 'text-gray-400'}`} />
          <h3 className="text-xl font-semibold text-white mb-2">Challenge Mode</h3>
          <p className="text-gray-300 text-sm">
            Competitive programming battles, timed competitions, and skill-based matchmaking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
