import express from 'express';

const router = express.Router();

// Get user state
router.get('/:sessionId/state', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionManager } = req.app.locals;

    const userState = sessionManager.getUserState(sessionId);
    
    if (!userState) {
      return res.status(404).json({ error: 'User session not found' });
    }

    res.json({
      success: true,
      userState
    });

  } catch (error) {
    console.error('Get user state error:', error);
    res.status(500).json({ error: 'Failed to get user state' });
  }
});

// Update user state
router.patch('/:sessionId/state', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state, ...additionalData } = req.body;
    const { sessionManager } = req.app.locals;

    if (!state) {
      return res.status(400).json({ error: 'state is required' });
    }

    const success = sessionManager.setUserState(sessionId, state, additionalData);
    
    if (!success) {
      return res.status(404).json({ error: 'User session not found' });
    }

    res.json({
      success: true,
      message: 'User state updated'
    });

  } catch (error) {
    console.error('Update user state error:', error);
    res.status(500).json({ error: 'Failed to update user state' });
  }
});

// Get all active users (admin)
router.get('/', (req, res) => {
  try {
    const { sessionManager } = req.app.locals;
    const activeUsers = sessionManager.getActiveUsers();

    res.json({
      success: true,
      activeUsers,
      count: activeUsers.length
    });

  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({ error: 'Failed to get active users' });
  }
});

// Reset all user states (admin)
router.post('/reset', (req, res) => {
  try {
    const { sessionManager, queueManager, roomManager } = req.app.locals;

    // Get all active users
    const activeUsers = sessionManager.getActiveUsers();
    let resetCount = 0;

    // Reset each user's state
    activeUsers.forEach(user => {
      // Remove from queues
      queueManager.removeFromAllQueues(user.sessionId);
      
      // Remove from rooms
      roomManager.removeUserFromRoom(user.sessionId);
      
      // Reset state to 'na'
      sessionManager.setUserState(user.sessionId, 'na');
      
      resetCount++;
    });

    res.json({
      success: true,
      resetCount,
      message: `Reset ${resetCount} user states`
    });

  } catch (error) {
    console.error('Reset users error:', error);
    res.status(500).json({ error: 'Failed to reset user states' });
  }
});

// Get user session info
router.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionManager } = req.app.locals;

    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Return safe session info (no sensitive data)
    res.json({
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        state: session.state,
        roomId: session.roomId,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }
    });

  } catch (error) {
    console.error('Get user session error:', error);
    res.status(500).json({ error: 'Failed to get user session' });
  }
});

// Update user heartbeat
router.post('/:sessionId/heartbeat', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionManager } = req.app.locals;

    const success = sessionManager.updateHeartbeat(sessionId);
    
    if (!success) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      message: 'Heartbeat updated'
    });

  } catch (error) {
    console.error('Update heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

// Mark user as inactive
router.post('/:sessionId/inactive', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionManager, queueManager, roomManager } = req.app.locals;

    // Remove from queues
    queueManager.removeFromAllQueues(sessionId);
    
    // Remove from room
    roomManager.removeUserFromRoom(sessionId);
    
    // Mark as inactive
    sessionManager.markUserInactive(sessionId);

    res.json({
      success: true,
      message: 'User marked as inactive'
    });

  } catch (error) {
    console.error('Mark user inactive error:', error);
    res.status(500).json({ error: 'Failed to mark user as inactive' });
  }
});

export default router;
