export class QueueManager {
  constructor() {
    this.queues = {
      easy: [],
      medium: [],
      hard: []
    };
    this.userQueueMap = new Map(); // sessionId -> { difficulty, timestamp }
  }

  addToQueue(sessionId, difficulty, userData = {}) {
    if (!this.queues[difficulty]) {
      throw new Error(`Invalid difficulty: ${difficulty}`);
    }

    // Remove from any existing queue first
    this.removeFromAllQueues(sessionId);

    const queueEntry = {
      sessionId,
      userData,
      timestamp: Date.now(),
      difficulty
    };

    this.queues[difficulty].push(queueEntry);
    this.userQueueMap.set(sessionId, { difficulty, timestamp: queueEntry.timestamp });

    console.log(`User ${sessionId} added to ${difficulty} queue. Queue size: ${this.queues[difficulty].length}`);
    return queueEntry;
  }

  removeFromQueue(sessionId, difficulty) {
    if (!this.queues[difficulty]) return false;

    const index = this.queues[difficulty].findIndex(entry => entry.sessionId === sessionId);
    if (index !== -1) {
      this.queues[difficulty].splice(index, 1);
      this.userQueueMap.delete(sessionId);
      console.log(`User ${sessionId} removed from ${difficulty} queue`);
      return true;
    }
    return false;
  }

  removeFromAllQueues(sessionId) {
    let removed = false;
    for (const difficulty of Object.keys(this.queues)) {
      if (this.removeFromQueue(sessionId, difficulty)) {
        removed = true;
      }
    }
    return removed;
  }

  findMatch(difficulty) {
    const queue = this.queues[difficulty];
    if (queue.length >= 2) {
      // Simple FIFO matching - take first two users
      const user1 = queue.shift();
      const user2 = queue.shift();
      
      // Remove from user queue map
      this.userQueueMap.delete(user1.sessionId);
      this.userQueueMap.delete(user2.sessionId);

      console.log(`Match found for ${difficulty}: ${user1.sessionId} vs ${user2.sessionId}`);
      return { user1, user2 };
    }
    return null;
  }

  getQueuePosition(sessionId) {
    const queueInfo = this.userQueueMap.get(sessionId);
    if (!queueInfo) return null;

    const queue = this.queues[queueInfo.difficulty];
    const position = queue.findIndex(entry => entry.sessionId === sessionId);
    
    return position !== -1 ? {
      position: position + 1,
      difficulty: queueInfo.difficulty,
      waitTime: Date.now() - queueInfo.timestamp,
      queueSize: queue.length
    } : null;
  }

  getQueueCounts() {
    const counts = {};
    for (const [difficulty, queue] of Object.entries(this.queues)) {
      counts[difficulty] = {
        count: queue.length,
        averageWaitTime: this.calculateAverageWaitTime(difficulty),
        oldestWaitTime: this.getOldestWaitTime(difficulty)
      };
    }
    return counts;
  }

  calculateAverageWaitTime(difficulty) {
    const queue = this.queues[difficulty];
    if (queue.length === 0) return 0;

    const now = Date.now();
    const totalWaitTime = queue.reduce((sum, entry) => sum + (now - entry.timestamp), 0);
    return Math.round(totalWaitTime / queue.length);
  }

  getOldestWaitTime(difficulty) {
    const queue = this.queues[difficulty];
    if (queue.length === 0) return 0;

    const oldest = Math.min(...queue.map(entry => entry.timestamp));
    return Date.now() - oldest;
  }

  clearQueue(difficulty) {
    if (!this.queues[difficulty]) return false;

    const clearedUsers = this.queues[difficulty].map(entry => entry.sessionId);
    this.queues[difficulty] = [];
    
    // Remove from user queue map
    clearedUsers.forEach(sessionId => {
      this.userQueueMap.delete(sessionId);
    });

    console.log(`Cleared ${difficulty} queue. Removed ${clearedUsers.length} users`);
    return clearedUsers;
  }

  clearAllQueues() {
    const clearedUsers = [];
    for (const difficulty of Object.keys(this.queues)) {
      clearedUsers.push(...this.clearQueue(difficulty));
    }
    return clearedUsers;
  }

  getQueueContents(difficulty) {
    if (!this.queues[difficulty]) return [];
    return this.queues[difficulty].map(entry => ({
      sessionId: entry.sessionId,
      userData: entry.userData,
      waitTime: Date.now() - entry.timestamp,
      position: this.queues[difficulty].indexOf(entry) + 1
    }));
  }

  isUserInQueue(sessionId) {
    return this.userQueueMap.has(sessionId);
  }

  getQueueStats() {
    const stats = {
      totalUsers: 0,
      byDifficulty: {}
    };

    for (const [difficulty, queue] of Object.entries(this.queues)) {
      const count = queue.length;
      stats.totalUsers += count;
      stats.byDifficulty[difficulty] = {
        count,
        averageWaitTime: this.calculateAverageWaitTime(difficulty),
        oldestWaitTime: this.getOldestWaitTime(difficulty)
      };
    }

    return stats;
  }

  // Cleanup old queue entries (in case of stale data)
  cleanupStaleEntries(maxAge = 60 * 60 * 1000) { // 1 hour default
    const now = Date.now();
    let cleanedCount = 0;

    for (const [difficulty, queue] of Object.entries(this.queues)) {
      const originalLength = queue.length;
      this.queues[difficulty] = queue.filter(entry => {
        const isStale = (now - entry.timestamp) > maxAge;
        if (isStale) {
          this.userQueueMap.delete(entry.sessionId);
          cleanedCount++;
        }
        return !isStale;
      });
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} stale queue entries`);
    }
    return cleanedCount;
  }
}
