import { Router } from 'express';
import sessionRoutes from './session/sessionRoutes';
import usersRoutes from './users/usersRoutes';

const router = Router();

// Session routes
router.use('/session', sessionRoutes);

// User-related routes (direct under /api)
router.use('/', usersRoutes);

export default router;
