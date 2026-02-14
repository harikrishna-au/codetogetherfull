import { useEffect, useRef, useCallback, useState } from 'react';
import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { MonacoBinding } from 'y-monaco';
import type { Socket } from 'socket.io-client';

// ---- base64 helpers (browser-safe) ----

function uint8ToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function base64ToUint8(str: string): Uint8Array {
  const binary = atob(str);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

// ---- deterministic color per user ----

const USER_COLORS = [
  '#e57373', '#f06292', '#ba68c8', '#7986cb',
  '#4dd0e1', '#4db6ac', '#81c784', '#ffb74d',
];

export function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

// ---- public types ----

export interface PartnerUser {
  clientId: number;
  id: string;
  name: string;
  color: string;
}

export interface YjsCollaboration {
  bindToMonaco: (editor: any, monaco: any) => void;
  unbind: () => void;
  resetContent: (template: string) => void;
  getContent: () => string;
  awareness: Awareness;
  /** All remote users currently in the doc (empty until partner joins) */
  partnerUsers: PartnerUser[];
  /** True while any partner has moved their cursor in the last 1.5 s */
  partnerTyping: boolean;
  isContentEmpty: () => boolean;
}

interface Options {
  socket: Socket | null;
  roomId: string | undefined;
  userId: string;
  userName: string;
}

// ---- hook ----

export function useYjsCollaboration({ socket, roomId, userId, userName }: Options): YjsCollaboration {
  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const awarenessRef = useRef<Awareness>(new Awareness(ydocRef.current));
  const bindingRef = useRef<MonacoBinding | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [partnerUsers, setPartnerUsers] = useState<PartnerUser[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);

  // Snapshot helper — reads all remote awareness states and updates React state
  const refreshPartnerUsers = useCallback(() => {
    const awareness = awarenessRef.current;
    const ydoc = ydocRef.current;
    const users: PartnerUser[] = [];
    awareness.getStates().forEach((state, clientId) => {
      if (clientId !== ydoc.clientID && state?.user) {
        users.push({
          clientId,
          id: state.user.id ?? String(clientId),
          name: state.user.name ?? 'Partner',
          color: state.user.color ?? '#888',
        });
      }
    });
    setPartnerUsers(users);
  }, []);

  useEffect(() => {
    if (!socket || !roomId) return;

    const ydoc = ydocRef.current;
    const awareness = awarenessRef.current;

    // Identify this user so y-monaco can label our own cursor
    awareness.setLocalState({
      user: { id: userId, name: userName, color: pickColor(userId) },
    });

    // ---- incoming: full doc state (reconnect / late join) ----
    const handleSyncResponse = ({ state }: { state: string }) => {
      Y.applyUpdate(ydoc, base64ToUint8(state), 'remote');
    };

    // ---- incoming: incremental doc update ----
    const handleYjsUpdate = ({ update }: { update: string }) => {
      Y.applyUpdate(ydoc, base64ToUint8(update), 'remote');
    };

    // ---- incoming: awareness (cursors / typing indicator) ----
    const handleAwareness = ({ update }: { update: string }) => {
      applyAwarenessUpdate(awareness, base64ToUint8(update), 'remote');
    };

    socket.on('yjs:sync-response', handleSyncResponse);
    socket.on('yjs:update', handleYjsUpdate);
    socket.on('yjs:awareness', handleAwareness);

    // ---- outgoing: relay local doc changes ----
    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin !== 'remote') {
        socket.emit('yjs:update', { roomId, update: uint8ToBase64(update) });
      }
    };
    ydoc.on('update', handleDocUpdate);

    // ---- outgoing + reactive: awareness changes ----
    const handleAwarenessChange = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown,
    ) => {
      // Always refresh partner list (handles joins, moves, and leaves)
      refreshPartnerUsers();

      // Typing indicator: any remote cursor move = partner is typing
      const remoteChanges = [...added, ...updated].filter(id => id !== ydoc.clientID);
      if (remoteChanges.length > 0) {
        setPartnerTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setPartnerTyping(false), 1500);
      }

      // Send local changes to server
      if (origin !== 'remote') {
        const changed = [...added, ...updated, ...removed];
        socket.emit('yjs:awareness', {
          roomId,
          update: uint8ToBase64(encodeAwarenessUpdate(awareness, changed)),
        });
      }
    };
    awareness.on('change', handleAwarenessChange);

    // Request the current doc state
    socket.emit('yjs:sync-request', { roomId });

    return () => {
      socket.off('yjs:sync-response', handleSyncResponse);
      socket.off('yjs:update', handleYjsUpdate);
      socket.off('yjs:awareness', handleAwareness);
      ydoc.off('update', handleDocUpdate);
      awareness.off('change', handleAwarenessChange);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [socket, roomId, userId, userName, refreshPartnerUsers]);

  const bindToMonaco = useCallback((editor: any, _monaco: any) => {
    const yText = ydocRef.current.getText('monaco');

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      awarenessRef.current,
    );
  }, []);

  const resetContent = useCallback((template: string) => {
    const yText = ydocRef.current.getText('monaco');
    ydocRef.current.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, template);
    });
  }, []);

  const getContent = useCallback(() => {
    return ydocRef.current.getText('monaco').toString();
  }, []);

  const isContentEmpty = useCallback(() => {
    const yText = ydocRef.current.getText('monaco');
    return yText.length === 0;
  }, []);

  // Explicitly unbind Monaco from Yjs
  const unbind = useCallback(() => {
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
  }, []);

  return { bindToMonaco, unbind, resetContent, getContent, awareness: awarenessRef.current, partnerUsers, partnerTyping, isContentEmpty };
}
