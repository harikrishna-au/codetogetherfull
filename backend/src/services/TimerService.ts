import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import type { Server } from 'socket.io';

export class TimerService {
    private io: Server;
    private timerChecks: Map<string, NodeJS.Timeout> = new Map();
    private readonly SESSION_DURATION_MS = 45 * 60 * 1000; // 45 minutes

    constructor(io: Server) {
        this.io = io;
    }

    /**
     * Start monitoring a room's timer
     */
    public startRoomTimer(roomId: string, createdAt: string): void {
        // Clear any existing timer for this room
        this.stopRoomTimer(roomId);

        const startTime = new Date(createdAt).getTime();
        const endTime = startTime + this.SESSION_DURATION_MS;
        const now = Date.now();
        const timeRemaining = endTime - now;

        if (timeRemaining <= 0) {
            // Timer already expired
            this.handleTimerExpiry(roomId);
            return;
        }

        // Set timeout to trigger when timer expires
        const timeout = setTimeout(() => {
            this.handleTimerExpiry(roomId);
        }, timeRemaining);

        this.timerChecks.set(roomId, timeout);
        logger.info('Room timer started', { roomId, expiresIn: timeRemaining });
    }

    /**
     * Stop monitoring a room's timer
     */
    public stopRoomTimer(roomId: string): void {
        const timeout = this.timerChecks.get(roomId);
        if (timeout) {
            clearTimeout(timeout);
            this.timerChecks.delete(roomId);
            logger.debug('Room timer stopped', { roomId });
        }
    }

    /**
     * Handle timer expiry for a room
     */
    private async handleTimerExpiry(roomId: string): Promise<void> {
        try {
            logger.info('Timer expired for room', { roomId });

            // Mark room as ended — conditional on still being active so we don't
            // clobber a room already ended by a win/forfeit (A3/A6)
            const { data: endedRooms, error } = await supabase
                .from('rooms')
                .update({ status: 'ended', ended_at: new Date().toISOString(), end_reason: 'timer' })
                .eq('room_id', roomId)
                .eq('status', 'active')
                .select('participant1_id, participant2_id');

            if (error) {
                logger.error('Failed to mark room as ended', { roomId, error });
            }

            // Room already ended elsewhere — nothing more to do
            if (!error && (!endedRooms || endedRooms.length === 0)) {
                this.stopRoomTimer(roomId);
                return;
            }

            // Free both participants so they aren't stuck 'in-session' (A6)
            const participants = endedRooms?.[0]
                ? [endedRooms[0].participant1_id, endedRooms[0].participant2_id].filter(Boolean)
                : [];
            if (participants.length > 0) {
                await supabase.from('user_states').update({
                    state: 'idle',
                    room_id: null,
                    last_active: new Date().toISOString(),
                }).in('user_id', participants);
            }

            // Emit timer-expired event to all participants
            this.io.to(roomId).emit('timer-expired', { roomId });

            // Emit room-exit event with timer-expired reason
            this.io.to(roomId).emit('room-exit', {
                roomId,
                reason: 'timer-expired',
                leaver: 'system'
            });

            // Clean up timer
            this.stopRoomTimer(roomId);

            logger.info('Timer expiry handled', { roomId });
        } catch (err) {
            logger.error('Error handling timer expiry', { roomId, err });
        }
    }

    /**
     * Initialize timers for all active rooms on server start
     */
    public async initializeActiveRoomTimers(): Promise<void> {
        try {
            const { data: activeRooms } = await supabase
                .from('rooms')
                .select('room_id, created_at')
                .eq('status', 'active');

            if (activeRooms && activeRooms.length > 0) {
                for (const room of activeRooms) {
                    this.startRoomTimer(room.room_id, room.created_at);
                }
                logger.info('Initialized timers for active rooms', { count: activeRooms.length });
            }
        } catch (err) {
            logger.error('Failed to initialize active room timers', { err });
        }
    }

    /**
     * Clean up all timers
     */
    public cleanup(): void {
        for (const [roomId, timeout] of this.timerChecks.entries()) {
            clearTimeout(timeout);
        }
        this.timerChecks.clear();
        logger.info('All room timers cleaned up');
    }
}
