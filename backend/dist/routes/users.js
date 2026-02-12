import { Router } from 'express';
import { UserController } from '@/controllers/UserController.js';
import { authenticateToken, rateLimitByUser } from '@/middleware/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '@/middleware/validation.js';
const router = Router();
const updateStateValidation = [
    body('state')
        .notEmpty()
        .withMessage('State is required')
        .isIn(['idle', 'waiting', 'matched', 'in-session'])
        .withMessage('State must be idle, waiting, matched, or in-session'),
    body('roomId')
        .optional()
        .isString()
        .withMessage('Room ID must be a string'),
    body('mode')
        .optional()
        .isIn(['friendly', 'challenge'])
        .withMessage('Mode must be friendly or challenge'),
    body('difficulty')
        .optional()
        .isIn(['Easy', 'Medium', 'Hard'])
        .withMessage('Difficulty must be Easy, Medium, or Hard'),
];
router.use(authenticateToken);
router.post('/heartbeat', rateLimitByUser(60, 60 * 1000), UserController.heartbeat);
router.post('/inactive', UserController.markInactive);
router.get('/state', UserController.getUserState);
router.put('/state', updateStateValidation, validateRequest, UserController.updateUserState);
router.get('/active', UserController.getActiveUsers);
router.get('/queue-stats', UserController.getQueueStats);
router.post('/cleanup-inactive', UserController.cleanupInactiveUsers);
export default router;
//# sourceMappingURL=users.js.map