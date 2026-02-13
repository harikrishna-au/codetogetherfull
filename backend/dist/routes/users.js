import express from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../utils/errors.js';
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ message: 'Users route' });
});
// Heartbeat
router.post('/heartbeat', asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'UserId required' });
    }
    const { error } = await supabase
        .from('user_states')
        .update({ last_active: new Date().toISOString(), is_active: true })
        .eq('user_id', userId);
    if (error)
        throw error;
    res.json({ success: true });
}));
// Get user state
router.get('/:userId/state', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'UserId required' });
    }
    const { data: state, error } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error; // PGRST116 is not found
    res.json({ success: true, state: state || null });
}));
// Inactive
router.post('/inactive', asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'UserId required' });
    }
    const { error } = await supabase
        .from('user_states')
        .update({ is_active: false })
        .eq('user_id', userId);
    if (error)
        throw error;
    res.json({ success: true });
}));
// Get user statistics
router.get('/stats/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    // Total sessions
    const { count: totalSessions } = await supabase
        .from('session_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    // Problems solved by difficulty
    const { data: solvedProblems } = await supabase
        .from('completed_questions')
        .select('question_id')
        .eq('user_id', userId);
    const questionIds = solvedProblems?.map((i) => i.question_id).filter(Boolean) || [];
    const { data: questions } = questionIds.length > 0
        ? await supabase.from('questions').select('id, difficulty').in('id', questionIds)
        : { data: [] };
    const difficultyMap = new Map(questions?.map((q) => [q.id, q.difficulty]) || []);
    const problemsByDifficulty = {
        easy: 0,
        medium: 0,
        hard: 0
    };
    questionIds.forEach((qid) => {
        const difficulty = difficultyMap.get(qid);
        if (difficulty && problemsByDifficulty.hasOwnProperty(difficulty)) {
            problemsByDifficulty[difficulty]++;
        }
    });
    // Win/loss record for Challenge mode
    const { data: challengeSessions } = await supabase
        .from('session_history')
        .select('room_id, test_cases_passed, total_test_cases, runtime_ms')
        .eq('user_id', userId)
        .eq('mode', 'challenge');
    let wins = 0;
    let losses = 0;
    if (challengeSessions) {
        for (const session of challengeSessions) {
            const { data: partnerSession } = await supabase
                .from('session_history')
                .select('test_cases_passed, total_test_cases, runtime_ms')
                .eq('room_id', session.room_id)
                .neq('user_id', userId)
                .single();
            if (partnerSession) {
                const userPassed = session.test_cases_passed || 0;
                const partnerPassed = partnerSession.test_cases_passed || 0;
                const userRuntime = session.runtime_ms || 0;
                const partnerRuntime = partnerSession.runtime_ms || 0;
                if (userPassed > partnerPassed ||
                    (userPassed === partnerPassed && userRuntime < partnerRuntime)) {
                    wins++;
                }
                else if (userPassed < partnerPassed ||
                    (userPassed === partnerPassed && userRuntime > partnerRuntime)) {
                    losses++;
                }
            }
        }
    }
    // Current win streak
    const { data: recentChallenges } = await supabase
        .from('session_history')
        .select('room_id, test_cases_passed, runtime_ms, completed_at')
        .eq('user_id', userId)
        .eq('mode', 'challenge')
        .order('completed_at', { ascending: false })
        .limit(20);
    let currentStreak = 0;
    if (recentChallenges) {
        for (const session of recentChallenges) {
            const { data: partnerSession } = await supabase
                .from('session_history')
                .select('test_cases_passed, runtime_ms')
                .eq('room_id', session.room_id)
                .neq('user_id', userId)
                .single();
            if (partnerSession) {
                const userPassed = session.test_cases_passed || 0;
                const partnerPassed = partnerSession.test_cases_passed || 0;
                const userRuntime = session.runtime_ms || 0;
                const partnerRuntime = partnerSession.runtime_ms || 0;
                const won = userPassed > partnerPassed ||
                    (userPassed === partnerPassed && userRuntime < partnerRuntime);
                if (won) {
                    currentStreak++;
                }
                else {
                    break;
                }
            }
        }
    }
    // Favorite language
    const { data: languageStats } = await supabase
        .from('session_history')
        .select('language')
        .eq('user_id', userId)
        .not('language', 'is', null);
    const languageCounts = {};
    languageStats?.forEach((item) => {
        const lang = item.language;
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });
    const favoriteLanguage = Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'javascript';
    // Total coding time
    const { data: durations } = await supabase
        .from('session_history')
        .select('duration')
        .eq('user_id', userId)
        .not('duration', 'is', null);
    const totalCodingTime = durations?.reduce((sum, item) => sum + (item.duration || 0), 0) || 0;
    res.json({
        success: true,
        stats: {
            totalSessions: totalSessions || 0,
            problemsSolved: problemsByDifficulty,
            totalProblemsSolved: Object.values(problemsByDifficulty).reduce((a, b) => a + b, 0),
            winLossRecord: { wins, losses },
            currentStreak,
            favoriteLanguage,
            totalCodingTime
        }
    });
}));
// Get user session history
router.get('/history/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const { data: sessions, error } = await supabase
        .from('session_history')
        .select(`
            id,
            room_id,
            question_id,
            completed_at,
            duration,
            test_cases_passed,
            total_test_cases,
            runtime_ms,
            language,
            mode,
            difficulty,
            end_reason,
            partner_id
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    // Fetch partner names
    const partnerIds = sessions?.map(s => s.partner_id).filter(Boolean) || [];
    const questionIds = sessions?.map(s => s.question_id).filter(Boolean) || [];
    const [partnersResponse, questionsResponse] = await Promise.all([
        partnerIds.length > 0 ? supabase.from('users').select('user_id, display_name, email').in('user_id', partnerIds) : { data: [] },
        questionIds.length > 0 ? supabase.from('questions').select('id, title, difficulty').in('id', questionIds) : { data: [] }
    ]);
    const partnerMap = new Map(partnersResponse.data?.map((p) => [p.user_id, p]) || []);
    const questionMap = new Map(questionsResponse.data?.map((q) => [q.id, q]) || []);
    // Enrich sessions with partner info and question info
    const enrichedSessions = sessions?.map((session) => {
        const partner = session.partner_id ? partnerMap.get(session.partner_id) : null;
        const question = session.question_id ? questionMap.get(session.question_id) : null;
        const solved = session.test_cases_passed === session.total_test_cases && session.total_test_cases > 0;
        return {
            id: session.id,
            roomId: session.room_id,
            problem: {
                id: question?.id || session.question_id,
                title: question?.title || 'Unknown Problem',
                difficulty: question?.difficulty || session.difficulty || 'medium'
            },
            date: session.completed_at,
            duration: session.duration,
            result: {
                solved,
                testCasesPassed: session.test_cases_passed,
                totalTestCases: session.total_test_cases,
                runtime: session.runtime_ms
            },
            partner: partner ? {
                id: partner.user_id,
                name: partner.display_name || partner.email
            } : null,
            mode: session.mode,
            language: session.language,
            endReason: session.end_reason
        };
    }) || [];
    res.json({
        success: true,
        history: enrichedSessions
    });
}));
router.post('/reset', (req, res) => {
    res.json({ message: 'Users reset' });
});
export default router;
