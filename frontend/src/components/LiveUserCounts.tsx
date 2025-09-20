
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api';

interface LiveUserCountsProps {
  mode: 'friendly' | 'challenge';
  difficulty: 'easy' | 'medium' | 'hard';
}

export const LiveUserCounts = ({ mode, difficulty }: LiveUserCountsProps) => {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchCount() {
      try {
        const res = await fetch(`${API_ENDPOINTS.QUEUE_COUNT}?mode=${mode}&difficulty=${difficulty}`);
        const data = await res.json();
        if (isMounted && typeof data.count === 'number') {
          setUserCount(data.count);
        }
      } catch {
        if (isMounted) setUserCount(0);
      }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 10000); // Poll every 10s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [mode, difficulty]);

  return (
    <Card className="bg-white/5 border-white/20 max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="flex items-center justify-center space-x-3">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">
            {userCount} users waiting in {mode} mode ({difficulty})
          </span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
};
