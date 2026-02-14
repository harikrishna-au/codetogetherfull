
import express from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../utils/errors.js';
import { getSocketService } from '../server.js';

const router = express.Router();

// Get active rooms
router.get('/', asyncHandler(async (_req: any, res: any) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('room_id, participant1_id, participant2_id, question_id, difficulty, mode, status, created_at')
    .eq('status', 'active');

  if (error) {
    console.warn('Error fetching rooms:', error);
    return res.json({ success: true, data: [] });
  }

  res.json({ success: true, data: data || [] });
}));

// Terminate a single room
router.post('/:roomId/terminate', asyncHandler(async (req: any, res: any) => {
  const { roomId } = req.params;

  // Mark room as closed in DB
  const { data: room, error: fetchErr } = await supabase
    .from('rooms')
    .select('participant1_id, participant2_id')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !room) {
    return res.status(404).json({ success: false, error: 'Room not found' });
  }

  const { error } = await supabase
    .from('rooms')
    .update({ status: 'closed' })
    .eq('room_id', roomId);

  if (error) throw error;

  // Reset participant user states
  const participants = [room.participant1_id, room.participant2_id].filter(Boolean);
  if (participants.length > 0) {
    await supabase
      .from('user_states')
      .update({ state: 'idle', room_id: null, is_active: false })
      .in('user_id', participants);
  }

  // Notify connected participants via socket
  getSocketService()?.notifyRoom(roomId, 'roomClosed', { roomId, reason: 'admin_terminated' });

  res.json({ success: true, message: `Room ${roomId} terminated` });
}));

// Terminate ALL active rooms
router.post('/terminate-all', asyncHandler(async (_req: any, res: any) => {
  const { data: rooms, error: fetchErr } = await supabase
    .from('rooms')
    .select('room_id, participant1_id, participant2_id')
    .eq('status', 'active');

  if (fetchErr) throw fetchErr;

  if (!rooms || rooms.length === 0) {
    return res.json({ success: true, message: 'No active rooms to terminate' });
  }

  const roomIds = rooms.map((r: any) => r.room_id);
  const participantIds = rooms.flatMap((r: any) => [r.participant1_id, r.participant2_id]).filter(Boolean);

  // Mark all as closed
  const { error: closeErr } = await supabase
    .from('rooms')
    .update({ status: 'closed' })
    .in('room_id', roomIds);

  if (closeErr) throw closeErr;

  // Reset all participant states
  if (participantIds.length > 0) {
    await supabase
      .from('user_states')
      .update({ state: 'idle', room_id: null, is_active: false })
      .in('user_id', participantIds);
  }

  // Notify all rooms via socket
  for (const roomId of roomIds) {
    getSocketService()?.notifyRoom(roomId, 'roomClosed', { roomId, reason: 'admin_terminated' });
  }

  res.json({ success: true, message: `${rooms.length} rooms terminated` });
}));

export default router;
