import { Server } from 'socket.io';
import * as Y from 'yjs';
import { authenticateSocket } from '@/middleware/auth.js';
import { supabase } from '@/config/supabase.js';
import { logger } from '@/utils/logger.js';
import { TimerService } from './TimerService.js';
import { MatchmakingService } from './MatchmakingService.js';
import type { AuthenticatedSocket, ClientToServerEvents, ServerToClientEvents } from '@/types/index.js';

export class SocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  /** One Y.Doc per room — persists editor state for reconnecting users */
  private yjsRooms: Map<string, Y.Doc> = new Map();
  private timerService: TimerService;
  private matchmakingService: MatchmakingService;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    this.timerService = new TimerService(io);
    this.matchmakingService = new MatchmakingService(io);
    this.setupSocketHandlers();
    // Initialize timers for existing active rooms
    this.timerService.initializeActiveRoomTimers();
  }

  private setupSocketHandlers(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          throw new Error('No authentication token provided');
        }

        const authResult = await authenticateSocket(token);
        socket.user = authResult.user;
        socket.dbUser = authResult.dbUser;

        logger.debug('Socket authenticated successfully', {
          socketId: socket.id,
          userId: socket.user?.userId,
        });

        next();
      } catch (error) {
        logger.warn('Socket authentication failed', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    try {
      // Update user state with socket connection
      await this.updateUserSocketConnection(userId, socket.id);

      // Store connection mappings
      this.connectedUsers.set(userId, socket.id);
      this.socketUsers.set(socket.id, userId);

      logger.info('User connected via socket', {
        userId,
        socketId: socket.id,
        totalConnections: this.connectedUsers.size,
      });

      // Set up event handlers
      this.setupEventHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

    } catch (error) {
      logger.error('Failed to handle socket connection:', error);
      socket.disconnect();
    }
  }

  private setupEventHandlers(socket: AuthenticatedSocket): void {
    const userId = socket.user?.userId;
    if (!userId) return;

    // Join room event
    socket.on('join', async (data, callback) => {
      try {
        await this.handleJoinRoom(socket, data.roomId);
        callback?.({ success: true });
      } catch (error) {
        logger.error('Failed to join room:', error);
        callback?.({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Join queue event
    socket.on('joinQueue', async (data) => {
      try {
        await this.handleJoinQueue(socket, data.type, data.difficulty);
      } catch (error) {
        logger.error('Failed to join queue:', error);
      }
    });

    // Leave queue event (cancel)
    socket.on('leaveQueue', async () => {
      try {
        const uid = socket.user?.userId;
        if (!uid) return;
        this.matchmakingService.removeUserFromAllQueues(uid);
        await supabase.from('user_states').update({
          state: 'idle',
          mode: null,
          difficulty: null,
          queue_joined_at: null,
          room_id: null,
        }).eq('user_id', uid);
        logger.info('User left queue', { userId: uid });
      } catch (error) {
        logger.error('Failed to handle leaveQueue:', error);
      }
    });

    // Rejoin queue event
    socket.on('rejoinQueue', async (data) => {
      try {
        await this.handleRejoinQueue(socket, data.type);
      } catch (error) {
        logger.error('Failed to rejoin queue:', error);
      }
    });

    // Chat message event
    socket.on('chatMessage', async (data) => {
      try {
        await this.handleChatMessage(socket, data);
      } catch (error) {
        logger.error('Failed to handle chat message:', error);
      }
    });

    // Code change event
    socket.on('codeChange', async (data) => {
      try {
        await this.handleCodeChange(socket, data);
      } catch (error) {
        logger.error('Failed to handle code change:', error);
      }
    });

    // Fetch chat history event
    socket.on('fetchChatHistory', async (data, callback) => {
      try {
        const history = await this.handleFetchChatHistory(socket, data.roomId);
        callback?.({ success: true, messages: history });
      } catch (error) {
        logger.error('Failed to fetch chat history:', error);
        callback?.({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Get room question event
    socket.on('getRoomQuestion', async (data, callback) => {
      try {
        const result = await this.handleGetRoomQuestion(socket, data.roomId);
        callback?.(result);
      } catch (error) {
        logger.error('Failed to get room question:', error);
        callback?.({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Submission result broadcast event
    socket.on('submissionResult', (data) => {
      const userId = socket.user?.userId || 'unknown';
      this.io.to(data.roomId).emit('submissionResult', {
        userId,
        passed: data.passed,
        total: data.total,
        timestamp: Date.now(),
      });
    });

    // NOTE: The client-trusted `submissionWin` event was removed (A3). Wins are now
    // decided server-side in routes/execute.ts -> endRoomWithWin(), which verifies the
    // submission actually passed all tests against the DB test cases. The server still
    // broadcasts `roundWinner`; clients only listen for it.

    // Sync code: one user shares their code to activate collaborative editing
    socket.on('syncCode', (data: { roomId: string; code: string }) => {
      const userId = socket.user?.userId || 'unknown';
      logger.info('Code sync initiated', { userId, roomId: data.roomId });
      // Broadcast to everyone in the room (including sender) so all clients activate Yjs with this code
      this.io.to(data.roomId).emit('codeSynced', {
        initiatorId: userId,
        code: data.code,
      });
    });

    // ---- Yjs collaborative editing ----

    // New joiner requests the full document state
    socket.on('yjs:sync-request', (data) => {
      const doc = this.getOrCreateYjsDoc(data.roomId);
      const state = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
      socket.emit('yjs:sync-response', { state });
      logger.debug('Yjs sync-response sent', { roomId: data.roomId, socketId: socket.id });
    });

    // Incremental update from a client — persist + relay to others
    socket.on('yjs:update', (data) => {
      try {
        const update = Buffer.from(data.update, 'base64');
        const doc = this.getOrCreateYjsDoc(data.roomId);
        Y.applyUpdate(doc, update);
        // Relay to everyone else in the room
        socket.to(data.roomId).emit('yjs:update', { update: data.update });
      } catch (err) {
        logger.error('Failed to apply Yjs update', { err });
      }
    });

    // Awareness (cursor positions) — relay only, no server-side storage needed
    socket.on('yjs:awareness', (data) => {
      socket.to(data.roomId).emit('yjs:awareness', { update: data.update });
    });

    // Language change — relay to partners so their language selector updates
    socket.on('languageChange', (data) => {
      socket.to(data.roomId).emit('languageChange', {
        language: data.language,
        template: data.template,
      });
      logger.debug('Language change relayed', { roomId: data.roomId, language: data.language });
    });

    // Timer sync request — send current timer state for the room
    socket.on('requestTimerSync', async (data: { roomId: string }) => {
      try {
        const { data: room } = await supabase
          .from('rooms')
          .select('created_at, status')
          .eq('room_id', data.roomId)
          .single();

        if (room && room.status === 'active' && room.created_at) {
          const SESSION_DURATION_MS = 45 * 60 * 1000; // 45 minutes
          const startTime = new Date(room.created_at).getTime();
          const endTime = startTime + SESSION_DURATION_MS;
          const now = Date.now();
          const isActive = now < endTime;

          socket.emit('timer-sync', {
            roomId: data.roomId,
            startTime,
            endTime,
            duration: SESSION_DURATION_MS,
            isActive
          });

          logger.debug('Timer sync sent', { roomId: data.roomId, isActive });
        }
      } catch (err) {
        logger.error('Failed to sync timer', { err, roomId: data.roomId });
      }
    });

    // WebRTC signaling relay — forward signal to the other peer
    socket.on('webrtc-signal', (data: { roomId: string; from: string; signal: any }) => {
      socket.to(data.roomId).emit('webrtc-signal', {
        from: data.from,
        signal: data.signal,
      });
    });
  }

  private getOrCreateYjsDoc(roomId: string): Y.Doc {
    if (!this.yjsRooms.has(roomId)) {
      this.yjsRooms.set(roomId, new Y.Doc());
      logger.debug('Created Yjs doc for room', { roomId });
    }
    return this.yjsRooms.get(roomId)!;
  }

  /**
   * Server-authoritative room end + winner broadcast (A3 / A4).
   *
   * Ends the room ONLY if it is still `active` (conditional update guards against
   * double-wins: two near-simultaneous winning submissions, or submit + forfeit).
   * Returns true if THIS call actually ended the room, false if it was already over.
   */
  public async endRoomWithWin(params: {
    roomId: string;
    winnerId: string;
    passed: number;
    total: number;
    runtime: number;
    language: string;
    reason?: 'submission' | 'forfeit' | 'timer';
  }): Promise<boolean> {
    const { roomId, winnerId, passed, total, runtime, language } = params;
    const reason = params.reason ?? 'submission';

    // Conditional end: only transition active -> ended, and only one caller wins the race.
    const { data: endedRooms, error: endErr } = await supabase
      .from('rooms')
      .update({ status: 'ended', ended_at: new Date().toISOString(), end_reason: reason })
      .eq('room_id', roomId)
      .eq('status', 'active')
      .select('participant1_id, participant2_id');

    if (endErr) {
      logger.error('Failed to end room', { roomId, error: endErr });
      return false;
    }

    // No rows updated => room was already ended by another path. Do not broadcast again.
    if (!endedRooms || endedRooms.length === 0) {
      logger.info('Room already ended, skipping duplicate win', { roomId, winnerId });
      return false;
    }

    const room = endedRooms[0];
    const participants = [room.participant1_id, room.participant2_id].filter(Boolean);
    if (participants.length > 0) {
      await supabase.from('user_states').update({
        state: 'idle',
        room_id: null,
        last_active: new Date().toISOString(),
      }).in('user_id', participants);
    }

    // Stop the room timer and free the collaborative doc.
    this.timerService.stopRoomTimer(roomId);
    this.cleanupYjsRoom(roomId);

    logger.info('Room ended with winner', { roomId, winnerId, reason, passed, total });

    // Broadcast to everyone in the room so all clients show the result.
    this.io.to(roomId).emit('roundWinner', {
      winnerId,
      passed,
      total,
      runtime,
      language,
      reason,
      timestamp: Date.now(),
    });

    return true;
  }

  /** Call when a room ends to free the Y.Doc from memory */
  public cleanupYjsRoom(roomId: string): void {
    const doc = this.yjsRooms.get(roomId);
    if (doc) {
      doc.destroy();
      this.yjsRooms.delete(roomId);
      logger.debug('Yjs doc cleaned up for room', { roomId });
    }
  }

  private async updateUserSocketConnection(userId: string, socketId: string): Promise<void> {
    try {
      await supabase.from('user_states').upsert({
        user_id: userId,
        socket_id: socketId,
        is_active: true,
        last_active: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (error) {
      logger.error('Failed to update user socket connection:', error);
      throw error;
    }
  }

  private async handleJoinRoom(socket: AuthenticatedSocket, roomId: string): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) throw new Error('User not authenticated');

    // Join the socket room
    await socket.join(roomId);

    // Update user state
    await supabase.from('user_states').update({
      state: 'in-session',
      room_id: roomId,
      queue_joined_at: null,
      last_active: new Date().toISOString()
    }).eq('user_id', userId);

    // Start room timer if not already started
    const { data: room } = await supabase
      .from('rooms')
      .select('created_at')
      .eq('room_id', roomId)
      .single();

    if (room?.created_at) {
      this.timerService.startRoomTimer(roomId, room.created_at);
    }

    logger.info('User joined room', {
      userId,
      roomId,
      socketId: socket.id,
    });

    // Notify other users in the room
    socket.to(roomId).emit('userJoined', {
      userId,
      timestamp: Date.now(),
    });
  }

  private async handleJoinQueue(socket: AuthenticatedSocket, queueType: string, difficulty?: string): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) throw new Error('User not authenticated');

    const mode = queueType || 'friendly';
    const normalizedDifficulty = (difficulty || 'easy').toLowerCase();

    // Persist waiting state
    await supabase.from('user_states').upsert({
      user_id: userId,
      state: 'waiting',
      mode,
      difficulty: normalizedDifficulty,
      socket_id: socket.id,
      is_active: true,
      room_id: null,
      queue_joined_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logger.info('User joined queue', { userId, mode, difficulty: normalizedDifficulty, socketId: socket.id });

    // Confirm to client
    socket.emit('queueJoined', { type: mode, difficulty: normalizedDifficulty, timestamp: Date.now() });

    // Attempt immediate match via in-memory queues
    await this.matchmakingService.joinQueue(userId, socket.id, mode, normalizedDifficulty);
  }

  private async handleRejoinQueue(socket: AuthenticatedSocket, _queueType: string): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) throw new Error('User not authenticated');

    // Check if user is already in queue or matched
    const { data: userState } = await supabase
      .from('user_states')
      .select('state, mode, difficulty, room_id')
      .eq('user_id', userId)
      .single();

    if (userState) {
      if (userState.state === 'matched' || userState.state === 'in-session') {
        if (userState.room_id) {
          logger.info('User reconnected to active match', { userId, roomId: userState.room_id });
          socket.emit('matchFound', {
            roomId: userState.room_id,
            difficulty: userState.difficulty,
            rejoin: true
          });
          return;
        }
      } else if (userState.state === 'waiting' && userState.mode && userState.difficulty) {
        // Re-add to in-memory queue with CURRENT socket id (old socketId is stale after reconnect)
        await supabase.from('user_states')
          .update({ socket_id: socket.id, is_active: true, last_active: new Date().toISOString() })
          .eq('user_id', userId);

        await this.matchmakingService.joinQueue(userId, socket.id, userState.mode, userState.difficulty);

        logger.info('User re-added to queue on rejoin', {
          userId,
          mode: userState.mode,
          difficulty: userState.difficulty,
          socketId: socket.id,
        });

        socket.emit('queueRejoined', {
          waiting: true,
          mode: userState.mode,
          difficulty: userState.difficulty,
        });
        return;
      }
    }

    // User not in queue or active match
    socket.emit('queueRejoined', {
      waiting: false,
    });

    logger.info('User not in queue for rejoin', { userId });
  }

  private async handleChatMessage(socket: AuthenticatedSocket, data: {
    roomId: string;
    message: string;
    sender: string;
  }): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) throw new Error('User not authenticated');

    const chatData = {
      message: data.message,
      sender: data.sender,
      timestamp: Date.now(),
    };

    // Broadcast to all users in the room
    this.io.to(data.roomId).emit('chatMessage', chatData);

    logger.debug('Chat message sent', {
      userId,
      roomId: data.roomId,
      messageLength: data.message.length,
    });
  }

  private async handleCodeChange(socket: AuthenticatedSocket, data: {
    roomId: string;
    code: string;
  }): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) throw new Error('User not authenticated');

    // Broadcast code change to other users in the room
    socket.to(data.roomId).emit('codeSync', {
      code: data.code,
      userId,
    });

    logger.debug('Code change synchronized', {
      userId,
      roomId: data.roomId,
      codeLength: data.code.length,
    });
  }

  private async handleFetchChatHistory(socket: AuthenticatedSocket, roomId: string): Promise<any[]> {
    const userId = socket.user?.userId;
    if (!userId) throw new Error('User not authenticated');

    // For now, return empty array - will be implemented with Room model
    logger.debug('Chat history requested', {
      userId,
      roomId,
    });

    return [];
  }

  private async handleGetRoomQuestion(socket: AuthenticatedSocket, roomId: string): Promise<any> {
    const userId = socket.user?.userId;
    if (!userId) throw new Error('User not authenticated');

    // Look up the room to get the assigned question_id
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('question_id, difficulty')
      .eq('room_id', roomId)
      .single();

    if (roomErr || !room?.question_id) {
      logger.warn('Room or question not found for getRoomQuestion', { roomId, userId });
      return { success: false, error: 'Question not found for this room' };
    }

    // Fetch the full question
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .select('id, title, description, difficulty, examples, constraints, starter_code, tags')
      .eq('id', room.question_id)
      .single();

    if (qErr || !question) {
      logger.error('Failed to fetch question for room', { roomId, questionId: room.question_id });
      return { success: false, error: 'Failed to load question' };
    }

    logger.debug('Room question retrieved', { userId, roomId, questionId: question.id });

    return {
      success: true,
      question: {
        id: question.id,
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        examples: question.examples,
        constraints: question.constraints,
        starterCode: question.starter_code,
        tags: question.tags,
      },
    };
  }

  private async handleDisconnection(socket: AuthenticatedSocket, reason: string): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) return;

    try {
      // Remove from in-memory matchmaking queues if still waiting
      this.matchmakingService.removeUserFromAllQueues(userId);

      // Clear connection info for all states
      await supabase.from('user_states').update({
        socket_id: null,
        is_active: false,
      }).eq('user_id', userId);

      // Reset 'waiting' → 'idle' so stale queue state doesn't block future matchmaking
      await supabase.from('user_states').update({
        state: 'idle',
        queue_joined_at: null,
      }).eq('user_id', userId).eq('state', 'waiting');

      // Remove from connection mappings
      this.connectedUsers.delete(userId);
      this.socketUsers.delete(socket.id);

      logger.info('User disconnected from socket', {
        userId,
        socketId: socket.id,
        reason,
        totalConnections: this.connectedUsers.size,
      });

    } catch (error) {
      logger.error('Failed to handle socket disconnection:', error);
    }
  }

  // Public methods for external use
  public async notifyUser(userId: string, event: string, data: any): Promise<boolean> {
    const socketId = this.connectedUsers.get(userId);
    if (!socketId) {
      logger.debug('User not connected for notification', { userId, event });
      return false;
    }

    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) {
      logger.debug('Socket not found for notification', { userId, socketId, event });
      this.connectedUsers.delete(userId);
      return false;
    }

    socket.emit(event as any, data);
    logger.debug('Notification sent to user', { userId, event });
    return true;
  }

  public async notifyRoom(roomId: string, event: string, data: any): Promise<void> {
    this.io.to(roomId).emit(event as any, data);
    logger.debug('Notification sent to room', { roomId, event });
  }

  /** Remove a single user from all in-memory queues (e.g. admin cancel). */
  public removeUserFromQueues(userId: string): void {
    this.matchmakingService.removeUserFromAllQueues(userId);
  }

  /** Clear all in-memory matchmaking queues. Returns number of users removed. */
  public clearAllQueues(): number {
    const sizes = this.matchmakingService.getQueueSizes();
    const total = Object.values(sizes).reduce((a, b) => a + b, 0);
    this.matchmakingService.clearAllQueues();
    return total;
  }

  /** Live queue sizes keyed by "mode:difficulty" */
  public getQueueStats(): Record<string, number> {
    return this.matchmakingService.getQueueSizes();
  }

  public getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}