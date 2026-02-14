
import express from 'express';
import { asyncHandler } from '../utils/errors.js';
import { supabase } from '../config/supabase.js';
import { getSocketService } from '../server.js';

const router = express.Router();

// Get live queue stats from in-memory queues + waiting count from DB
router.get('/stats', asyncHandler(async (_req: any, res: any) => {
  const sizes = getSocketService()?.getQueueStats() ?? {};

  // Count waiting users per mode:difficulty from DB as a fallback/cross-check
  const { data: waitingUsers } = await supabase
    .from('user_states')
    .select('mode, difficulty')
    .eq('state', 'waiting')
    .eq('is_active', true);

  // Build stats per difficulty (aggregate across modes for backwards compat)
  const byDifficulty: Record<string, { count: number; averageWaitTime: number; oldestWaitTime: number }> = {};
  for (const [key, count] of Object.entries(sizes)) {
    const [, difficulty] = key.split(':');
    if (!byDifficulty[difficulty]) byDifficulty[difficulty] = { count: 0, averageWaitTime: 0, oldestWaitTime: 0 };
    byDifficulty[difficulty].count += count;
  }

  // Also include the full breakdown keyed by "mode:difficulty"
  res.json({
    success: true,
    data: byDifficulty,
    queues: sizes,
    waitingInDb: waitingUsers?.length ?? 0,
  });
}));

// Clear all in-memory queues and reset waiting states in DB
router.post('/clear', asyncHandler(async (_req: any, res: any) => {
  const removed = getSocketService()?.clearAllQueues() ?? 0;

  // Reset 'waiting' → 'idle' in DB so users don't get stuck
  const { error } = await supabase
    .from('user_states')
    .update({ state: 'idle', queue_joined_at: null, mode: null, difficulty: null })
    .eq('state', 'waiting');

  if (error) throw error;

  res.json({ success: true, message: `All queues cleared (${removed} users removed from memory)` });
}));

// Clear specific difficulty queue
router.post('/clear/:difficulty', asyncHandler(async (req: any, res: any) => {
  const { difficulty } = req.params;

  // Reset 'waiting' users with this difficulty in DB
  const { error } = await supabase
    .from('user_states')
    .update({ state: 'idle', queue_joined_at: null, mode: null, difficulty: null })
    .eq('state', 'waiting')
    .eq('difficulty', difficulty);

  if (error) throw error;

  res.json({ success: true, message: `Queue for difficulty '${difficulty}' cleared` });
}));

// Get queue contents for a difficulty
router.get('/contents/:difficulty', asyncHandler(async (req: any, res: any) => {
  const { difficulty } = req.params;
  const { data, error } = await supabase
    .from('user_states')
    .select('user_id, mode, difficulty, queue_joined_at, socket_id')
    .eq('state', 'waiting')
    .eq('difficulty', difficulty)
    .eq('is_active', true);

  if (error) throw error;
  res.json({ success: true, data: data || [] });
}));

// Get queue counts
router.get('/count', asyncHandler(async (_req: any, res: any) => {
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

  getSocketService()?.removeUserFromQueues(userId);

  const { error } = await supabase
    .from('user_states')
    .update({ state: 'idle', queue_joined_at: null })
    .eq('user_id', userId);

  if (error) throw error;
  res.json({ success: true, message: 'Queue cancelled' });
}));

export default router;
