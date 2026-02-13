import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/config/supabase.js';
import { logger } from '@/utils/logger.js';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/index.js';

const POLL_INTERVAL_MS = 3000;
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export class MatchmakingService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.runMatchCycle(), POLL_INTERVAL_MS);
    logger.info('MatchmakingService started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ---- core matching loop ----

  private async runMatchCycle(): Promise<void> {
    try {
      // Fetch all waiting users ordered by how long they've been waiting
      const { data: waitingUsers, error } = await supabase
        .from('user_states')
        .select('user_id, difficulty, mode, queue_joined_at, socket_id')
        .eq('state', 'waiting')
        .eq('is_active', true)
        .order('queue_joined_at', { ascending: true });

      if (error || !waitingUsers || waitingUsers.length < 2) return;

      // Group by difficulty
      const byDifficulty: Record<string, typeof waitingUsers> = {};
      for (const u of waitingUsers) {
        const d = (u.difficulty || 'easy').toLowerCase();
        if (!byDifficulty[d]) byDifficulty[d] = [];
        byDifficulty[d].push(u);
      }

      // Match pairs within each difficulty
      for (const difficulty of DIFFICULTY_ORDER) {
        const pool = byDifficulty[difficulty] || [];
        while (pool.length >= 2) {
          const [userA, userB] = pool.splice(0, 2);
          await this.createMatch(userA, userB, difficulty).catch((err) =>
            logger.error('Failed to create match', { err, difficulty })
          );
        }
      }
    } catch (err) {
      logger.error('MatchmakingService cycle error', { err });
    }
  }

  private async createMatch(
    userA: { user_id: string; socket_id: string | null; mode: string | null },
    userB: { user_id: string; socket_id: string | null; mode: string | null },
    difficulty: string,
  ): Promise<void> {
    // Pick a question for this match
    const question = await this.pickQuestion(difficulty, [userA.user_id, userB.user_id]);

    if (!question) {
      logger.warn('No question available for match', { difficulty, userA: userA.user_id, userB: userB.user_id });
      // Emit error to both users so they know why match failed
      this.notifyUser(userA.socket_id, 'matchError', { message: 'No questions available. Please try again later.' });
      this.notifyUser(userB.socket_id, 'matchError', { message: 'No questions available. Please try again later.' });
      return;
    }

    const roomId = uuidv4();
    const mode = userA.mode || userB.mode || 'friendly';

    // Mark both users as matched before emitting to prevent race conditions
    await supabase.from('user_states').update({
      state: 'matched',
      room_id: roomId,
      queue_joined_at: null,
      last_active: new Date().toISOString(),
    }).in('user_id', [userA.user_id, userB.user_id]);

    // Create room record
    await supabase.from('rooms').insert({
      room_id: roomId,
      participant1_id: userA.user_id,
      participant2_id: userB.user_id,
      question_id: question.id,
      difficulty,
      mode,
      status: 'active',
      created_at: new Date().toISOString(),
    });

    logger.info('Match created', {
      roomId,
      difficulty,
      question: question.title,
      users: [userA.user_id, userB.user_id],
    });

    const matchPayload = {
      roomId,
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
    };

    // Notify both users
    this.notifyUser(userA.socket_id, 'matchFound', matchPayload);
    this.notifyUser(userB.socket_id, 'matchFound', matchPayload);
  }

  // ---- question selection ----

  async pickQuestion(difficulty: string, userIds: string[]): Promise<any | null> {
    const normDifficulty = difficulty.toLowerCase();

    // Get all questions at the requested difficulty
    const { data: allAtDifficulty } = await supabase
      .from('questions')
      .select('id, title, description, difficulty, examples, constraints, starter_code, tags')
      .ilike('difficulty', normDifficulty);

    const question = await this.selectUnsolvedQuestion(allAtDifficulty || [], userIds);
    if (question) return question;

    // Fallback: try other difficulties in order
    for (const d of DIFFICULTY_ORDER) {
      if (d === normDifficulty) continue;
      const { data: fallback } = await supabase
        .from('questions')
        .select('id, title, description, difficulty, examples, constraints, starter_code, tags')
        .ilike('difficulty', d);

      const q = await this.selectUnsolvedQuestion(fallback || [], userIds);
      if (q) {
        logger.info('Falling back to different difficulty', { requested: normDifficulty, actual: d });
        return q;
      }
    }

    // Last resort: pick any random question (both users have solved everything)
    const { data: any } = await supabase
      .from('questions')
      .select('id, title, description, difficulty, examples, constraints, starter_code, tags')
      .limit(50);
    if (any && any.length > 0) return any[Math.floor(Math.random() * any.length)];

    return null;
  }

  private async selectUnsolvedQuestion(questions: any[], userIds: string[]): Promise<any | null> {
    if (!questions.length) return null;

    // Get all question IDs solved by either user
    const { data: solved } = await supabase
      .from('completed_questions')
      .select('question_id')
      .in('user_id', userIds);

    const solvedIds = new Set((solved || []).map((r: any) => r.question_id));
    const unsolved = questions.filter((q) => !solvedIds.has(q.id));

    if (unsolved.length === 0) return null;

    // Randomly pick from unsolved
    return unsolved[Math.floor(Math.random() * unsolved.length)];
  }

  private notifyUser(socketId: string | null, event: string, data: any): void {
    if (!socketId) return;
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) socket.emit(event as any, data);
  }
}
