import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/config/supabase.js';
import { logger } from '@/utils/logger.js';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/index.js';

// 6 queues: friendly-easy | friendly-medium | friendly-hard
//           challenge-easy | challenge-medium | challenge-hard
const MODES = ['friendly', 'challenge'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

// B3: Rating-window constants (challenge mode only)
const RATING_WINDOW_BASE = 200;
const RATING_WINDOW_STEP = 100;
const RATING_WINDOW_MAX = 600;
const RATING_WIDEN_INTERVAL_MS = 15_000;
const TICK_INTERVAL_MS = 5_000;

type QueueEntry = {
  userId: string;
  socketId: string;
  joinedAt: number;
  rating: number;
};

export class MatchmakingService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  // key = "mode:difficulty"
  private queues: Map<string, QueueEntry[]> = new Map();
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    for (const m of MODES) {
      for (const d of DIFFICULTIES) {
        this.queues.set(`${m}:${d}`, []);
      }
    }
    this.tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  destroy(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
  }

  // ---- Public API ----

  async joinQueue(userId: string, socketId: string, mode: string, difficulty: string, rating = 1200): Promise<void> {
    const key = this.queueKey(mode, difficulty);
    this.removeUserFromAllQueues(userId);

    const queue = this.queues.get(key);
    if (!queue) {
      logger.warn('Unknown queue key', { key });
      return;
    }

    queue.push({ userId, socketId, joinedAt: Date.now(), rating });
    logger.info(`User joined queue [${key}]`, { userId, socketId, rating, queueSize: queue.length });

    await this.tryMatch(key);
  }

  removeUserFromAllQueues(userId: string): void {
    for (const [key, queue] of this.queues.entries()) {
      const idx = queue.findIndex(e => e.userId === userId);
      if (idx !== -1) {
        queue.splice(idx, 1);
        logger.info(`User removed from queue [${key}]`, { userId });
      }
    }
  }

  clearAllQueues(): void {
    for (const queue of this.queues.values()) queue.length = 0;
    logger.info('All matchmaking queues cleared');
  }

  getQueueSizes(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, q] of this.queues.entries()) result[key] = q.length;
    return result;
  }

  // ---- Internal ----

  private queueKey(mode: string, difficulty: string): string {
    const m = MODES.includes(mode) ? mode : 'friendly';
    const d = DIFFICULTIES.includes(difficulty) ? difficulty : 'easy';
    return `${m}:${d}`;
  }

  private ratingWindow(joinedAt: number): number {
    const steps = Math.floor((Date.now() - joinedAt) / RATING_WIDEN_INTERVAL_MS);
    return Math.min(RATING_WINDOW_BASE + steps * RATING_WINDOW_STEP, RATING_WINDOW_MAX);
  }

  private canMatch(a: QueueEntry, b: QueueEntry): boolean {
    const window = Math.max(this.ratingWindow(a.joinedAt), this.ratingWindow(b.joinedAt));
    return Math.abs(a.rating - b.rating) <= window;
  }

  private async tryMatch(key: string): Promise<void> {
    const queue = this.queues.get(key);
    if (!queue || queue.length < 2) return;

    const [mode, difficulty] = key.split(':');

    if (mode === 'challenge') {
      // Find the best matchable pair: smallest rating diff among pairs whose windows overlap
      let bestI = -1, bestJ = -1, bestDiff = Infinity;
      for (let i = 0; i < queue.length; i++) {
        for (let j = i + 1; j < queue.length; j++) {
          if (this.canMatch(queue[i], queue[j])) {
            const diff = Math.abs(queue[i].rating - queue[j].rating);
            if (diff < bestDiff) { bestDiff = diff; bestI = i; bestJ = j; }
          }
        }
      }
      if (bestI === -1) return; // No matchable pair yet

      const userB = queue.splice(bestJ, 1)[0];
      const userA = queue.splice(bestI, 1)[0];
      logger.info(`Matched challenge pair [${key}]`, { userA: userA.userId, userB: userB.userId, ratingDiff: bestDiff });
      try {
        await this.createRoom(userA, userB, mode, difficulty);
      } catch (err) {
        logger.error('createRoom failed — putting users back', { err, key });
        queue.unshift(userB, userA);
      }
    } else {
      // Friendly: FIFO, match first two
      const [userA, userB] = queue.splice(0, 2);
      logger.info(`Matched friendly pair [${key}]`, { userA: userA.userId, userB: userB.userId });
      try {
        await this.createRoom(userA, userB, mode, difficulty);
      } catch (err) {
        logger.error('createRoom failed — putting users back', { err, key });
        queue.unshift(userB, userA);
      }
    }
  }

  /** Every 5s: re-attempt matches with widened windows, emit queueStatus to all waiters. */
  private tick(): void {
    for (const [key, queue] of this.queues.entries()) {
      if (queue.length === 0) continue;
      const [mode] = key.split(':');

      // Emit status to each waiter
      queue.forEach((entry, idx) => {
        const waitSeconds = Math.floor((Date.now() - entry.joinedAt) / 1000);
        const ratingWindow = mode === 'challenge' ? this.ratingWindow(entry.joinedAt) : RATING_WINDOW_MAX;
        this.io.to(entry.socketId).emit('queueStatus', {
          position: idx + 1,
          waitSeconds,
          queueSize: queue.length,
          ratingWindow,
        });
      });

      // Re-try matching (windows may have widened)
      if (queue.length >= 2) {
        void this.tryMatch(key);
      }
    }
  }

  private async createRoom(userA: QueueEntry, userB: QueueEntry, mode: string, difficulty: string): Promise<void> {
    const question = await this.pickQuestion(difficulty, [userA.userId, userB.userId]);

    if (!question) {
      logger.warn('No question available for match', { difficulty, userA: userA.userId, userB: userB.userId });
      this.emitToSocket(userA.socketId, 'matchError', { message: 'No questions available. Please try again later.' });
      this.emitToSocket(userB.socketId, 'matchError', { message: 'No questions available. Please try again later.' });
      return;
    }

    const roomId = uuidv4();

    await supabase.from('user_states').upsert([
      {
        user_id: userA.userId,
        state: 'matched',
        room_id: roomId,
        mode,
        difficulty,
        queue_joined_at: null,
        last_active: new Date().toISOString(),
        is_active: true,
        socket_id: userA.socketId,
      },
      {
        user_id: userB.userId,
        state: 'matched',
        room_id: roomId,
        mode,
        difficulty,
        queue_joined_at: null,
        last_active: new Date().toISOString(),
        is_active: true,
        socket_id: userB.socketId,
      },
    ], { onConflict: 'user_id' });

    await supabase.from('rooms').insert({
      room_id: roomId,
      participant1_id: userA.userId,
      participant2_id: userB.userId,
      question_id: question.id,
      difficulty,
      mode,
      status: 'active',
      created_at: new Date().toISOString(),
    });

    logger.info('Room created', {
      roomId,
      mode,
      difficulty,
      question: question.title,
      users: [userA.userId, userB.userId],
      ratings: [userA.rating, userB.rating],
    });

    const matchPayload = {
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
    };

    this.emitToSocket(userA.socketId, 'matchFound', matchPayload);
    this.emitToSocket(userB.socketId, 'matchFound', matchPayload);
  }

  // ---- Question selection ----

  async pickQuestion(difficulty: string, userIds: string[]): Promise<any | null> {
    const norm = difficulty.toLowerCase();

    const { data: questions } = await supabase
      .from('questions')
      .select('id, title, description, difficulty, examples, constraints, starter_code, tags')
      .ilike('difficulty', norm);

    const q = await this.selectUnsolved(questions || [], userIds);
    if (q) return q;

    const { data: all } = await supabase
      .from('questions')
      .select('id, title, description, difficulty, examples, constraints, starter_code, tags')
      .limit(100);

    return await this.selectUnsolved(all || [], userIds) ?? (all && all.length > 0 ? all[0] : null);
  }

  private async selectUnsolved(questions: any[], userIds: string[]): Promise<any | null> {
    if (!questions.length) return null;

    const { data: solved } = await supabase
      .from('completed_questions')
      .select('question_id')
      .in('user_id', userIds);

    const solvedIds = new Set((solved || []).map((r: any) => r.question_id));
    const unsolved = questions.filter(q => !solvedIds.has(q.id));

    if (!unsolved.length) return questions[Math.floor(Math.random() * questions.length)];
    return unsolved[Math.floor(Math.random() * unsolved.length)];
  }

  private emitToSocket(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event as any, data);
    logger.debug(`Emitted ${event} to socket`, { socketId });
  }
}
