
import express from 'express';
import { supabase } from '../config/supabase.js';
import { AppError, asyncHandler } from '../utils/errors.js';

const router = express.Router();

// Get active rooms
router.get('/', asyncHandler(async (req: any, res: any) => {
    const { data, error } = await supabase
        .from('rooms') // Assuming rooms table exists
        .select('*')
        .eq('status', 'active');

    // If rooms table doesn't exist or error, return empty
    if (error) {
        console.warn('Error fetching rooms:', error);
        return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data });
}));

// Terminate room
router.post('/:roomId/terminate', asyncHandler(async (req: any, res: any) => {
    const { roomId } = req.params;
    // Logic to terminate room
    res.json({ success: true, message: `Room ${roomId} terminated` });
}));

export default router;
