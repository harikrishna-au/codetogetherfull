import React from 'react';

interface CameraHoverPreviewProps {
  isVideoOn: boolean;
}

const CameraHoverPreview: React.FC<CameraHoverPreviewProps> = ({ isVideoOn }) => {
  return (
    <div className="w-full">
      <div className="text-xs text-muted-foreground mb-2">Camera preview</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative h-32 rounded-md overflow-hidden bg-[#1e1e1e] border border-[#3e3e42]">
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#888]">
            {isVideoOn ? 'Your camera stream' : 'Camera off'}
          </div>
          <div className="absolute bottom-1 left-1 text-[10px] px-1 py-0.5 rounded bg-black/60 text-white">You</div>
        </div>
        <div className="relative h-32 rounded-md overflow-hidden bg-[#1e1e1e] border border-[#3e3e42]">
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#888]">
            {isVideoOn ? 'Partner preview' : 'Waiting for partner'}
          </div>
          <div className="absolute bottom-1 left-1 text-[10px] px-1 py-0.5 rounded bg-black/60 text-white">Partner</div>
        </div>
      </div>
    </div>
  );
};

export default CameraHoverPreview;
