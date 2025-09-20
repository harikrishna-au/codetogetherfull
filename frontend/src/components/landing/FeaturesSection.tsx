import { Users, Code, Timer, Trophy, Zap, Heart } from 'lucide-react';
import { FeatureCard } from '@/components/FeatureCard';

const FeaturesSection: React.FC = () => (
  <section className="py-20 px-4 bg-black/20">
    <div className="container mx-auto">
      <h3 className="text-4xl font-bold text-white text-center mb-16">
        Why Choose CodeTogether?
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Users className="w-8 h-8" />}
          title="Real-time Collaboration"
          description="Video calls, voice chat, and text messaging - all optional and user-controlled for the perfect coding experience."
          color="text-blue-400"
        />
        <FeatureCard
          icon={<Code className="w-8 h-8" />}
          title="Multi-language Support"
          description="Code in your favorite language with syntax highlighting and instant feedback on your submissions."
          color="text-purple-400"
        />
        <FeatureCard
          icon={<Timer className="w-8 h-8" />}
          title="Timed Sessions"
          description="15-minute focused sessions to keep you engaged and motivated. Perfect for quick practice or intense competition."
          color="text-orange-400"
        />
        <FeatureCard
          icon={<Trophy className="w-8 h-8" />}
          title="Two Game Modes"
          description="Choose Friendly Mode for relaxed learning or Challenge Mode for competitive programming battles."
          color="text-yellow-400"
        />
        <FeatureCard
          icon={<Heart className="w-8 h-8" />}
          title="Learn from Others"
          description="See each other's solutions after sessions to learn new approaches and improve your coding skills."
          color="text-pink-400"
        />
        <FeatureCard
          icon={<Zap className="w-8 h-8" />}
          title="Instant Feedback"
          description="Submit multiple times with real-time test case validation and immediate results."
          color="text-green-400"
        />
      </div>
    </div>
  </section>
);

export default FeaturesSection;
