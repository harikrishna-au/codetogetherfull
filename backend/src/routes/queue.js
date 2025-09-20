import express from 'express';

const router = express.Router();

// Join matchmaking queue
router.post('/join', (req, res) => {
  try {
    const { sessionId, difficulty, mode, userData } = req.body;
    const { queueManager, sessionManager } = req.app.locals;

    if (!sessionId || !difficulty) {
      return res.status(400).json({ error: 'sessionId and difficulty are required' });
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    // Add to queue
    const queueEntry = queueManager.addToQueue(sessionId, difficulty, { 
      ...userData, 
      mode 
    });

    // Update session state
    sessionManager.setUserState(sessionId, 'waiting', { difficulty, mode });

    // Get queue position
    const position = queueManager.getQueuePosition(sessionId);

    res.json({
      success: true,
      queueEntry,
      position,
      message: `Added to ${difficulty} queue`
    });

  } catch (error) {
    console.error('Join queue error:', error);
    res.status(500).json({ error: 'Failed to join queue' });
  }
});

// Leave queue
router.post('/leave', (req, res) => {
  try {
    const { sessionId } = req.body;
    const { queueManager, sessionManager } = req.app.locals;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const removed = queueManager.removeFromAllQueues(sessionId);
    
    if (removed) {
      sessionManager.setUserState(sessionId, 'na');
    }

    res.json({
      success: true,
      removed,
      message: removed ? 'Removed from queue' : 'Not in any queue'
    });

  } catch (error) {
    console.error('Leave queue error:', error);
    res.status(500).json({ error: 'Failed to leave queue' });
  }
});

// Get queue position for a user
router.get('/position/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { queueManager } = req.app.locals;

    const position = queueManager.getQueuePosition(sessionId);

    if (!position) {
      return res.status(404).json({ error: 'User not in any queue' });
    }

    res.json({
      success: true,
      position
    });

  } catch (error) {
    console.error('Get queue position error:', error);
    res.status(500).json({ error: 'Failed to get queue position' });
  }
});

// Get queue statistics
router.get('/stats', (req, res) => {
  try {
    const { queueManager } = req.app.locals;
    const stats = queueManager.getQueueStats();

    res.json({
      success: true,
      data: stats.byDifficulty,
      totalUsers: stats.totalUsers
    });

  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

// Get queue contents for a specific difficulty (admin)
router.get('/contents/:difficulty', (req, res) => {
  try {
    const { difficulty } = req.params;
    const { queueManager } = req.app.locals;

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    const contents = queueManager.getQueueContents(difficulty);

    res.json({
      success: true,
      data: contents,
      difficulty,
      count: contents.length
    });

  } catch (error) {
    console.error('Get queue contents error:', error);
    res.status(500).json({ error: 'Failed to get queue contents' });
  }
});

// Clear specific difficulty queue (admin)
router.post('/clear/:difficulty', (req, res) => {
  try {
    const { difficulty } = req.params;
    const { queueManager, sessionManager } = req.app.locals;

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    const clearedUsers = queueManager.clearQueue(difficulty);

    // Update session states for cleared users
    clearedUsers.forEach(sessionId => {
      sessionManager.setUserState(sessionId, 'na');
    });

    res.json({
      success: true,
      clearedUsers,
      count: clearedUsers.length,
      message: `Cleared ${difficulty} queue`
    });

  } catch (error) {
    console.error('Clear queue error:', error);
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

// Clear all queues (admin)
router.post('/clear-all', (req, res) => {
  try {
    const { queueManager, sessionManager } = req.app.locals;

    const clearedUsers = queueManager.clearAllQueues();

    // Update session states for all cleared users
    clearedUsers.forEach(sessionId => {
      sessionManager.setUserState(sessionId, 'na');
    });

    res.json({
      success: true,
      clearedUsers,
      count: clearedUsers.length,
      message: 'Cleared all queues'
    });

  } catch (error) {
    console.error('Clear all queues error:', error);
    res.status(500).json({ error: 'Failed to clear all queues' });
  }
});

export default router;
