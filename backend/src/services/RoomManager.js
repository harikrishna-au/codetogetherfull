import { v4 as uuidv4 } from 'uuid';

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> room data
    this.userRooms = new Map(); // sessionId -> roomId
    
    // Cleanup inactive rooms every 10 minutes
    setInterval(() => this.cleanupInactiveRooms(), 10 * 60 * 1000);
  }

  createRoom(user1SessionId, user2SessionId, difficulty, questionData = null) {
    const roomId = uuidv4();
    const room = {
      id: roomId,
      users: [
        { sessionId: user1SessionId, ready: false, lastActivity: Date.now() },
        { sessionId: user2SessionId, ready: false, lastActivity: Date.now() }
      ],
      difficulty,
      question: questionData,
      createdAt: Date.now(),
      status: 'waiting', // waiting, active, completed, terminated
      code: '',
      language: 'javascript',
      chatHistory: [],
      testResults: null,
      endedAt: null
    };

    this.rooms.set(roomId, room);
    this.userRooms.set(user1SessionId, roomId);
    this.userRooms.set(user2SessionId, roomId);

    console.log(`Room created: ${roomId} for users: ${user1SessionId}, ${user2SessionId}`);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getRoomByUser(sessionId) {
    const roomId = this.userRooms.get(sessionId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  updateUserActivity(sessionId) {
    const roomId = this.userRooms.get(sessionId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        const user = room.users.find(u => u.sessionId === sessionId);
        if (user) {
          user.lastActivity = Date.now();
        }
      }
    }
  }

  setUserReady(sessionId, ready = true) {
    const roomId = this.userRooms.get(sessionId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        const user = room.users.find(u => u.sessionId === sessionId);
        if (user) {
          user.ready = ready;
          user.lastActivity = Date.now();
          
          // Check if all users are ready
          if (room.users.every(u => u.ready) && room.status === 'waiting') {
            room.status = 'active';
            console.log(`Room ${roomId} is now active - all users ready`);
          }
          
          return room;
        }
      }
    }
    return null;
  }

  updateCode(roomId, code, sessionId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.code = code;
      this.updateUserActivity(sessionId);
      return true;
    }
    return false;
  }

  updateLanguage(roomId, language, sessionId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.language = language;
      this.updateUserActivity(sessionId);
      return true;
    }
    return false;
  }

  addChatMessage(roomId, message, sender, sessionId) {
    const room = this.rooms.get(roomId);
    if (room) {
      const chatMessage = {
        id: room.chatHistory.length + 1,
        message,
        sender,
        sessionId,
        timestamp: Date.now()
      };
      room.chatHistory.push(chatMessage);
      this.updateUserActivity(sessionId);
      return chatMessage;
    }
    return null;
  }

  getChatHistory(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.chatHistory : [];
  }

  updateTestResults(roomId, results, sessionId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.testResults = {
        results,
        timestamp: Date.now(),
        submittedBy: sessionId
      };
      this.updateUserActivity(sessionId);
      return true;
    }
    return false;
  }

  endRoom(roomId, reason = 'completed') {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = 'completed';
      room.endedAt = Date.now();
      room.endReason = reason;
      
      // Remove users from room mapping
      room.users.forEach(user => {
        this.userRooms.delete(user.sessionId);
      });
      
      console.log(`Room ${roomId} ended: ${reason}`);
      return room;
    }
    return null;
  }

  terminateRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = 'terminated';
      room.endedAt = Date.now();
      
      // Remove users from room mapping
      room.users.forEach(user => {
        this.userRooms.delete(user.sessionId);
      });
      
      // Remove room from memory after some time
      setTimeout(() => {
        this.rooms.delete(roomId);
        console.log(`Room ${roomId} removed from memory`);
      }, 5 * 60 * 1000); // 5 minutes
      
      console.log(`Room ${roomId} terminated`);
      return room;
    }
    return null;
  }

  removeUserFromRoom(sessionId) {
    const roomId = this.userRooms.get(sessionId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        // Remove user from room
        room.users = room.users.filter(u => u.sessionId !== sessionId);
        this.userRooms.delete(sessionId);
        
        // If room becomes empty or has only one user, terminate it
        if (room.users.length <= 1) {
          this.terminateRoom(roomId);
        }
        
        console.log(`User ${sessionId} removed from room ${roomId}`);
        return room;
      }
    }
    return null;
  }

  getActiveRooms() {
    const activeRooms = [];
    for (const [roomId, room] of this.rooms) {
      if (room.status === 'active' || room.status === 'waiting') {
        activeRooms.push({
          id: roomId,
          userCount: room.users.length,
          difficulty: room.difficulty,
          status: room.status,
          createdAt: room.createdAt,
          question: room.question ? room.question.title : 'No question assigned'
        });
      }
    }
    return activeRooms;
  }

  getRoomStats() {
    const stats = {
      total: this.rooms.size,
      active: 0,
      waiting: 0,
      completed: 0,
      terminated: 0
    };

    for (const room of this.rooms.values()) {
      stats[room.status] = (stats[room.status] || 0) + 1;
    }

    return stats;
  }

  cleanupInactiveRooms() {
    const now = Date.now();
    const inactiveThreshold = 60 * 60 * 1000; // 1 hour
    let cleanedCount = 0;

    for (const [roomId, room] of this.rooms) {
      // Check if room is old and inactive
      const roomAge = now - room.createdAt;
      const lastActivity = Math.max(...room.users.map(u => u.lastActivity));
      const timeSinceActivity = now - lastActivity;

      if (roomAge > inactiveThreshold || timeSinceActivity > inactiveThreshold) {
        if (room.status !== 'completed' && room.status !== 'terminated') {
          this.terminateRoom(roomId);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} inactive rooms`);
    }
  }

  isUserInRoom(sessionId) {
    return this.userRooms.has(sessionId);
  }

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.users : [];
  }

  updateQuestion(roomId, questionData) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.question = questionData;
      return true;
    }
    return false;
  }
}
