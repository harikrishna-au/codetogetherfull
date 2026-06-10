import {
    expectedScore,
    kFactor,
    ratingDelta,
    applyMatch,
    tierForRating,
    DEFAULT_RATING,
    K_PLACEMENT,
    K_STANDARD,
    PLACEMENT_GAMES,
} from '../EloService.js';

describe('expectedScore', () => {
    it('is 0.5 for equal ratings', () => {
        expect(expectedScore(1200, 1200)).toBeCloseTo(0.5);
    });

    it('is ~0.909 for a +400 advantage', () => {
        expect(expectedScore(1600, 1200)).toBeCloseTo(0.909, 2);
    });

    it('is symmetric: E(a,b) + E(b,a) = 1', () => {
        expect(expectedScore(1450, 1210) + expectedScore(1210, 1450)).toBeCloseTo(1);
    });
});

describe('kFactor', () => {
    it('is 40 during placement games', () => {
        expect(kFactor(0)).toBe(K_PLACEMENT);
        expect(kFactor(PLACEMENT_GAMES - 1)).toBe(K_PLACEMENT);
    });

    it('is 20 from the 11th game onward', () => {
        expect(kFactor(PLACEMENT_GAMES)).toBe(K_STANDARD);
        expect(kFactor(500)).toBe(K_STANDARD);
    });
});

describe('ratingDelta', () => {
    it('gives +20 / -20 for equal veterans', () => {
        expect(ratingDelta(1200, 1200, 50, 1)).toBe(10); // K=20 * (1 - 0.5)
        expect(ratingDelta(1200, 1200, 50, 0)).toBe(-10);
    });

    it('gives +20 for an even win in placement (K=40)', () => {
        expect(ratingDelta(1200, 1200, 0, 1)).toBe(20);
    });

    it('rewards beating a stronger opponent more', () => {
        const upset = ratingDelta(1200, 1500, 50, 1);
        const expected = ratingDelta(1200, 1000, 50, 1);
        expect(upset).toBeGreaterThan(expected);
    });

    it('punishes losing to a weaker opponent more', () => {
        const badLoss = ratingDelta(1500, 1200, 50, 0);
        const okLoss = ratingDelta(1200, 1500, 50, 0);
        expect(badLoss).toBeLessThan(okLoss);
    });
});

describe('applyMatch', () => {
    it('computes both sides of an even veteran match', () => {
        const result = applyMatch(
            { rating: 1200, gamesPlayed: 20 },
            { rating: 1200, gamesPlayed: 20 },
        );
        expect(result.winner).toEqual({ oldRating: 1200, newRating: 1210, delta: 10 });
        expect(result.loser).toEqual({ oldRating: 1200, newRating: 1190, delta: -10 });
    });

    it('uses each player\'s own K-factor', () => {
        // Placement winner (K=40) vs veteran loser (K=20), equal ratings
        const result = applyMatch(
            { rating: 1200, gamesPlayed: 2 },
            { rating: 1200, gamesPlayed: 100 },
        );
        expect(result.winner.delta).toBe(20);  // 40 * 0.5
        expect(result.loser.delta).toBe(-10);  // 20 * 0.5
    });

    it('never drops a rating below 0', () => {
        const result = applyMatch(
            { rating: 1200, gamesPlayed: 0 },
            { rating: 5, gamesPlayed: 0 },
        );
        expect(result.loser.newRating).toBeGreaterThanOrEqual(0);
    });

    it('zero-sum for two veterans at equal rating', () => {
        const result = applyMatch(
            { rating: 1400, gamesPlayed: 30 },
            { rating: 1400, gamesPlayed: 30 },
        );
        expect(result.winner.delta + result.loser.delta).toBe(0);
    });
});

describe('tierForRating', () => {
    it.each([
        [DEFAULT_RATING, 'Silver'],
        [1099, 'Bronze'],
        [1100, 'Silver'],
        [1299, 'Silver'],
        [1300, 'Gold'],
        [1499, 'Gold'],
        [1500, 'Platinum'],
        [1699, 'Platinum'],
        [1700, 'Diamond'],
        [2400, 'Diamond'],
    ])('%i -> %s', (rating, tier) => {
        expect(tierForRating(rating as number)).toBe(tier);
    });
});
