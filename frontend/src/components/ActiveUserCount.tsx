import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/api";

export default function ActiveUserCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ACTIVE_USERS);
        const data = await res.json();
        setCount(data.activeUsers ? data.activeUsers.length : 0);
      } catch {
        setCount(null);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === null) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-[#6b7075]">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span className="text-white/40">{count} online</span>
    </div>
  );
}
