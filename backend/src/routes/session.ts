import { Router } from 'express';
import { Response } from 'express';
import { authenticateToken } from '@/middleware/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '@/middleware/validation.js';
import { asyncHandler, ValidationError } from '@/utils/errors.js';
import { logger } from '@/utils/logger.js';
import type { AuthenticatedRequest } from '@/types/index.js';

const router = Router();

// Validation rules
const endRoomValidation = [
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isString()
    .withMessage('Room ID must be a string'),
];

// All routes require authentication
router.use(authenticateToken);

// End room/session
const endRoom = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
    throw new ValidationError('Valid room ID is required');
  }

  // For now, just log the room end request
  // This will be fully implemented when we add the Room model and matchmaking service
  logger.info('Room end requested', {
    userId,
    roomId,
  });

  res.json({
    success: true,
    message: 'Room ended successfully',
    data: {
      roomId,
      endedAt: new Date().toISOString(),
    },
  });
});

// Validate session (already handled by auth middleware)
const validateSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const dbUser = req.dbUser;

  res.json({
    success: true,
    message: 'Session is valid',
    data: {
      user: {
        userId: user?.userId,
        email: user?.email,
        displayName: user?.displayName,
      },
      isActive: dbUser?.isActive || false,
      lastLogin: dbUser?.lastLogin,
    },
  });
});

// Routes
router.post('/end-room', endRoomValidation, validateRequest, endRoom);
router.get('/validate', validateSession);

export default router;