import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Users route' });
});

// Heartbeat
router.post('/heartbeat', asyncHandler(async (req: any, res: any) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'UserId required' });
    }

    const { error } = await supabase
        .from('user_states')
        .update({ last_active: new Date().toISOString(), is_active: true })
        .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
}));

// Get user state
router.get('/:userId/state', asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'UserId required' });
    }

    const { data: state, error } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

    res.json({ success: true, state: state || null });
}));

// Inactive
router.post('/inactive', asyncHandler(async (req: any, res: any) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'UserId required' });
    }

    const { error } = await supabase
        .from('user_states')
        .update({ is_active: false })
        .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
}));

router.post('/reset', (req: Request, res: Response) => {
    res.json({ message: 'Users reset' });
});

export default router;
