import React, { useRef, useEffect } from 'react';
import { VideoOff, MicOff, Wifi, WifiOff } from 'lucide-react';

interface VideoPanelProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isConnected: boolean;
}

const VideoFeed: React.FC<{
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  videoOn: boolean;
}> = ({ stream, muted = false, label, videoOn }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative flex-1 rounded-lg overflow-hidden bg-black border border-white/[0.08]">
      {videoOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <VideoOff className="w-8 h-8 text-[#555]" />
          <span className="text-xs text-[#666]">{videoOn ? 'No stream' : 'Camera off'}</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 text-[11px] px-2 py-0.5 rounded bg-black/70 text-white font-medium">
        {label}
      </div>
    </div>
  );
};

const VideoPanel: React.FC<VideoPanelProps> = ({
  localStream, remoteStream, isVideoOn, isAudioOn, isConnected,
}) => {
  return (
    <div className="w-full bg-black border-b border-white/[0.08] px-3 py-2 flex items-stretch gap-3 h-44 shrink-0">
      {/* Both feeds side by side */}
      <VideoFeed
        stream={localStream}
        muted
        label="You"
        videoOn={isVideoOn}
      />
      <VideoFeed
        stream={remoteStream}
        label="Partner"
        videoOn={isConnected}
      />

      {/* Status column */}
      <div className="flex flex-col justify-between items-end shrink-0 py-1">
        <div className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full ${
          isConnected
            ? 'bg-green-900/50 text-green-400 border border-green-700/50'
            : 'bg-primary/70 text-muted-foreground/70 border border-slate-700'
        }`}>
          {isConnected
            ? <Wifi className="w-3 h-3" />
            : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'Connected' : 'Waiting…'}
        </div>
        {!isAudioOn && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 bg-primary/70 px-2 py-1 rounded-full border border-slate-700">
            <MicOff className="w-3 h-3" />
            <span>Muted</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPanel;
