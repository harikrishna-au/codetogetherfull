import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Users, Clock, Video, VideoOff, Mic, MicOff, MessageSquare, LogOut } from 'lucide-react';
import CameraHoverPreview from './CameraHoverPreview';

interface SessionHeaderProps {
  mode: string;
  difficulty: string;
  timeLeft: number;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isChatOpen: boolean;
  setIsVideoOn: (v: boolean) => void;
  setIsAudioOn: (v: boolean) => void;
  setIsChatOpen: (v: boolean) => void;
  formatTime: (s: number) => string;
  onExit?: () => void; // new prop for exit handler
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  mode,
  difficulty,
  timeLeft,
  isVideoOn,
  isAudioOn,
  isChatOpen,
  setIsVideoOn,
  setIsAudioOn,
  setIsChatOpen,
  formatTime,
  onExit,
}) => {
  return (
    <div className="h-14 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-8 w-full">
      <div className="flex items-center space-x-8 min-w-0 flex-grow">
        <div className="text-base font-semibold text-[#cccccc] truncate max-w-[260px]">
          CodeTogether - {mode} mode ({difficulty})
        </div>
        <Badge variant="outline" className="text-xs border-green-500 text-green-400">
          <Users className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      </div>
      <div className="flex items-center space-x-3">
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`h-8 px-2 ${isVideoOn ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
          </HoverCardTrigger>
          {isVideoOn && (
            <HoverCardContent side="bottom" align="end" className="w-[420px]">
              <CameraHoverPreview isVideoOn={isVideoOn} />
            </HoverCardContent>
          )}
        </HoverCard>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAudioOn(!isAudioOn)}
          className={`h-8 px-2 ${isAudioOn ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="h-8 px-2 hover:bg-gray-700"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <div className="flex items-center space-x-2 text-orange-400 ml-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatTime(timeLeft)}</span>
        </div>
        {/* Exit button */}
        {onExit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="h-8 px-2 hover:bg-red-700 text-red-400"
            title="Exit Session"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionHeader;
