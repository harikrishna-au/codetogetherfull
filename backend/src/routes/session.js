import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Login endpoint - create or get session
router.post('/login', async (req, res) => {
  try {
    const { userId, userData, idToken } = req.body;
    const { sessionManager } = req.app.locals;

    if (!sessionManager) {
      console.error('SessionManager not available');
      return res.status(500).json({ error: 'Session service unavailable' });
    }

    let finalUserId = userId;
    let finalUserData = userData;

    // Handle Firebase authentication
    if (idToken) {
      try {
        // For now, we'll extract user info from the token payload (in production, verify with Firebase Admin SDK)
        const tokenParts = idToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          finalUserId = payload.user_id || payload.sub || payload.uid;
          finalUserData = {
            name: payload.name || payload.email?.split('@')[0] || 'Anonymous User',
            email: payload.email,
            avatar: payload.picture
          };
        } else {
          // If token format is invalid, create anonymous user with timestamp
          finalUserId = 'firebase-user-' + Date.now();
          finalUserData = { name: 'Firebase User' };
        }
      } catch (tokenError) {
        console.error('Token parsing error:', tokenError);
        // Fallback to a default user if token parsing fails
        finalUserId = 'firebase-user-' + Date.now();
        finalUserData = { name: 'Firebase User' };
      }
    }

    if (!finalUserId) {
      return res.status(400).json({ error: 'userId or valid idToken is required' });
    }

    // Check if user already has an active session
    let session = await sessionManager.getSessionByUserId(finalUserId);
    
    if (!session || !session.isActive) {
      // Create new session
      session = await sessionManager.createSession(finalUserId, finalUserData);
    } else {
      // Update existing session
      session = await sessionManager.updateSession(session.sessionId, { userData: finalUserData });
    }

    if (!session) {
      console.error('Failed to create or retrieve session');
      return res.status(500).json({ error: 'Failed to create session' });
    }

    // Generate JWT token for authentication
    const token = jwt.sign(
      { sessionId: session.sessionId, userId: session.userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      sessionId: session.sessionId,
      token,
      user: {
        id: session.userId,
        ...session.userData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const { sessionManager, queueManager, roomManager } = req.app.locals;

    if (sessionId) {
      // Remove from queues
      queueManager.removeFromAllQueues(sessionId);
      
      // Remove from room
      await roomManager.removeUserFromRoom(sessionId);
      
      // Destroy session
      await sessionManager.destroySession(sessionId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get session info
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionManager } = req.app.locals;

    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session: {
        id: session.sessionId,
        userId: session.userId,
        state: session.state,
        roomId: session.roomId,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Update session state
router.patch('/:sessionId/state', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state, ...additionalData } = req.body;
    const { sessionManager } = req.app.locals;

    const success = await sessionManager.setUserState(sessionId, state, additionalData);
    if (!success) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update state error:', error);
    res.status(500).json({ error: 'Failed to update state' });
  }
});

// End room endpoint
router.post('/end-room', async (req, res) => {
  try {
    const { sessionId, roomId } = req.body;
    const { roomManager, sessionManager } = req.app.locals;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Get room by user if roomId not provided
    const room = roomId ? await roomManager.getRoom(roomId) : await roomManager.getRoomByUser(sessionId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // End the room
    await roomManager.endRoom(room.roomId, 'user_ended');

    // Update user states
    for (const user of room.users) {
      await sessionManager.setUserState(user.sessionId, 'na');
    }

    res.json({ success: true, roomId: room.roomId });
  } catch (error) {
    console.error('End room error:', error);
    res.status(500).json({ error: 'Failed to end room' });
  }
});

// Cancel matchmaking
router.post('/cancel-queue', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const { queueManager, sessionManager } = req.app.locals;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const removed = queueManager.removeFromAllQueues(sessionId);
    if (removed) {
      await sessionManager.setUserState(sessionId, 'na');
    }

    res.json({ success: true, removed });
  } catch (error) {
    console.error('Cancel queue error:', error);
    res.status(500).json({ error: 'Failed to cancel queue' });
  }
});

export default router;
