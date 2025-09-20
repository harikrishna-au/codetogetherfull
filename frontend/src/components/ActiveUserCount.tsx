import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

export default function ActiveUserCount() {
  const [count, setCount] = useState<number | null>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchCount = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ACTIVE_USERS);
        const data = await res.json();
        const newCount = data.activeUsers ? data.activeUsers.length : 0;
        if (newCount !== count) {
          setHighlight(true);
          setTimeout(() => setHighlight(false), 1200);
        }
        setCount(newCount);
      } catch {
        setCount(null);
      }
    };
    fetchCount();
    interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-5 py-2 rounded-full shadow-lg border-2 border-green-400 bg-gradient-to-r from-green-900/80 to-green-700/80 text-white text-base font-semibold transition-all duration-500 select-none cursor-pointer hover:scale-105 focus:ring-2 focus:ring-green-400/60 outline-none ${
        highlight ? "ring-4 ring-green-400/60 scale-105" : ""
      } animate-fade-in`}
      tabIndex={0}
      title="Number of users active on the platform right now"
    >
      <Users className="w-5 h-5 text-green-300 animate-pulse" />
      {count !== null ? (
        <span>
          <span className="font-bold text-green-300 text-lg drop-shadow-md animate-bounce">{count}</span>
          <span className="ml-1">user{count === 1 ? "" : "s"} active now</span>
        </span>
      ) : (
        <span>Loading active users...</span>
      )}
    </div>
  );
}
