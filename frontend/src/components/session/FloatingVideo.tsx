import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MicOff, VideoOff, Plus, Minus } from 'lucide-react';

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
  sizePx: number;
  ring: string;
  fallbackInitial: string;
  showFeed: boolean;
  mirror?: boolean;
}> = ({ stream, muted = false, sizePx, ring, fallbackInitial, showFeed, mirror = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div
      style={{ width: sizePx, height: sizePx }}
      className={`relative rounded-full overflow-hidden ${ring}
      bg-[#101214] shadow-[0_8px_28px_rgba(0,0,0,0.65)] transition-[width,height] duration-200`}>
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
const NAMEPLATE_H = 26;
// Base (scale = 1) geometry — everything scales together
const BASE = { w: 168, videoH: 106, partner: 104, local: 68, localLeft: 84, localTop: 58 };
const MIN_SCALE = 0.7;
const MAX_SCALE = 2.2;
const SCALE_STEP = 0.2;

const FloatingVideo: React.FC<FloatingVideoProps> = ({
  localStream, remoteStream, isVideoOn, isAudioOn, isConnected, partnerName,
}) => {
  const displayName = partnerName || 'Partner';
  const initial = displayName.charAt(0).toUpperCase();

  // Hover zoom (+ / −) scales the whole cluster
  const [scale, setScale] = useState(1);
  const dims = {
    w: BASE.w * scale,
    h: BASE.videoH * scale + NAMEPLATE_H,
    partner: BASE.partner * scale,
    local: BASE.local * scale,
    localLeft: BASE.localLeft * scale,
    localTop: BASE.localTop * scale,
  };
  const dimsRef = useRef(dims);
  dimsRef.current = dims;

  // Position is the cluster's top-left corner; start bottom-right.
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - BASE.w - MARGIN,
    y: window.innerHeight - (BASE.videoH + NAMEPLATE_H) - MARGIN,
  }));
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const snapToCorner = useCallback((x: number, y: number) => {
    const { w, h } = dimsRef.current;
    const midX = x + w / 2 < window.innerWidth / 2;
    const midY = y + h / 2 < window.innerHeight / 2;
    return {
      x: midX ? MARGIN : window.innerWidth - w - MARGIN,
      y: midY ? TOP_OFFSET : window.innerHeight - h - MARGIN,
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
      x: Math.min(Math.max(e.clientX - dragOffset.current.x, 0), window.innerWidth - dims.w),
      y: Math.min(Math.max(e.clientY - dragOffset.current.y, 0), window.innerHeight - dims.h),
    });
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    setPos(p => snapToCorner(p.x, p.y));
  };

  const zoom = (delta: number) => {
    setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((s + delta) * 100) / 100)));
  };

  // Re-anchor to the corner whenever size changes or the window resizes
  useEffect(() => {
    setPos(p => snapToCorner(p.x, p.y));
  }, [scale, snapToCorner]);

  useEffect(() => {
    const onResize = () => setPos(p => snapToCorner(p.x, p.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [snapToCorner]);

  return (
    <div
      className={`group fixed z-40 select-none touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: dims.w,
        transition: dragging ? 'none' : 'left 280ms cubic-bezier(0.22,1,0.36,1), top 280ms cubic-bezier(0.22,1,0.36,1)',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Hover zoom controls */}
      <div
        className="absolute -top-2 -right-2 z-10 flex flex-col rounded-full bg-[#16181a] border border-white/[0.12] shadow-lg overflow-hidden
          opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => zoom(SCALE_STEP)}
          disabled={scale >= MAX_SCALE}
          className="w-6 h-6 flex items-center justify-center text-[#cfd3d6] hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
          aria-label="Increase video size"
        >
          <Plus className="w-3 h-3" />
        </button>
        <div className="h-px bg-white/[0.08]" />
        <button
          onClick={() => zoom(-SCALE_STEP)}
          disabled={scale <= MIN_SCALE}
          className="w-6 h-6 flex items-center justify-center text-[#cfd3d6] hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
          aria-label="Decrease video size"
        >
          <Minus className="w-3 h-3" />
        </button>
      </div>

      <div className="relative" style={{ height: BASE.videoH * scale }}>
        {/* Partner bubble — the big one */}
        <Bubble
          stream={remoteStream}
          sizePx={dims.partner}
          ring={isConnected
            ? 'ring-2 ring-[#4ec9b0]/70'
            : 'ring-1 ring-white/[0.14]'}
          fallbackInitial={initial}
          showFeed={isConnected && !!remoteStream}
        />
        {/* waiting pulse when partner not connected */}
        {!isConnected && (
          <span
            style={{ width: dims.partner, height: dims.partner }}
            className="absolute left-0 top-0 rounded-full border border-white/[0.1] animate-ping pointer-events-none"
          />
        )}

        {/* Your bubble — smaller, overlapping bottom-right */}
        <div className="absolute" style={{ left: dims.localLeft, top: dims.localTop }}>
          <Bubble
            stream={localStream}
            muted
            mirror
            sizePx={dims.local}
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
