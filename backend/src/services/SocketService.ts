import { Server } from 'socket.io';
import { authenticateSocket } from '@/middleware/auth.js';
import { supabase } from '@/config/supabase.js';
import { logger } from '@/utils/logger.js';
import type { AuthenticatedSocket, ClientToServerEvents, ServerToClientEvents } from '@/types/index.js';

export class SocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    this.setupSocketHandlers();
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
        await this.handleJoinQueue(socket, data.type);
      } catch (error) {
        logger.error('Failed to join queue:', error);
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

  private async handleJoinQueue(socket: AuthenticatedSocket, queueType: string): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) throw new Error('User not authenticated');

    // Update user state to waiting
    await supabase.from('user_states').update({
      state: 'waiting',
      mode: queueType,
      difficulty: 'Easy', // Default
      queue_joined_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    }).eq('user_id', userId);

    logger.info('User joined queue', {
      userId,
      queueType,
      socketId: socket.id,
    });

    // Emit queue joined confirmation
    socket.emit('queueJoined', {
      type: queueType,
      timestamp: Date.now(),
    });
  }

  private async handleRejoinQueue(socket: AuthenticatedSocket, _queueType: string): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) throw new Error('User not authenticated');

    // Check if user is already in queue
    const { data: userState } = await supabase
      .from('user_states')
      .select('state, mode, difficulty')
      .eq('user_id', userId)
      .single();

    if (userState && userState.state === 'waiting') {
      // User is already in queue
      socket.emit('queueRejoined', {
        waiting: true,
        mode: userState.mode,
        difficulty: userState.difficulty,
      });

      logger.info('User rejoined existing queue', {
        userId,
        mode: userState.mode,
        difficulty: userState.difficulty,
      });
    } else {
      // User not in queue, emit rejoin response
      socket.emit('queueRejoined', {
        waiting: false,
      });

      logger.info('User not in queue for rejoin', { userId });
    }
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

    // For now, return a default response - will be implemented with Room/Question models
    logger.debug('Room question requested', {
      userId,
      roomId,
    });

    return {
      success: true,
      question: {
        id: 'default',
        title: 'Sample Question',
        description: 'This is a sample question for testing.',
        difficulty: 'Easy',
      },
      questionIndex: 0,
    };
  }

  private async handleDisconnection(socket: AuthenticatedSocket, reason: string): Promise<void> {
    const userId = socket.user?.userId;
    if (!userId) return;

    try {
      // Update user state
      await supabase.from('user_states').update({
        socket_id: null,
        is_active: false
      }).eq('user_id', userId);

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