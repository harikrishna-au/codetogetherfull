import React from 'react';
import VideoPanel from './VideoPanel';

interface CameraHoverPreviewProps {
  isVideoOn: boolean;
  isAudioOn: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
}

const CameraHoverPreview: React.FC<CameraHoverPreviewProps> = (props) => {
  return <VideoPanel {...props} />;
};

export default CameraHoverPreview;
