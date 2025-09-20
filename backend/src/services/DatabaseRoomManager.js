import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';

export class DatabaseRoomManager {
  constructor() {
    // Cleanup inactive rooms every 10 minutes
    setInterval(() => this.cleanupInactiveRooms(), 10 * 60 * 1000);
  }

  async createRoom(user1SessionId, user2SessionId, difficulty, questionData = null) {
    try {
      const roomId = uuidv4();
      const room = new Room({
        roomId,
        users: [
          { sessionId: user1SessionId, ready: false, lastActivity: Date.now() },
          { sessionId: user2SessionId, ready: false, lastActivity: Date.now() }
        ],
        difficulty,
        question: questionData,
        status: 'waiting',
        code: '',
        language: 'javascript',
        chatHistory: [],
        testResults: null
      });

      await room.save();
      console.log(`Room created: ${roomId} for users: ${user1SessionId}, ${user2SessionId}`);
      return room.toObject();
    } catch (error) {
      console.error('Create room error:', error);
      throw error;
    }
  }

  async getRoom(roomId) {
    try {
      const room = await Room.findOne({ roomId });
      return room ? room.toObject() : null;
    } catch (error) {
      console.error('Get room error:', error);
      return null;
    }
  }

  async getRoomByUser(sessionId) {
    try {
      const room = await Room.findOne({ 
        'users.sessionId': sessionId,
        status: { $in: ['waiting', 'active'] }
      });
      return room ? room.toObject() : null;
    } catch (error) {
      console.error('Get room by user error:', error);
      return null;
    }
  }

  async updateUserActivity(sessionId) {
    try {
      await Room.updateOne(
        { 'users.sessionId': sessionId },
        { 
          $set: { 'users.$.lastActivity': Date.now() },
          updatedAt: new Date()
        }
      );
    } catch (error) {
      console.error('Update user activity error:', error);
    }
  }

  async setUserReady(sessionId, ready = true) {
    try {
      const room = await Room.findOneAndUpdate(
        { 'users.sessionId': sessionId },
        { 
          $set: { 
            'users.$.ready': ready,
            'users.$.lastActivity': Date.now()
          },
          updatedAt: new Date()
        },
        { new: true }
      );

      if (room) {
        // Check if all users are ready
        if (room.users.every(u => u.ready) && room.status === 'waiting') {
          room.status = 'active';
          await room.save();
          console.log(`Room ${room.roomId} is now active - all users ready`);
        }
        return room.toObject();
      }
      return null;
    } catch (error) {
      console.error('Set user ready error:', error);
      return null;
    }
  }

