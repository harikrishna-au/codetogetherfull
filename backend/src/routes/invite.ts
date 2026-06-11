import { Router } from 'express';
import { param, body, validationResult } from 'express-validator';
import { authenticateToken } from '@/middleware/auth.js';
import { supabase } from '@/config/supabase.js';
import { getSocketService } from '@/server.js';
import { logger } from '@/utils/logger.js';

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** POST /api/invite/create — create a private room, returns invite code */
router.post(
  '/create',
  authenticateToken,
  [
    body('mode').isIn(['friendly', 'challenge']).optional().default('friendly'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).optional().default('easy'),
  ],
  asyncHandler(async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const creatorId: string = req.user.userId;
    const mode: string = req.body.mode ?? 'friendly';
    const difficulty: string = req.body.difficulty ?? 'easy';

    // Pick a question
    const { data: questions } = await supabase
      .from('questions')
      .select('id, title, description, difficulty, examples, constraints, starter_code, tags')
      .ilike('difficulty', difficulty);

    const qs = questions && questions.length > 0 ? questions : [];
    const question = qs.length > 0 ? qs[Math.floor(Math.random() * qs.length)] : null;

    if (!question) {
      return res.status(503).json({ error: 'No questions available for this difficulty.' });
    }

    // Generate a unique invite code (retry up to 5x on collision)
    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode();
      const { data: existing } = await supabase
        .from('rooms')
        .select('room_id')
        .eq('invite_code', code)
        .single();
      if (!existing) break;
      code = '';
    }
    if (!code) return res.status(500).json({ error: 'Failed to generate unique code' });

    const { v4: uuidv4 } = await import('uuid');
    const roomId = uuidv4();

    await supabase.from('rooms').insert({
      room_id: roomId,
      participant1_id: creatorId,
      participant2_id: null,
      question_id: question.id,
      difficulty,
      mode,
      status: 'pending',
      invite_code: code,
      created_at: new Date().toISOString(),
    });

    // Mark creator as matched (waiting for opponent)
    await supabase.from('user_states').upsert({
      user_id: creatorId,
      state: 'matched',
      room_id: roomId,
      mode,
      difficulty,
      is_active: true,
      last_active: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logger.info('Private room created', { roomId, code, creatorId, mode, difficulty });

    res.json({
      code,
      roomId,
      mode,
      difficulty,
      question: {
        id: question.id,
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        examples: question.examples,
        constraints: question.constraints,
        starterCode: question.starter_code,
        tags: question.tags,
      },
    });
  }),
);

/** GET /api/invite/:code — look up pending private room info */
router.get(
  '/:code',
  authenticateToken,
  [param('code').isLength({ min: 8, max: 8 }).trim().toUpperCase()],
  asyncHandler(async (req: any, res: any) => {
    const code: string = req.params.code.toUpperCase();

    const { data: room } = await supabase
      .from('rooms')
      .select('room_id, mode, difficulty, status, participant1_id, participant2_id')
      .eq('invite_code', code)
      .single();

    if (!room) return res.status(404).json({ error: 'Invite code not found.' });
    if (room.status !== 'pending') return res.status(410).json({ error: 'This invite has already been used.' });

    // Fetch creator display name
    const { data: creator } = await supabase
      .from('users')
      .select('display_name, username')
      .eq('user_id', room.participant1_id)
      .single();

    const creatorName = creator?.display_name || creator?.username || 'Someone';

    res.json({
      roomId: room.room_id,
      mode: room.mode,
      difficulty: room.difficulty,
      creatorName,
      creatorId: room.participant1_id,
    });
  }),
);

/** POST /api/invite/:code/join — join a pending private room */
router.post(
  '/:code/join',
  authenticateToken,
  [param('code').isLength({ min: 8, max: 8 }).trim().toUpperCase()],
  asyncHandler(async (req: any, res: any) => {
    const joinerId: string = req.user.userId;
    const code: string = req.params.code.toUpperCase();

    const { data: room } = await supabase
      .from('rooms')
      .select('room_id, mode, difficulty, status, participant1_id, question_id')
      .eq('invite_code', code)
      .single();

    if (!room) return res.status(404).json({ error: 'Invite code not found.' });
    if (room.status !== 'pending') return res.status(410).json({ error: 'This invite has already been used.' });
    if (room.participant1_id === joinerId) return res.status(400).json({ error: 'You cannot join your own room.' });

    const { roomId, mode, difficulty } = { roomId: room.room_id, mode: room.mode, difficulty: room.difficulty };

    // Activate the room
    await supabase
      .from('rooms')
      .update({ participant2_id: joinerId, status: 'active' })
      .eq('room_id', roomId);

    // Fetch the question
    const { data: question } = await supabase
      .from('questions')
      .select('id, title, description, difficulty, examples, constraints, starter_code, tags')
      .eq('id', room.question_id)
      .single();

    // Mark both users as matched
    await supabase.from('user_states').upsert([
      {
        user_id: room.participant1_id,
        state: 'matched',
        room_id: roomId,
        mode,
        difficulty,
        is_active: true,
        last_active: new Date().toISOString(),
      },
      {
        user_id: joinerId,
        state: 'matched',
        room_id: roomId,
        mode,
        difficulty,
        is_active: true,
        last_active: new Date().toISOString(),
      },
    ], { onConflict: 'user_id' });

    const matchPayload = {
      roomId,
      mode,
      difficulty,
      question: question ? {
        id: question.id,
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        examples: question.examples,
        constraints: question.constraints,
        starterCode: question.starter_code,
        tags: question.tags,
      } : undefined,
    };

    // Push matchFound to the creator via socket
    const socketService = getSocketService();
    if (socketService) {
      await socketService.notifyUser(room.participant1_id, 'matchFound', matchPayload);
    }

    logger.info('Private room joined', { roomId, code, joinerId, creatorId: room.participant1_id });

    res.json(matchPayload);
  }),
);

export default router;
