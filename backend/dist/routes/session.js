import express from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
router.get('/', (_req, res) => {
    res.json({ message: 'Session route' });
});
// Validate session/room
router.get('/validate', asyncHandler(async (req, res) => {
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
router.post('/end-room', authenticateToken, asyncHandler(async (req, res) => {
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
// Get session results for a room
router.get('/results/:roomId', authenticateToken, asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user?.userId;
    if (!roomId) {
        throw new ValidationError('roomId is required');
    }
    // Fetch room details
    const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select('participant1_id, participant2_id, question_id, mode, difficulty, created_at, ended_at')
        .eq('room_id', roomId)
        .single();
    if (roomErr || !room) {
        throw new ValidationError('Room not found');
    }
    // Verify user is a participant
    if (room.participant1_id !== userId && room.participant2_id !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized for this room' });
    }
    // Fetch question details
    const { data: question } = await supabase
        .from('questions')
        .select('id, title, difficulty, tags')
        .eq('id', room.question_id)
        .single();
    // Fetch session history for both participants
    const { data: sessionHistory } = await supabase
        .from('session_history')
        .select('*')
        .eq('room_id', roomId)
        .order('completed_at', { ascending: false });
    // Organize results by user
    const user1Results = sessionHistory?.find(s => s.user_id === room.participant1_id);
    const user2Results = sessionHistory?.find(s => s.user_id === room.participant2_id);
    // Calculate session duration
    const duration = room.ended_at && room.created_at
        ? Math.round((new Date(room.ended_at).getTime() - new Date(room.created_at).getTime()) / 1000)
        : null;
    res.json({
        success: true,
        results: {
            roomId,
            mode: room.mode,
            difficulty: room.difficulty,
            duration,
            question: question ? {
                id: question.id,
                title: question.title,
                difficulty: question.difficulty,
                tags: question.tags
            } : null,
            participant1: {
                userId: room.participant1_id,
                testCasesPassed: user1Results?.test_cases_passed || 0,
                totalTestCases: user1Results?.total_test_cases || 0,
                runtime: user1Results?.runtime_ms || 0,
                language: user1Results?.language || 'javascript',
                finalCode: user1Results?.final_code || '',
                endReason: user1Results?.end_reason || 'unknown'
            },
            participant2: {
                userId: room.participant2_id,
                testCasesPassed: user2Results?.test_cases_passed || 0,
                totalTestCases: user2Results?.total_test_cases || 0,
                runtime: user2Results?.runtime_ms || 0,
                language: user2Results?.language || 'javascript',
                finalCode: user2Results?.final_code || '',
                endReason: user2Results?.end_reason || 'unknown'
            }
        }
    });
}));
// Save session results
router.post('/save-results', authenticateToken, asyncHandler(async (req, res) => {
    const { roomId, testCasesPassed, totalTestCases, runtime, language, finalCode, endReason } = req.body;
    const userId = req.user?.userId;
    if (!roomId || !userId) {
        throw new ValidationError('roomId and userId are required');
    }
    // Fetch room details to get partner and question info
    const { data: room } = await supabase
        .from('rooms')
        .select('participant1_id, participant2_id, question_id, mode, difficulty, created_at')
        .eq('room_id', roomId)
        .single();
    if (!room) {
        throw new ValidationError('Room not found');
    }
    const partnerId = room.participant1_id === userId ? room.participant2_id : room.participant1_id;
    const durationSeconds = room.created_at
        ? Math.round((Date.now() - new Date(room.created_at).getTime()) / 1000)
        : null;
    // Insert or update session history
    const { error } = await supabase.from('session_history').upsert({
        user_id: userId,
        room_id: roomId,
        question_id: room.question_id,
        partner_id: partnerId,
        duration: durationSeconds,
        test_cases_passed: testCasesPassed || 0,
        total_test_cases: totalTestCases || 0,
        runtime_ms: runtime || 0,
        language: language || 'javascript',
        final_code: finalCode || '',
        mode: room.mode,
        difficulty: room.difficulty,
        end_reason: endReason || 'user-exit',
        completed_at: new Date().toISOString()
    }, {
        onConflict: 'user_id,room_id',
        ignoreDuplicates: false
    });
    if (error) {
        logger.error('Failed to save session results', { error, userId, roomId });
        throw new Error('Failed to save session results');
    }
    logger.info('Session results saved', { userId, roomId, endReason });
    res.json({ success: true, message: 'Results saved' });
}));
export default router;