  async updateCode(roomId, code, sessionId) {
    try {
      const room = await Room.findOneAndUpdate(
        { roomId },
        { 
          code,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (room) {
        await this.updateUserActivity(sessionId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update code error:', error);
      return false;
    }
  }

  async updateLanguage(roomId, language, sessionId) {
    try {
      const room = await Room.findOneAndUpdate(
        { roomId },
        { 
          language,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (room) {
        await this.updateUserActivity(sessionId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update language error:', error);
      return false;
    }
  }

  async addChatMessage(roomId, message, sender, sessionId) {
    try {
      const room = await Room.findOne({ roomId });
      if (room) {
        const chatMessage = {
          id: room.chatHistory.length + 1,
          message,
          sender,
          sessionId,
          timestamp: new Date()
        };

        room.chatHistory.push(chatMessage);
        room.updatedAt = new Date();
        await room.save();

        await this.updateUserActivity(sessionId);
        return chatMessage;
      }
      return null;
    } catch (error) {
      console.error('Add chat message error:', error);
      return null;
    }
  }

  async getChatHistory(roomId) {
    try {
      const room = await Room.findOne({ roomId });
      return room ? room.chatHistory : [];
    } catch (error) {
      console.error('Get chat history error:', error);
      return [];
    }
  }

  async updateTestResults(roomId, results, sessionId) {
    try {
      const room = await Room.findOneAndUpdate(
        { roomId },
        { 
          testResults: {
            results,
            timestamp: new Date(),
            submittedBy: sessionId
          },
          updatedAt: new Date()
        },
        { new: true }
      );

      if (room) {
        await this.updateUserActivity(sessionId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update test results error:', error);
      return false;
    }
  }

  async endRoom(roomId, reason = 'completed') {
    try {
      const room = await Room.findOneAndUpdate(
        { roomId },
        { 
          status: 'completed',
          endedAt: new Date(),
          endReason: reason,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (room) {
        console.log(`Room ${roomId} ended: ${reason}`);
        return room.toObject();
      }
      return null;
    } catch (error) {
      console.error('End room error:', error);
      return null;
    }
  }

  async terminateRoom(roomId) {
    try {
      const room = await Room.findOneAndUpdate(
        { roomId },
        { 
          status: 'terminated',
          endedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (room) {
        console.log(`Room ${roomId} terminated`);
        return room.toObject();
      }
      return null;
    } catch (error) {
      console.error('Terminate room error:', error);
      return null;
    }
  }

  async removeUserFromRoom(sessionId) {
    try {
      const room = await Room.findOne({ 'users.sessionId': sessionId });
      if (room) {
        // Remove user from room
        room.users = room.users.filter(u => u.sessionId !== sessionId);
        
        // If room becomes empty or has only one user, terminate it
        if (room.users.length <= 1) {
          room.status = 'terminated';
          room.endedAt = new Date();
        }
        
        room.updatedAt = new Date();
        await room.save();
        
        console.log(`User ${sessionId} removed from room ${room.roomId}`);
        return room.toObject();
      }
      return null;
    } catch (error) {
      console.error('Remove user from room error:', error);
      return null;
    }
  }

  async getActiveRooms() {
    try {
      const rooms = await Room.find({ 
        status: { $in: ['active', 'waiting'] }
      }).lean();

      return rooms.map(room => ({
        id: room.roomId,
        userCount: room.users.length,
        difficulty: room.difficulty,
        status: room.status,
        createdAt: room.createdAt,
        question: room.question ? room.question.title : 'No question assigned'
      }));
    } catch (error) {
      console.error('Get active rooms error:', error);
      return [];
    }
  }

  async getRoomStats() {
    try {
      const stats = await Room.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        active: 0,
        waiting: 0,
        completed: 0,
        terminated: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      return result;
    } catch (error) {
      console.error('Get room stats error:', error);
      return { total: 0, active: 0, waiting: 0, completed: 0, terminated: 0 };
    }
  }

  async cleanupInactiveRooms() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const result = await Room.updateMany(
        {
          $or: [
            { createdAt: { $lt: oneHourAgo } },
            { 'users.lastActivity': { $lt: oneHourAgo } }
          ],
          status: { $in: ['waiting', 'active'] }
        },
        {
          status: 'terminated',
          endedAt: new Date(),
          updatedAt: new Date()
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Cleaned up ${result.modifiedCount} inactive rooms`);
      }
    } catch (error) {
      console.error('Cleanup inactive rooms error:', error);
    }
  }

  async isUserInRoom(sessionId) {
    try {
      const room = await Room.findOne({ 
        'users.sessionId': sessionId,
        status: { $in: ['waiting', 'active'] }
      });
      return !!room;
    } catch (error) {
      console.error('Is user in room error:', error);
      return false;
    }
  }

  async getRoomUsers(roomId) {
    try {
      const room = await Room.findOne({ roomId });
      return room ? room.users : [];
    } catch (error) {
      console.error('Get room users error:', error);
      return [];
    }
  }

  async updateQuestion(roomId, questionData) {
    try {
      const room = await Room.findOneAndUpdate(
        { roomId },
        { 
          question: questionData,
          updatedAt: new Date()
        },
        { new: true }
      );
      return !!room;
    } catch (error) {
      console.error('Update question error:', error);
      return false;
    }
  }
}
