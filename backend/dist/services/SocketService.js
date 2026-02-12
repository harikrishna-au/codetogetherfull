import { authenticateSocket } from '@/middleware/auth.js';
import { UserState } from '@/models/UserState.js';
import { logger } from '@/utils/logger.js';
export class SocketService {
    io;
    connectedUsers = new Map();
    socketUsers = new Map();
    constructor(io) {
        this.io = io;
        this.setupSocketHandlers();
    }
    setupSocketHandlers() {
        this.io.use(async (socket, next) => {
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
            }
            catch (error) {
                logger.warn('Socket authentication failed', {
                    socketId: socket.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                next(new Error('Authentication failed'));
            }
        });
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    async handleConnection(socket) {
        const userId = socket.user?.userId;
        if (!userId) {
            socket.disconnect();
            return;
        }
        try {
            await this.updateUserSocketConnection(userId, socket.id);
            this.connectedUsers.set(userId, socket.id);
            this.socketUsers.set(socket.id, userId);
            logger.info('User connected via socket', {
                userId,
                socketId: socket.id,
                totalConnections: this.connectedUsers.size,
            });
            this.setupEventHandlers(socket);
            socket.on('disconnect', (reason) => {
                this.handleDisconnection(socket, reason);
            });
        }
        catch (error) {
            logger.error('Failed to handle socket connection:', error);
            socket.disconnect();
        }
    }
    setupEventHandlers(socket) {
        const userId = socket.user?.userId;
        if (!userId)
            return;
        socket.on('join', async (data, callback) => {
            try {
                await this.handleJoinRoom(socket, data.roomId);
                callback?.({ success: true });
            }
            catch (error) {
                logger.error('Failed to join room:', error);
                callback?.({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        });
        socket.on('joinQueue', async (data) => {
            try {
                await this.handleJoinQueue(socket, data.type);
            }
            catch (error) {
                logger.error('Failed to join queue:', error);
            }
        });
        socket.on('rejoinQueue', async (data) => {
            try {
                await this.handleRejoinQueue(socket, data.type);
            }
            catch (error) {
                logger.error('Failed to rejoin queue:', error);
            }
        });
        socket.on('chatMessage', async (data) => {
            try {
                await this.handleChatMessage(socket, data);
            }
            catch (error) {
                logger.error('Failed to handle chat message:', error);
            }
        });
        socket.on('codeChange', async (data) => {
            try {
                await this.handleCodeChange(socket, data);
            }
            catch (error) {
                logger.error('Failed to handle code change:', error);
            }
        });
        socket.on('fetchChatHistory', async (data, callback) => {
            try {
                const history = await this.handleFetchChatHistory(socket, data.roomId);
                callback?.({ success: true, messages: history });
            }
            catch (error) {
                logger.error('Failed to fetch chat history:', error);
                callback?.({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        });
        socket.on('getRoomQuestion', async (data, callback) => {
            try {
                const result = await this.handleGetRoomQuestion(socket, data.roomId);
                callback?.(result);
            }
            catch (error) {
                logger.error('Failed to get room question:', error);
                callback?.({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        });
    }
    async updateUserSocketConnection(userId, socketId) {
        try {
            let userState = await UserState.findOne({ userId: userId });
            if (!userState) {
                userState = new UserState({
                    userId,
                    state: 'idle',
                    lastActive: new Date(),
                    isActive: true,
                    socketId,
                });
            }
            else {
                userState.socketId = socketId;
                userState.isActive = true;
                userState.lastActive = new Date();
            }
            await userState.save();
        }
        catch (error) {
            logger.error('Failed to update user socket connection:', error);
            throw error;
        }
    }
    async handleJoinRoom(socket, roomId) {
        const userId = socket.user?.userId;
        if (!userId)
            throw new Error('User not authenticated');
        await socket.join(roomId);
        const userState = await UserState.findOne({ userId: userId });
        if (userState) {
            userState.state = 'in-session';
            userState.roomId = roomId;
            userState.queueJoinedAt = undefined;
            userState.lastActive = new Date();
            await userState.save();
        }
        logger.info('User joined room', {
            userId,
            roomId,
            socketId: socket.id,
        });
        socket.to(roomId).emit('userJoined', {
            userId,
            timestamp: Date.now(),
        });
    }
    async handleJoinQueue(socket, queueType) {
        const userId = socket.user?.userId;
        if (!userId)
            throw new Error('User not authenticated');
        const userState = await UserState.findOne({ userId: userId });
        if (userState) {
            userState.state = 'waiting';
            userState.mode = queueType;
            userState.difficulty = 'Easy';
            userState.queueJoinedAt = new Date();
            userState.lastActive = new Date();
            await userState.save();
        }
        logger.info('User joined queue', {
            userId,
            queueType,
            socketId: socket.id,
        });
        socket.emit('queueJoined', {
            type: queueType,
            timestamp: Date.now(),
        });
    }
    async handleRejoinQueue(socket, _queueType) {
        const userId = socket.user?.userId;
        if (!userId)
            throw new Error('User not authenticated');
        const userState = await UserState.findOne({ userId: userId });
        if (userState && userState.state === 'waiting') {
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
        }
        else {
            socket.emit('queueRejoined', {
                waiting: false,
            });
            logger.info('User not in queue for rejoin', { userId });
        }
    }
    async handleChatMessage(socket, data) {
        const userId = socket.user?.userId;
        if (!userId)
            throw new Error('User not authenticated');
        const chatData = {
            message: data.message,
            sender: data.sender,
            timestamp: Date.now(),
        };
        this.io.to(data.roomId).emit('chatMessage', chatData);
        logger.debug('Chat message sent', {
            userId,
            roomId: data.roomId,
            messageLength: data.message.length,
        });
    }
    async handleCodeChange(socket, data) {
        const userId = socket.user?.userId;
        if (!userId)
            throw new Error('User not authenticated');
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
    async handleFetchChatHistory(socket, roomId) {
        const userId = socket.user?.userId;
        if (!userId)
            throw new Error('User not authenticated');
        logger.debug('Chat history requested', {
            userId,
            roomId,
        });
        return [];
    }
    async handleGetRoomQuestion(socket, roomId) {
        const userId = socket.user?.userId;
        if (!userId)
            throw new Error('User not authenticated');
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
    async handleDisconnection(socket, reason) {
        const userId = socket.user?.userId;
        if (!userId)
            return;
        try {
            const userState = await UserState.findOne({ userId: userId });
            if (userState) {
                userState.socketId = undefined;
                userState.isActive = false;
                await userState.save();
            }
            this.connectedUsers.delete(userId);
            this.socketUsers.delete(socket.id);
            logger.info('User disconnected from socket', {
                userId,
                socketId: socket.id,
                reason,
                totalConnections: this.connectedUsers.size,
            });
        }
        catch (error) {
            logger.error('Failed to handle socket disconnection:', error);
        }
    }
    async notifyUser(userId, event, data) {
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
        socket.emit(event, data);
        logger.debug('Notification sent to user', { userId, event });
        return true;
    }
    async notifyRoom(roomId, event, data) {
        this.io.to(roomId).emit(event, data);
        logger.debug('Notification sent to room', { roomId, event });
    }
    getConnectedUserCount() {
        return this.connectedUsers.size;
    }
    getConnectedUsers() {
        return Array.from(this.connectedUsers.keys());
    }
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }
}
//# sourceMappingURL=SocketService.js.map