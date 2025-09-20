
import { Card, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
}

export const FeatureCard = ({ icon, title, description, color }: FeatureCardProps) => {
  return (
    <Card className="bg-white/5 border-white/20 hover:bg-white/10 transition-all duration-300 hover:scale-105">
      <CardContent className="p-6 text-center">
        <div className={`${color} mb-4 flex justify-center`}>
          {icon}
        </div>
        <h4 className="text-xl font-semibold text-white mb-3">{title}</h4>
        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
