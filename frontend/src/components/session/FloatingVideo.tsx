import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

/**
 * Floating face bubbles (Around-style): you and your partner as circular video
 * bubbles hovering over the workspace. Draggable anywhere; snaps to the nearest
 * corner on release. Steals zero layout space from the editor.
 */

interface FloatingVideoProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isConnected: boolean;
  partnerName?: string;
}

const Bubble: React.FC<{
  stream: MediaStream | null;
  muted?: boolean;
  size: string;
  ring: string;
  fallbackInitial: string;
  showFeed: boolean;
  mirror?: boolean;
}> = ({ stream, muted = false, size, ring, fallbackInitial, showFeed, mirror = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className={`relative ${size} rounded-full overflow-hidden ${ring}
      bg-[#101214] shadow-[0_8px_28px_rgba(0,0,0,0.65)]`}>
      {showFeed && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.07] to-transparent">
          <span className="text-lg font-semibold text-[#8a9099]">{fallbackInitial}</span>
        </div>
      )}
    </div>
  );
};

const MARGIN = 16;
const TOP_OFFSET = 52;     // keep clear of the session top bar
const CLUSTER_W = 168;
const CLUSTER_H = 132;

const FloatingVideo: React.FC<FloatingVideoProps> = ({
  localStream, remoteStream, isVideoOn, isAudioOn, isConnected, partnerName,
}) => {
  const displayName = partnerName || 'Partner';
  const initial = displayName.charAt(0).toUpperCase();

  // Position is the cluster's top-left corner; start bottom-right.
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - CLUSTER_W - MARGIN,
    y: window.innerHeight - CLUSTER_H - MARGIN,
  }));
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const snapToCorner = useCallback((x: number, y: number) => {
    const midX = x + CLUSTER_W / 2 < window.innerWidth / 2;
    const midY = y + CLUSTER_H / 2 < window.innerHeight / 2;
    return {
      x: midX ? MARGIN : window.innerWidth - CLUSTER_W - MARGIN,
      y: midY ? TOP_OFFSET : window.innerHeight - CLUSTER_H - MARGIN,
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPos({
      x: Math.min(Math.max(e.clientX - dragOffset.current.x, 0), window.innerWidth - CLUSTER_W),
      y: Math.min(Math.max(e.clientY - dragOffset.current.y, 0), window.innerHeight - CLUSTER_H),
    });
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    setPos(p => snapToCorner(p.x, p.y));
  };

  // Keep bubbles on-screen when the window resizes
  useEffect(() => {
    const onResize = () => setPos(p => snapToCorner(p.x, p.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [snapToCorner]);

  return (
    <div
      className={`fixed z-40 select-none touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: CLUSTER_W,
        transition: dragging ? 'none' : 'left 280ms cubic-bezier(0.22,1,0.36,1), top 280ms cubic-bezier(0.22,1,0.36,1)',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="relative" style={{ height: CLUSTER_H - 26 }}>
        {/* Partner bubble — the big one */}
        <Bubble
          stream={remoteStream}
          size="w-[104px] h-[104px]"
          ring={isConnected
            ? 'ring-2 ring-[#4ec9b0]/70'
            : 'ring-1 ring-white/[0.14]'}
          fallbackInitial={initial}
          showFeed={isConnected && !!remoteStream}
        />
        {/* waiting pulse when partner not connected */}
        {!isConnected && (
          <span className="absolute left-0 top-0 w-[104px] h-[104px] rounded-full border border-white/[0.1] animate-ping pointer-events-none" />
        )}

        {/* Your bubble — smaller, overlapping bottom-right */}
        <div className="absolute left-[84px] top-[58px]">
          <Bubble
            stream={localStream}
            muted
            mirror
            size="w-[68px] h-[68px]"
            ring="ring-2 ring-[#0a0a0a]"
            fallbackInitial="Y"
            showFeed={isVideoOn && !!localStream}
          />
          {/* your status chips */}
          <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
            {!isAudioOn && (
              <span className="w-5 h-5 rounded-full bg-[#1a1c1e] border border-white/[0.14] flex items-center justify-center">
                <MicOff className="w-2.5 h-2.5 text-red-400" />
              </span>
            )}
            {!isVideoOn && (
              <span className="w-5 h-5 rounded-full bg-[#1a1c1e] border border-white/[0.14] flex items-center justify-center">
                <VideoOff className="w-2.5 h-2.5 text-[#8a9099]" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* name plate */}
      <div className="mt-1.5 flex justify-start pl-1">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 border border-white/[0.1] backdrop-blur text-[10px] text-[#cfd3d6] font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#4ec9b0]' : 'bg-[#5a6068] animate-pulse'}`} />
          {isConnected ? displayName : 'Connecting…'}
        </span>
      </div>
    </div>
  );
};

export default FloatingVideo;
