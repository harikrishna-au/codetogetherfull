
import express from 'express';
import { AppError, asyncHandler } from '../utils/errors.js';
import { supabase } from '../config/supabase.js';

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

// Get queue counts
router.get('/count', asyncHandler(async (req: any, res: any) => {
    // Count users in 'waiting' state
    const { count, error } = await supabase
        .from('user_states')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'waiting')
        .eq('is_active', true);

    if (error) throw error;
    res.json({ success: true, count: count || 0 });
}));

// Cancel queue for a user
router.post('/cancel', asyncHandler(async (req: any, res: any) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'UserId required' });
    }

    const { error } = await supabase
        .from('user_states')
        .update({ state: 'idle', queue_joined_at: null })
        .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true, message: 'Queue cancelled' });
}));

export default router;
