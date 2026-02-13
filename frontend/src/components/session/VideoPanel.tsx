import React, { useRef, useEffect } from 'react';
import { VideoOff, MicOff } from 'lucide-react';

interface VideoPanelProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isConnected: boolean;
}

const VideoFeed: React.FC<{ stream: MediaStream | null; muted?: boolean; label: string; videoOn: boolean }> = ({
  stream, muted = false, label, videoOn,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden bg-[#1a1a2e] border border-[#3e3e42]">
      {videoOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <VideoOff className="w-6 h-6 text-[#555]" />
        </div>
      )}
      <div className="absolute bottom-1 left-1 text-[10px] px-1 py-0.5 rounded bg-black/60 text-white">
        {label}
      </div>
    </div>
  );
};

const VideoPanel: React.FC<VideoPanelProps> = ({
  localStream, remoteStream, isVideoOn, isAudioOn, isConnected,
}) => {
  return (
    <div className="bg-white text-black rounded-lg shadow-xl p-2 w-[240px]">
      <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
        <span>Video Chat</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {isConnected ? 'Connected' : 'Waiting…'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 h-28">
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
      </div>
      {!isAudioOn && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-500">
          <MicOff className="w-3 h-3" />
          <span>Your mic is muted</span>
        </div>
      )}
    </div>
  );
};

export default VideoPanel;
