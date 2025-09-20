import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

interface RoomTimerProps {
  roomId: string;
  className?: string;
}

interface TimerData {
  startTime: number;
  endTime: number;
  duration: number;
  isActive: boolean;
}

const RoomTimer: React.FC<RoomTimerProps> = ({ roomId, className = '' }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerData, setTimerData] = useState<TimerData | null>(null);
  const [isWarning, setIsWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const { socket } = useSocket();

  // Format time as MM:SS
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update timer display
  const updateTimer = () => {
    if (!timerData || !timerData.isActive) {
      setTimeRemaining(0);
      return;
    }

    const now = Date.now();
    const remaining = Math.max(0, timerData.endTime - now);
    setTimeRemaining(remaining);

    // Set warning state when less than 5 minutes remain
    setIsWarning(remaining <= 5 * 60 * 1000 && remaining > 0);
    
    // Set expired state when time runs out
    if (remaining === 0 && !isExpired) {
      setIsExpired(true);
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket || !roomId) return;

    // Request initial timer sync
    socket.emit('requestTimerSync', { roomId });

    // Listen for timer sync events
    const handleTimerSync = (data: any) => {
      if (data.roomId === roomId) {
        console.log('[RoomTimer] Received timer sync:', data);
        setTimerData({
          startTime: data.startTime,
          endTime: data.endTime,
          duration: data.duration,
          isActive: data.isActive
        });
        setIsExpired(false);
      }
    };

    // Listen for timer expiry
    const handleTimerExpired = (data: any) => {
      if (data.roomId === roomId) {
        console.log('[RoomTimer] Timer expired for room:', roomId);
        setIsExpired(true);
        setTimeRemaining(0);
        if (timerData) {
          setTimerData({ ...timerData, isActive: false });
        }
      }
    };

    socket.on('timer-sync', handleTimerSync);
    socket.on('timer-expired', handleTimerExpired);

    return () => {
      socket.off('timer-sync', handleTimerSync);
      socket.off('timer-expired', handleTimerExpired);
    };
  }, [socket, roomId, timerData]);

  // Update timer every second
  useEffect(() => {
    if (!timerData) return;

    // Initial update
    updateTimer();

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timerData, isExpired]);

  // Don't render if no timer data
  if (!timerData) {
    return null;
  }

  const timerClass = `
    flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-sm font-semibold
    ${isExpired 
      ? 'bg-red-100 text-red-700 border border-red-300' 
      : isWarning 
        ? 'bg-orange-100 text-orange-700 border border-orange-300 animate-pulse' 
        : 'bg-blue-100 text-blue-700 border border-blue-300'
    }
    ${className}
  `;

  const IconComponent = isExpired ? AlertTriangle : Clock;

  return (
    <div className={timerClass}>
      <IconComponent size={16} />
      <span>
        {isExpired ? 'TIME\'S UP!' : formatTime(timeRemaining)}
      </span>
      {isWarning && !isExpired && (
        <span className="text-xs opacity-75">HURRY!</span>
      )}
    </div>
  );
};

export default RoomTimer;
