import { Router } from 'express';
import { usersController } from '../../../controllers/api/users/usersController';

const router = Router();

// POST /api/heartbeat
router.post('/heartbeat', usersController.heartbeat);

// POST /api/user-inactive
router.post('/user-inactive', usersController.userInactive);

// GET /api/active-users
router.get('/active-users', usersController.getActiveUsers);

// POST /api/validate-session
router.post('/validate-session', async (req, res) => {
  // This could be in session controller, but keeping here for compatibility
  const { sessionController } = await import('../../../controllers/api/session/sessionController');
  return sessionController.validateSession(req, res);
});

// PUT /api/users/:userId
router.put('/users/:userId', usersController.updateUserDetails);

// GET /api/users/:userId  
router.get('/users/:userId', usersController.getUserProfile);

export default router;
