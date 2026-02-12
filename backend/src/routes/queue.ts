
import express from 'express';
import { AppError, asyncHandler } from '../utils/errors.js';

const router = express.Router();

// Get stats
router.get('/stats', asyncHandler(async (req: any, res: any) => {
    // Placeholder stats
    res.json({
        success: true,
        data: {
            easy: { count: 0, averageWaitTime: 0, oldestWaitTime: 0 },
            medium: { count: 0, averageWaitTime: 0, oldestWaitTime: 0 },
            hard: { count: 0, averageWaitTime: 0, oldestWaitTime: 0 },
        }
    });
}));

// Clear all
router.post('/clear', asyncHandler(async (req: any, res: any) => {
    // Logic to clear queues (e.g. clear Redis or DB table)
    res.json({ success: true, message: 'All queues cleared' });
}));

// Clear difficulty
router.post('/clear/:difficulty', asyncHandler(async (req: any, res: any) => {
    const { difficulty } = req.params;
    res.json({ success: true, message: `Queue ${difficulty} cleared` });
}));

// Get contents
router.get('/contents/:difficulty', asyncHandler(async (req: any, res: any) => {
    const { difficulty } = req.params;
    res.json({ success: true, data: [] });
}));

export default router;
