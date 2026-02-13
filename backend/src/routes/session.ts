import express from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/', (_req, res) => {
    res.json({ message: 'Session route' });
});
// Validate session/room
router.get('/validate', asyncHandler(async (req: any, res: any) => {
    const { roomId, userId } = req.query;

    if (!roomId || !userId) {
        return res.status(400).json({ success: false, error: 'Missing roomId or userId' });
    }

    const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();

    if (error || !room) {
        return res.status(404).json({ success: false, error: 'Room not found' });
    }

    if (room.status === 'ended') {
        return res.status(410).json({ success: false, error: 'Room ended' });
    }

    // Verify user is a participant
    if (room.participant1_id !== userId && room.participant2_id !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized for this room' });
    }

    res.json({ success: true, valid: true, room });
}));

// End a room / session
router.post('/end-room', asyncHandler(async (req: any, res: any) => {
    const { roomId } = req.body;
    const userId = req.user?.userId;

    if (!roomId || typeof roomId !== 'string') {
        throw new ValidationError('roomId is required');
    }

    // Mark room as ended
    const { error } = await supabase
        .from('rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('room_id', roomId);

    if (error) {
        logger.warn('Failed to update room status', { roomId, error });
    }

    // Reset participant states back to idle
    const { data: room } = await supabase
        .from('rooms')
        .select('participant1_id, participant2_id')
        .eq('room_id', roomId)
        .single();

    if (room) {
        const participants = [room.participant1_id, room.participant2_id].filter(Boolean);
        await supabase.from('user_states').update({
            state: 'idle',
            room_id: null,
            last_active: new Date().toISOString(),
        }).in('user_id', participants);
    }

    logger.info('Room ended', { roomId, endedBy: userId });
    res.json({ success: true, message: 'Session ended' });
}));

export default router;
