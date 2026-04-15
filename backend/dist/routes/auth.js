import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticateToken, rateLimitByUser } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
const router = Router();
// Validation rules
// Validation rules
// const loginValidation = ... (removed)
// const refreshTokenValidation = ... (removed)
const preferencesValidation = [
    body('preferences')
        .isObject()
        .withMessage('Preferences must be an object'),
    body('preferences.preferredDifficulty')
        .optional()
        .isIn(['Easy', 'Medium', 'Hard'])
        .withMessage('Preferred difficulty must be Easy, Medium, or Hard'),
    body('preferences.preferredLanguage')
        .optional()
        .isIn(['javascript', 'python', 'java', 'cpp'])
        .withMessage('Preferred language must be javascript, python, java, or cpp'),
];
// Public routes
// router.post('/login', loginValidation, validateRequest, AuthController.login); // Handled by Clerk
// router.post('/refresh-token', refreshTokenValidation, validateRequest, AuthController.refreshToken); // Handled by Clerk
// Protected routes
router.use(authenticateToken); // All routes below require authentication
// router.post('/logout', AuthController.logout); // Handled by Clerk
router.get('/profile', AuthController.getProfile);
router.get('/validate-session', AuthController.validateSession);
router.get('/stats', AuthController.getUserStats);
// Rate limited routes
router.put('/preferences', rateLimitByUser(10, 60 * 1000), // 10 requests per minute
preferencesValidation, validateRequest, AuthController.updatePreferences);
export default router;
