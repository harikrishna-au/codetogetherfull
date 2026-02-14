import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/config/supabase.js';
import { logger } from '@/utils/logger.js';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/index.js';

// 6 queues: friendly-easy | friendly-medium | friendly-hard
//           challenge-easy | challenge-medium | challenge-hard
const MODES = ['friendly', 'challenge'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

type QueueEntry = {
  userId: string;
  socketId: string;
  joinedAt: number;
};

export class MatchmakingService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  // key = "mode:difficulty"
  private queues: Map<string, QueueEntry[]> = new Map();

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    // Pre-create all 6 queues
    for (const m of MODES) {
      for (const d of DIFFICULTIES) {
        this.queues.set(`${m}:${d}`, []);
      }
    }
  }

  // ---- Public API called from SocketService ----

  /**
   * Add a user to the appropriate queue and immediately attempt to match.
   * Returns the queue key the user was placed into.
   */
  async joinQueue(userId: string, socketId: string, mode: string, difficulty: string): Promise<void> {
    const key = this.queueKey(mode, difficulty);

    // Remove any previous entry for this user across all queues
    this.removeUserFromAllQueues(userId);

    const queue = this.queues.get(key);
    if (!queue) {
      logger.warn('Unknown queue key', { key });
      return;
    }

    queue.push({ userId, socketId, joinedAt: Date.now() });
    logger.info(`User joined queue [${key}]`, { userId, socketId, queueSize: queue.length });

    // Try to match immediately
    await this.tryMatch(key);
  }

  /**
   * Remove a user from whatever queue they are in (on disconnect / cancel).
   */
  removeUserFromAllQueues(userId: string): void {
    for (const [key, queue] of this.queues.entries()) {
      const before = queue.length;
      const idx = queue.findIndex(e => e.userId === userId);
      if (idx !== -1) {
        queue.splice(idx, 1);
        logger.info(`User removed from queue [${key}]`, { userId, queueSizeBefore: before, after: queue.length });
      }
    }
  }

  /** Remove every user from every queue. */
  clearAllQueues(): void {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
    logger.info('All matchmaking queues cleared');
  }

  /** Queue sizes for diagnostics */
  getQueueSizes(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, q] of this.queues.entries()) {
      result[key] = q.length;
    }
    return result;
  }

  // ---- Internal ----

  private queueKey(mode: string, difficulty: string): string {
    const m = MODES.includes(mode) ? mode : 'friendly';
    const d = DIFFICULTIES.includes(difficulty) ? difficulty : 'easy';
    return `${m}:${d}`;
  }

  private async tryMatch(key: string): Promise<void> {
    const queue = this.queues.get(key);
    if (!queue || queue.length < 2) return;

    // Pop the two longest-waiting users
    const [userA, userB] = queue.splice(0, 2);
    const [, difficulty] = key.split(':');
    const mode = key.split(':')[0];

    logger.info(`Matched pair from queue [${key}]`, {
      userA: userA.userId,
      userB: userB.userId,
    });

    try {
      await this.createRoom(userA, userB, mode, difficulty);
    } catch (err) {
      logger.error('createRoom failed — putting users back in queue', { err, key });
      // Put them back at the front so they're re-matched quickly
      queue.unshift(userB, userA);
    }
  }

  private async createRoom(
    userA: QueueEntry,
    userB: QueueEntry,
    mode: string,
    difficulty: string,
  ): Promise<void> {
    const question = await this.pickQuestion(difficulty, [userA.userId, userB.userId]);

    if (!question) {
      logger.warn('No question available for match', { difficulty, userA: userA.userId, userB: userB.userId });
      this.emitToSocket(userA.socketId, 'matchError', { message: 'No questions available. Please try again later.' });
      this.emitToSocket(userB.socketId, 'matchError', { message: 'No questions available. Please try again later.' });
      return;
    }

    const roomId = uuidv4();

    // Persist: mark both users as matched
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

    // Persist: create room record
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

    // Notify both users immediately
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

    // Fallback: any difficulty
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
    // io.to(socketId) works even after transport upgrades (polling → websocket)
    // whereas sockets.get() can miss a socket that upgraded mid-queue
    this.io.to(socketId).emit(event as any, data);
    logger.debug(`Emitted ${event} to socket`, { socketId });
  }
}
