import jwt from 'jsonwebtoken';

export function setupSocketHandlers(io, { sessionManager, queueManager, roomManager }) {
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.sessionId = decoded.sessionId;
      socket.userId = decoded.userId;
      
      // Verify session exists and is active
      const session = await sessionManager.getSession(decoded.sessionId);
      if (!session || !session.isActive) {
        return next(new Error('Invalid or inactive session'));
      }

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.sessionId})`);
    
    // Update user activity
    sessionManager.updateHeartbeat(socket.sessionId);

    // Join user to their personal room for direct messaging
    socket.join(`user_${socket.sessionId}`);

    // Handle joining matchmaking queue
    socket.on('joinQueue', async (data) => {
      try {
        const { difficulty, mode, userData } = data;
        
        // Add to queue
        queueManager.addToQueue(socket.sessionId, difficulty, { 
          ...userData, 
          mode, 
          socketId: socket.id 
        });
        
        // Update session state
        sessionManager.setUserState(socket.sessionId, 'waiting', { 
          difficulty, 
          mode 
        });

        // Send queue position
        const position = queueManager.getQueuePosition(socket.sessionId);
        socket.emit('queueJoined', { 
          success: true, 
          position,
          difficulty 
        });

        // Try to find a match
        const match = queueManager.findMatch(difficulty);
        if (match) {
          await handleMatch(match, difficulty);
        }

        // Broadcast queue count update
        broadcastQueueCounts();
        
      } catch (error) {
        console.error('Join queue error:', error);
        socket.emit('queueError', { error: error.message });
      }
    });

    // Handle leaving queue
    socket.on('leaveQueue', () => {
      try {
        queueManager.removeFromAllQueues(socket.sessionId);
        sessionManager.setUserState(socket.sessionId, 'na');
        
        socket.emit('queueLeft', { success: true });
        broadcastQueueCounts();
        
      } catch (error) {
        console.error('Leave queue error:', error);
        socket.emit('queueError', { error: error.message });
      }
    });

    // Handle joining a room
    socket.on('join', async (data, callback) => {
      try {
        const { roomId } = data;
        const room = roomManager.getRoom(roomId);
        
        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        // Check if user is part of this room
        const isUserInRoom = room.users.some(u => u.sessionId === socket.sessionId);
        if (!isUserInRoom) {
          return callback({ success: false, error: 'Not authorized for this room' });
        }

        // Join socket room
        socket.join(roomId);
        socket.currentRoom = roomId;
        
        // Update user activity
        roomManager.updateUserActivity(socket.sessionId);
        
        // Mark user as ready
        roomManager.setUserReady(socket.sessionId, true);
        
        // Update session state
        sessionManager.setUserState(socket.sessionId, 'in-session', { roomId });

        callback({ success: true, room });
        
        // Notify other users in room
        socket.to(roomId).emit('userJoined', {
          sessionId: socket.sessionId,
          userId: socket.userId
        });

        // If all users are ready, start the session
        if (room.users.every(u => u.ready)) {
          io.to(roomId).emit('sessionReady', { room });
        }
        
      } catch (error) {
        console.error('Join room error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Handle code changes
    socket.on('codeChange', (data) => {
      try {
        const { roomId, code } = data;
        
        if (socket.currentRoom !== roomId) {
          return socket.emit('error', { message: 'Not in this room' });
        }

        // Update room code
        roomManager.updateCode(roomId, code, socket.sessionId);
        
        // Broadcast to other users in room
        socket.to(roomId).emit('codeChange', {
          code,
          changedBy: socket.sessionId
        });
        
      } catch (error) {
        console.error('Code change error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle language changes
    socket.on('languageChange', (data) => {
      try {
        const { roomId, language } = data;
        
        if (socket.currentRoom !== roomId) {
          return socket.emit('error', { message: 'Not in this room' });
        }

        // Update room language
        roomManager.updateLanguage(roomId, language, socket.sessionId);
        
        // Broadcast to other users in room
        socket.to(roomId).emit('languageChange', {
          language,
          changedBy: socket.sessionId
        });
        
      } catch (error) {
        console.error('Language change error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
      try {
        const { roomId, message, sender } = data;
        
        if (socket.currentRoom !== roomId) {
          return socket.emit('error', { message: 'Not in this room' });
        }

        // Add message to room
        const chatMessage = roomManager.addChatMessage(roomId, message, sender, socket.sessionId);
        
        if (chatMessage) {
          // Broadcast to all users in room (including sender)
          io.to(roomId).emit('chatMessage', {
            message: chatMessage.message,
            sender: chatMessage.sender,
            timestamp: chatMessage.timestamp
          });
        }
        
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle fetching chat history
    socket.on('fetchChatHistory', (data, callback) => {
      try {
        const { roomId } = data;
        const history = roomManager.getChatHistory(roomId);
        
        callback({
          success: true,
          messages: history.map(msg => ({
            text: msg.message,
            sender: msg.sender,
            timestamp: msg.timestamp
          }))
        });
        
      } catch (error) {
        console.error('Fetch chat history error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Handle test results
    socket.on('testResults', (data) => {
      try {
        const { roomId, results } = data;
        
        if (socket.currentRoom !== roomId) {
          return socket.emit('error', { message: 'Not in this room' });
        }

        // Update room test results
        roomManager.updateTestResults(roomId, results, socket.sessionId);
        
        // Broadcast to other users in room
        socket.to(roomId).emit('testResults', {
          results,
          submittedBy: socket.sessionId
        });
        
      } catch (error) {
        console.error('Test results error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle room leaving
    socket.on('leaveRoom', () => {
      try {
        if (socket.currentRoom) {
          const room = roomManager.removeUserFromRoom(socket.sessionId);
          
          // Leave socket room
          socket.leave(socket.currentRoom);
          
          // Notify other users
          socket.to(socket.currentRoom).emit('userLeft', {
            sessionId: socket.sessionId,
            userId: socket.userId
          });
          
          socket.currentRoom = null;
          
          // Update session state
          sessionManager.setUserState(socket.sessionId, 'na');
          
          socket.emit('roomLeft', { success: true });
        }
        
      } catch (error) {
        console.error('Leave room error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle heartbeat
    socket.on('heartbeat', () => {
      sessionManager.updateHeartbeat(socket.sessionId);
      socket.emit('heartbeatAck');
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.userId} (${socket.sessionId}) - ${reason}`);
      
      // Remove from queue
      queueManager.removeFromAllQueues(socket.sessionId);
      
      // Handle room cleanup
      if (socket.currentRoom) {
        roomManager.removeUserFromRoom(socket.sessionId);
        socket.to(socket.currentRoom).emit('userLeft', {
          sessionId: socket.sessionId,
          userId: socket.userId
        });
      }
      
      // Mark user as inactive after a delay (in case of reconnection)
      setTimeout(() => {
        sessionManager.markUserInactive(socket.sessionId);
      }, 30000); // 30 seconds grace period
      
      broadcastQueueCounts();
    });

    // Helper function to handle matches
    async function handleMatch(match, difficulty) {
      try {
        // Create room for matched users
        const room = roomManager.createRoom(
          match.user1.sessionId,
          match.user2.sessionId,
          difficulty
        );

        // Update session states
        sessionManager.setUserState(match.user1.sessionId, 'matched', { roomId: room.id });
        sessionManager.setUserState(match.user2.sessionId, 'matched', { roomId: room.id });

        // Notify matched users
        io.to(`user_${match.user1.sessionId}`).emit('matchFound', {
          roomId: room.id,
          opponent: match.user2.userData,
          difficulty
        });

        io.to(`user_${match.user2.sessionId}`).emit('matchFound', {
          roomId: room.id,
          opponent: match.user1.userData,
          difficulty
        });

        console.log(`Match created: Room ${room.id} for ${match.user1.sessionId} vs ${match.user2.sessionId}`);
        
      } catch (error) {
        console.error('Handle match error:', error);
        
        // Put users back in queue on error
        queueManager.addToQueue(match.user1.sessionId, difficulty, match.user1.userData);
        queueManager.addToQueue(match.user2.sessionId, difficulty, match.user2.userData);
      }
    }

    // Helper function to broadcast queue counts
    function broadcastQueueCounts() {
      const counts = queueManager.getQueueCounts();
      io.emit('queueCounts', counts);
    }

    // Send initial queue counts
    broadcastQueueCounts();
  });

  // Periodic cleanup and updates
  setInterval(() => {
    // Cleanup stale queue entries
    if (queueManager && typeof queueManager.cleanupStaleEntries === 'function') {
      queueManager.cleanupStaleEntries();
    }
    
    // Broadcast updated queue counts
    if (queueManager && typeof queueManager.getQueueCounts === 'function') {
      const counts = queueManager.getQueueCounts();
      io.emit('queueCounts', counts);
    }
  }, 60000); // Every minute
}
