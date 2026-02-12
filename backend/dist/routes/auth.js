import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController.js';
import { authenticateToken, rateLimitByUser } from '@/middleware/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '@/middleware/validation.js';
const router = Router();
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
router.use(authenticateToken);
router.get('/profile', AuthController.getProfile);
router.get('/validate-session', AuthController.validateSession);
router.get('/stats', AuthController.getUserStats);
router.put('/preferences', rateLimitByUser(10, 60 * 1000), preferencesValidation, validateRequest, AuthController.updatePreferences);
export default router;
//# sourceMappingURL=auth.js.map