
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
    <div className="flex items-center justify-center gap-2.5 rounded-full border border-[var(--line)] bg-white/[0.03] px-4 py-2.5 max-w-md mx-auto backdrop-blur-sm">
      <Users className="w-4 h-4 text-[var(--teal-bright)]" />
      <span className="text-sm text-[var(--fg-dim)]">
        <span className="font-semibold text-[var(--fg)] tabular-nums">{userCount}</span> waiting in{' '}
        <span className="capitalize text-[var(--fg)]">{mode}</span> · <span className="capitalize">{difficulty}</span>
      </span>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--teal)] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--teal-bright)]" />
      </span>
    </div>
  );
};
