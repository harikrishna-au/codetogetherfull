import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Per-user rate limiting for /api/execute (A7).
 *
 * Code execution is expensive, so on top of the global IP limiter we enforce:
 *  - max 1 concurrent execution per user
 *  - max 10 executions per rolling minute per user
 *
 * 429 responses carry a friendly `error` message the frontend shows in ResultsPanel.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

/** userId -> request timestamps inside the rolling window */
const recentRequests = new Map<string, number[]>();
/** userIds with an execution currently in flight */
const running = new Set<string>();

/** Drop empty entries so the map doesn't grow unbounded. */
function pruneStale(now: number): void {
  if (recentRequests.size < 1000) return;
  for (const [userId, stamps] of recentRequests) {
    if (stamps.every(t => now - t >= WINDOW_MS)) {
      recentRequests.delete(userId);
    }
  }
}

export function executeRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as AuthenticatedRequest).user?.userId;
  // authenticateToken runs before this; without a user just pass through —
  // the route itself will reject unauthenticated requests.
  if (!userId) {
    next();
    return;
  }

  // 1 concurrent execution per user
  if (running.has(userId)) {
    logger.warn('Execute rejected — concurrent run in flight', { userId });
    res.status(429).json({
      success: false,
      error: 'Hold on — your previous run is still executing. Wait for it to finish before submitting again.',
      code: 'EXECUTION_IN_PROGRESS',
    });
    return;
  }

  // 10 per rolling minute per user
  const now = Date.now();
  pruneStale(now);
  const stamps = (recentRequests.get(userId) ?? []).filter(t => now - t < WINDOW_MS);
  if (stamps.length >= MAX_PER_WINDOW) {
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - stamps[0])) / 1000));
    logger.warn('Execute rejected — per-user rate limit hit', { userId, retryAfterSec });
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      success: false,
      error: `You're running code too quickly — try again in ${retryAfterSec}s (max ${MAX_PER_WINDOW} runs per minute).`,
      code: 'EXECUTION_RATE_LIMITED',
    });
    return;
  }
  stamps.push(now);
  recentRequests.set(userId, stamps);

  // Mark in-flight; release whenever the response ends (success, error, or abort)
  running.add(userId);
  const release = () => running.delete(userId);
  res.once('finish', release);
  res.once('close', release);

  next();
}
