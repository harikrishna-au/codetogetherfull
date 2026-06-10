/**
 * Standard Elo rating math (B1). Pure functions — no I/O — so the win path
 * can apply them inline and tests can cover the math directly.
 *
 * Rules:
 *  - everyone starts at 1200
 *  - K = 40 for a player's first 10 rated games ("placement"), 20 thereafter
 *  - only challenge mode is rated (enforced by the caller)
 */

export const DEFAULT_RATING = 1200;
export const PLACEMENT_GAMES = 10;
export const K_PLACEMENT = 40;
export const K_STANDARD = 20;

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface PlayerRating {
    rating: number;
    gamesPlayed: number;
}

export interface RatingChange {
    oldRating: number;
    newRating: number;
    delta: number;
}

export interface MatchRatingResult {
    winner: RatingChange;
    loser: RatingChange;
}

/** Probability that `rating` beats `opponentRating` under the Elo model. */
export function expectedScore(rating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
}

export function kFactor(gamesPlayed: number): number {
    return gamesPlayed < PLACEMENT_GAMES ? K_PLACEMENT : K_STANDARD;
}

/**
 * Rating change for one player given the match outcome.
 * `score` is 1 for a win, 0 for a loss.
 */
export function ratingDelta(
    rating: number,
    opponentRating: number,
    gamesPlayed: number,
    score: 0 | 1,
): number {
    return Math.round(kFactor(gamesPlayed) * (score - expectedScore(rating, opponentRating)));
}

/** Apply a decisive match (win/loss — forfeits count) to both players. */
export function applyMatch(winner: PlayerRating, loser: PlayerRating): MatchRatingResult {
    const winnerDelta = ratingDelta(winner.rating, loser.rating, winner.gamesPlayed, 1);
    const loserDelta = ratingDelta(loser.rating, winner.rating, loser.gamesPlayed, 0);
    return {
        winner: {
            oldRating: winner.rating,
            newRating: winner.rating + winnerDelta,
            delta: winnerDelta,
        },
        loser: {
            oldRating: loser.rating,
            // Elo never drops below 0
            newRating: Math.max(0, loser.rating + loserDelta),
            delta: loserDelta,
        },
    };
}

/** Rank tier for display: Bronze <1100, Silver <1300, Gold <1500, Platinum <1700, Diamond >=1700. */
export function tierForRating(rating: number): RankTier {
    if (rating < 1100) return 'Bronze';
    if (rating < 1300) return 'Silver';
    if (rating < 1500) return 'Gold';
    if (rating < 1700) return 'Platinum';
    return 'Diamond';
}
