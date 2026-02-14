import { useEffect, useRef, useState } from 'react';
import SimplePeer, { Instance as SimplePeerInstance } from 'simple-peer';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';

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

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC({ socket, roomId, userId, isVideoOn, isAudioOn }: Options): WebRTCState {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Stable refs — no re-render needed
  const streamRef   = useRef<MediaStream | null>(null);
  const peerRef     = useRef<SimplePeerInstance | null>(null);
  const socketRef   = useRef<Socket | null>(null);
  const roomIdRef   = useRef<string | undefined>(undefined);
  const userIdRef   = useRef<string>('');

  // Buffer: signals that arrived before the stream was ready
  const pendingSignals = useRef<any[]>([]);
  // Whether we should act as initiator once the stream becomes ready
  const pendingInitiator = useRef<boolean | null>(null);

  // Keep socket/room/userId refs current
  useEffect(() => { socketRef.current  = socket;  }, [socket]);
  useEffect(() => { roomIdRef.current  = roomId;  }, [roomId]);
  useEffect(() => { userIdRef.current  = userId;  }, [userId]);

  // ── 1. Acquire local media once ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { echoCancellation: true, noiseSuppression: true },
    })
      .then(stream => {
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        // Apply initial enabled state
        stream.getVideoTracks().forEach(t => { t.enabled = isVideoOn; });
        stream.getAudioTracks().forEach(t => { t.enabled = isAudioOn; });
        streamRef.current = stream;
        setLocalStream(stream);
      })
      .catch(err => {
        console.error('[WebRTC] getUserMedia error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast.error('Camera/mic permission denied. Video chat will not be available.');
        } else {
          toast.error(`Media access error: ${err.message}`);
        }
      });

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Track toggles (affect only the enabled flag, not the stream) ──────
  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = isVideoOn; });
  }, [isVideoOn]);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = isAudioOn; });
  }, [isAudioOn]);

  // ── 3. Core: create / destroy peer ───────────────────────────────────────
  function createPeer(initiator: boolean) {
    const sock   = socketRef.current;
    const room   = roomIdRef.current;
    const uid    = userIdRef.current;
    const stream = streamRef.current;

    if (!sock || !room || !stream) {
      console.warn('[WebRTC] createPeer called without socket/room/stream');
      return;
    }

    // Tear down any existing peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    console.log(`[WebRTC] creating peer — initiator: ${initiator}`);

    const peer = new SimplePeer({
      initiator,
      stream,
      trickle: true,          // send ICE candidates as they arrive (more robust)
      config: ICE_SERVERS,
    });

    peer.on('signal', signal => {
      console.log('[WebRTC] sending signal', signal.type || 'candidate');
      sock.emit('webrtc-signal', { roomId: room, from: uid, signal });
    });

    peer.on('stream', (incoming: MediaStream) => {
      console.log('[WebRTC] remote stream received');
      setRemoteStream(incoming);
    });

    peer.on('connect', () => {
      console.log('[WebRTC] peer connected');
      setIsConnected(true);
      toast.success('Video chat connected!');
    });

    peer.on('close', () => {
      console.log('[WebRTC] peer closed');
      setIsConnected(false);
      setRemoteStream(null);
      peerRef.current = null;
    });

    peer.on('error', err => {
      console.error('[WebRTC] peer error:', err);
      setIsConnected(false);
    });

    peerRef.current = peer;

    // Drain any signals buffered while stream wasn't ready
    while (pendingSignals.current.length > 0) {
      const buffered = pendingSignals.current.shift();
      console.log('[WebRTC] applying buffered signal', buffered?.type || 'candidate');
      peer.signal(buffered);
    }
  }

  // ── 4. Register socket handlers (independent of stream readiness) ─────────
  useEffect(() => {
    if (!socket || !roomId || !userId) return;

    // -------------------------------------------------------------------
    // Someone new joined the room → we (existing user) become initiator
    // -------------------------------------------------------------------
    const handleUserJoined = (data: { userId: string }) => {
      if (data.userId === userId) return;
      console.log('[WebRTC] userJoined — will initiate');

      if (streamRef.current) {
        createPeer(true);
      } else {
        // Stream not ready yet — flag that we should initiate once it is
        pendingInitiator.current = true;
        pendingSignals.current = [];
      }
    };

    // -------------------------------------------------------------------
    // Receive a WebRTC signal from the other peer
    // -------------------------------------------------------------------
    const handleSignal = (data: { from: string; signal: any }) => {
      if (data.from === userId) return;
      console.log('[WebRTC] received signal', data.signal?.type || 'candidate');

      if (peerRef.current) {
        // Peer already established — feed it the new signal
        try { peerRef.current.signal(data.signal); } catch (e) {
          console.warn('[WebRTC] signal error (peer may be closing):', e);
        }
      } else if (streamRef.current) {
        // No peer yet, stream ready → we are non-initiator, create and signal
        createPeer(false);
        try { peerRef.current?.signal(data.signal); } catch (e) {
          console.warn('[WebRTC] signal error after createPeer:', e);
        }
      } else {
        // Stream not ready yet — buffer the signal; we'll apply it once
        // the stream arrives and we create the peer (non-initiator)
        console.log('[WebRTC] buffering signal (stream not ready)');
        pendingSignals.current.push(data.signal);
      }
    };

    // -------------------------------------------------------------------
    // Remote peer disconnected
    // -------------------------------------------------------------------
    const handleUserLeft = () => {
      console.log('[WebRTC] remote user left');
      peerRef.current?.destroy();
      peerRef.current = null;
      setRemoteStream(null);
      setIsConnected(false);
      pendingSignals.current = [];
      pendingInitiator.current = null;
    };

    socket.on('webrtc-signal', handleSignal);
    socket.on('userJoined',    handleUserJoined);
    socket.on('roomClosed',    handleUserLeft);
    socket.on('room-exit',     handleUserLeft);

    return () => {
      socket.off('webrtc-signal', handleSignal);
      socket.off('userJoined',    handleUserJoined);
      socket.off('roomClosed',    handleUserLeft);
      socket.off('room-exit',     handleUserLeft);
      peerRef.current?.destroy();
      peerRef.current = null;
    };
  }, [socket, roomId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 5. Stream became available — drain pending work ───────────────────────
  useEffect(() => {
    if (!localStream) return;

    if (pendingInitiator.current === true) {
      // We received userJoined before stream was ready — initiate now
      console.log('[WebRTC] stream ready, initiating deferred peer');
      pendingInitiator.current = null;
      createPeer(true);
    } else if (pendingSignals.current.length > 0 && !peerRef.current) {
      // We received signal(s) before stream was ready — become non-initiator now
      console.log('[WebRTC] stream ready, creating deferred non-initiator peer with', pendingSignals.current.length, 'buffered signals');
      createPeer(false);
    }
  }, [localStream]); // eslint-disable-line react-hooks/exhaustive-deps

  return { localStream, remoteStream, isConnected };
}
