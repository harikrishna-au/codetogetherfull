import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer, { Instance as SimplePeerInstance } from 'simple-peer';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';

// Polyfill buffer for simple-peer if not already global (Vite handles this via config, but safe to import)
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

interface Options {
  socket: Socket | null;
  roomId: string | undefined;
  userId: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
}

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
}

export function useWebRTC({ socket, roomId, userId, isVideoOn, isAudioOn }: Options): WebRTCState {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const peerRef = useRef<SimplePeerInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Capture local media
  useEffect(() => {
    let mounted = true;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setLocalStream(stream);
        streamRef.current = stream;

        // Apply initial toggle states
        stream.getVideoTracks().forEach(t => t.enabled = isVideoOn);
        stream.getAudioTracks().forEach(t => t.enabled = isAudioOn);

      } catch (err: any) {
        console.error('Error accessing media devices:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast.error('Camera/mic permission denied. Video chat will not be available.');
        } else {
          toast.error(`Media access error: ${err.message}`);
        }
      }
    };

    initMedia();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run once on mount

  // Toggle tracks when props change
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => t.enabled = isVideoOn);
    }
  }, [isVideoOn]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = isAudioOn);
    }
  }, [isAudioOn]);


  // Initialize Peer when socket, room, and stream are ready
  useEffect(() => {
    if (!socket || !roomId || !userId || !localStream) return;

    const handleSignal = (data: { from: string; signal: any }) => {
      if (data.from === userId) return;
      // If we haven't created a peer yet, we are the non-initiator
      if (!peerRef.current) {
        createPeer(false);
      }
      peerRef.current?.signal(data.signal);
    };

    const handleUserJoined = (data: { userId: string }) => {
      if (data.userId !== userId) {
        // I am the initiator because someone else just joined
        createPeer(true, data.userId);
      }
    };

    const handleUserLeft = () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setRemoteStream(null);
      setIsConnected(false);
    };

    // If I join and there's already someone (initiator logic handled by who is 'new' vs 'existing')
    // Actually, simple-peer initiator logic usually requires knowing who initiates.
    // simpler approach:
    // Existing user gets 'userJoined' -> becomes initiator.
    // New user waits for signal.

    // We also need to handle the case where we reload.
    // Ideally the backend tells us if there's someone else.
    // For now, relies on 'userJoined' event. 
    // BUT: what if we join second? We emit 'join', server puts us in room.
    // Server should notify OTHERS. User A receives 'userJoined' -> A initiates connection to B.

    // Listeners
    socket.on('webrtc-signal', handleSignal);
    socket.on('userJoined', handleUserJoined);
    socket.on('room-exit', handleUserLeft); // or specific peer disconnect event

    // Create a non-initiator peer initially? No, we wait for event or create if we are the one triggering.
    // Actually, simple-peer requires `initiator: true` for exactly one side.
    // Side A (already in room) receives 'userJoined' (Side B). Side A is initiator.
    // Side B waits.

    function createPeer(initiator: boolean, targetUserId?: string) {
      if (peerRef.current) {
        // destroy existing if any (assuming 1:1)
        peerRef.current.destroy();
      }

      const peer = new SimplePeer({
        initiator,
        stream: localStream!,
        trickle: false, // simple-peer default is true, but false can be more stable for simple setups
      });

      peer.on('signal', (signal) => {
        socket.emit('webrtc-signal', {
          roomId,
          from: userId,
          signal, // simple-peer signal object
        });
      });

      peer.on('stream', (stream) => {
        setRemoteStream(stream);
      });

      peer.on('connect', () => {
        setIsConnected(true);
        toast.success('Video chat connected!');
      });

      peer.on('close', () => {
        setIsConnected(false);
        setRemoteStream(null);
        peerRef.current = null;
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        // toast.error('Video chat connection error');
        setIsConnected(false);
      });

      peerRef.current = peer;
    }

    return () => {
      socket.off('webrtc-signal', handleSignal);
      socket.off('userJoined', handleUserJoined);
      socket.off('room-exit', handleUserLeft);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [socket, roomId, userId, localStream]);

  return { localStream, remoteStream, isConnected };
}
