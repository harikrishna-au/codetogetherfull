import express, { Request, Response } from 'express';
import { query } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../utils/errors.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { tierForRating } from '../services/EloService.js';

const router = express.Router();

type Period = 'all' | 'month' | 'week';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    rating: number;
    peakRating: number;
    tier: string;
    wins: number;
    losses: number;
    streak: number;
}

// 60s in-memory cache keyed by period:limit (B2)
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { entries: LeaderboardEntry[]; expiresAt: number }>();

function periodCutoff(period: Period): string | null {
    const DAY_MS = 24 * 60 * 60 * 1000;
    if (period === 'week') return new Date(Date.now() - 7 * DAY_MS).toISOString();
    if (period === 'month') return new Date(Date.now() - 30 * DAY_MS).toISOString();
    return null;
}

// GET /api/leaderboard?scope=global&period=all|month|week&limit=50
router.get(
    '/',
    authenticateToken,
    query('scope').optional().isIn(['global']).withMessage('scope must be global'),
    query('period').optional().isIn(['all', 'month', 'week']).withMessage('period must be all, month or week'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
    validateRequest,
    asyncHandler(async (req: Request, res: Response) => {
        const period = (req.query.period as Period) || 'all';
        const limit = parseInt(req.query.limit as string) || 50;

        const cacheKey = `${period}:${limit}`;
        const cached = cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return res.json({ success: true, period, entries: cached.entries, cached: true });
        }

        let dbQuery = supabase
            .from('users')
            .select('user_id, display_name, email, rating, peak_rating, rated_wins, rated_losses, current_streak')
            .gt('rated_games_played', 0)
            .order('rating', { ascending: false })
            .limit(limit);

        const cutoff = periodCutoff(period);
        if (cutoff) {
            dbQuery = dbQuery.gte('last_rated_at', cutoff);
        }

        const { data: rows, error } = await dbQuery;
        if (error) throw error;

        const entries: LeaderboardEntry[] = (rows ?? []).map((row, i) => ({
            rank: i + 1,
            userId: row.user_id,
            displayName: row.display_name || row.email?.split('@')[0] || 'Anonymous',
            rating: row.rating,
            peakRating: row.peak_rating,
            tier: tierForRating(row.rating),
            wins: row.rated_wins ?? 0,
            losses: row.rated_losses ?? 0,
            streak: row.current_streak ?? 0,
        }));

        cache.set(cacheKey, { entries, expiresAt: Date.now() + CACHE_TTL_MS });

        res.json({ success: true, period, entries, cached: false });
    }),
);

export default router;
