import express from 'express';

const router = express.Router();

// Get all questions (admin)
router.get('/questions', (req, res) => {
  try {
    // Import questions from the questions route handler
    // In a real app, this would be from a shared database
    const questions = req.app.locals.questions || [];
    
    res.json({
      success: true,
      questions,
      totalQuestions: questions.length
    });

  } catch (error) {
    console.error('Admin get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Add question (admin)
router.post('/questions', (req, res) => {
  try {
    const questionData = req.body;
    
    // Initialize questions array if not exists
    if (!req.app.locals.questions) {
      req.app.locals.questions = [];
    }
    
    // Generate ID if not provided
    if (!questionData.questionId) {
      questionData.questionId = `q${req.app.locals.questions.length + 1}`;
    }
    
    // Check if question ID already exists
    if (req.app.locals.questions.find(q => q.questionId === questionData.questionId)) {
      return res.status(400).json({ error: 'Question ID already exists' });
    }
    
    const newQuestion = {
      id: questionData.questionId,
      ...questionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    req.app.locals.questions.push(newQuestion);
    
    res.status(201).json({ success: true, question: newQuestion });

  } catch (error) {
    console.error('Admin add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Delete question (admin)
router.delete('/questions/:questionId', (req, res) => {
  try {
    const { questionId } = req.params;
    
    if (!req.app.locals.questions) {
      return res.status(404).json({ error: 'No questions found' });
    }
    
    const questionIndex = req.app.locals.questions.findIndex(q => q.questionId === questionId);
    
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const deletedQuestion = req.app.locals.questions.splice(questionIndex, 1)[0];
    
    res.json({ success: true, deletedQuestion });

  } catch (error) {
    console.error('Admin delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Get next question ID
router.get('/next-question-id', (req, res) => {
  try {
    const questions = req.app.locals.questions || [];
    const nextId = `q${questions.length + 1}`;
    
    res.json({ success: true, nextId });

  } catch (error) {
    console.error('Get next question ID error:', error);
    res.status(500).json({ error: 'Failed to get next question ID' });
  }
});

// Get queue statistics (admin)
router.get('/queue/stats', (req, res) => {
  try {
    const { queueManager } = req.app.locals;
    const stats = queueManager.getQueueStats();

    res.json({
      success: true,
      data: stats.byDifficulty
    });

  } catch (error) {
    console.error('Admin get queue stats error:', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

// Clear all queues (admin)
router.post('/clear-queues', (req, res) => {
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
      message: 'All queues cleared'
    });

  } catch (error) {
    console.error('Admin clear queues error:', error);
    res.status(500).json({ error: 'Failed to clear queues' });
  }
});

// Clear specific difficulty queue (admin)
router.post('/queue/clear/:difficulty', (req, res) => {
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
      message: `${difficulty} queue cleared`
    });

  } catch (error) {
    console.error('Admin clear difficulty queue error:', error);
    res.status(500).json({ error: 'Failed to clear difficulty queue' });
  }
});

// Get queue contents (admin)
router.get('/queue/contents/:difficulty', (req, res) => {
  try {
    const { difficulty } = req.params;
    const { queueManager } = req.app.locals;

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    const contents = queueManager.getQueueContents(difficulty);

    res.json({
      success: true,
      data: contents
    });

  } catch (error) {
    console.error('Admin get queue contents error:', error);
    res.status(500).json({ error: 'Failed to get queue contents' });
  }
});

// Get active rooms (admin)
router.get('/rooms', (req, res) => {
  try {
    const { roomManager } = req.app.locals;
    const activeRooms = roomManager.getActiveRooms();

    res.json({
      success: true,
      data: activeRooms
    });

  } catch (error) {
    console.error('Admin get rooms error:', error);
    res.status(500).json({ error: 'Failed to get active rooms' });
  }
});

// Terminate room (admin)
router.post('/rooms/:roomId/terminate', (req, res) => {
  try {
    const { roomId } = req.params;
    const { roomManager, sessionManager } = req.app.locals;

    const room = roomManager.terminateRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Update user states
    room.users.forEach(user => {
      sessionManager.setUserState(user.sessionId, 'na');
    });

    res.json({
      success: true,
      message: 'Room terminated',
      roomId
    });

  } catch (error) {
    console.error('Admin terminate room error:', error);
    res.status(500).json({ error: 'Failed to terminate room' });
  }
});

// Get test cases for a question (admin)
router.get('/testcases/:questionId', (req, res) => {
  try {
    const { questionId } = req.params;
    const questions = req.app.locals.questions || [];
    
    const question = questions.find(q => q.questionId === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      success: true,
      testCases: question.testCases || []
    });

  } catch (error) {
    console.error('Admin get test cases error:', error);
    res.status(500).json({ error: 'Failed to get test cases' });
  }
});

// Add test cases for a question (admin)
router.post('/testcases/:questionId', (req, res) => {
  try {
    const { questionId } = req.params;
    const { testCases } = req.body;
    
    if (!req.app.locals.questions) {
      req.app.locals.questions = [];
    }
    
    const questionIndex = req.app.locals.questions.findIndex(q => q.questionId === questionId);
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Question not found' });
    }

    req.app.locals.questions[questionIndex].testCases = testCases;
    req.app.locals.questions[questionIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Test cases updated'
    });

  } catch (error) {
    console.error('Admin add test cases error:', error);
    res.status(500).json({ error: 'Failed to add test cases' });
  }
});

// Get dashboard statistics (admin)
router.get('/stats/dashboard', (req, res) => {
  try {
    const { sessionManager, queueManager, roomManager } = req.app.locals;
    
    const questions = req.app.locals.questions || [];
    const activeUsers = sessionManager.getActiveUsers();
    const queueStats = queueManager.getQueueStats();
    const roomStats = roomManager.getRoomStats();

    const stats = {
      totalQuestions: questions.length,
      activeUsers: activeUsers.length,
      queueLength: queueStats.totalUsers,
      activeRooms: roomStats.active + roomStats.waiting,
      questionsToday: 0 // Can be implemented with proper date tracking
    };

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('Admin get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

export default router;
