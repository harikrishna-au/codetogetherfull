import express from 'express';
import { AppError, ValidationError, asyncHandler } from '../utils/errors.js';
import { supabase } from '../config/supabase.js';
import { CodeRunner } from '../services/codeRunner.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const codeRunner = new CodeRunner();

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'cpp'] as const;

router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { code, language, questionId, visibleOnly, roomId } = req.body;
    const userId = req.user?.userId;

    // Validate input
    if (!code || typeof code !== 'string') {
        throw new ValidationError('code is required and must be a string');
    }
    if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
        throw new ValidationError(`language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`);
    }
    if (!questionId) {
        throw new ValidationError('questionId is required');
    }
    if (code.length > 50_000) {
        throw new ValidationError('Code exceeds maximum length of 50,000 characters');
    }

    // Fetch question for starter_code
    const { data: question, error: qErr } = await supabase
        .from('questions')
        .select('id, starter_code')
        .eq('id', questionId)
        .single();

    if (qErr || !question) {
        throw new AppError('Question not found', 404);
    }

    const starterCode = question.starter_code?.[language];
    if (!starterCode) {
        throw new AppError(`No starter code found for language: ${language}`, 400);
    }

    // Fetch test cases
    let query = supabase
        .from('test_cases')
        .select('id, input, expected_output, is_hidden')
        .eq('question_id', questionId)
        .order('is_hidden', { ascending: true });

    if (visibleOnly) {
        query = query.eq('is_hidden', false);
    }

    const { data: testCases, error: tcErr } = await query;

    if (tcErr) throw new AppError('Failed to fetch test cases', 500);
    if (!testCases || testCases.length === 0) {
        throw new AppError('No test cases found for this question', 404);
    }

    // Run code
    const results = await codeRunner.execute({
        code,
        language,
        starterCode,
        testCases: testCases.map(tc => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expected_output,
            isHidden: tc.is_hidden,
        })),
    });

    // Track completion when user passes ALL tests on a full submit (not visibleOnly run)
    if (!visibleOnly && userId && results.passed === results.totalTests && results.totalTests > 0) {
        // Insert into completed_questions (ignore conflict — user may have solved it before)
        await supabase.from('completed_questions').upsert(
            { user_id: userId, question_id: questionId, completed_at: new Date().toISOString() },
            { onConflict: 'user_id,question_id', ignoreDuplicates: true }
        );
    }

    // Log to session_history if we have a roomId (for both run and submit)
    if (roomId && userId) {
        // Determine partner from room record
        const { data: room } = await supabase
            .from('rooms')
            .select('participant1_id, participant2_id, question_id, mode, difficulty, created_at')
            .eq('room_id', roomId)
            .single();

        if (room) {
            const partnerId = room.participant1_id === userId
                ? room.participant2_id
                : room.participant1_id;
            const durationSeconds = room.created_at
                ? Math.round((Date.now() - new Date(room.created_at).getTime()) / 1000)
                : null;

            // Save or update session results
            await supabase.from('session_history').upsert({
                user_id: userId,
                room_id: roomId,
                question_id: questionId,
                partner_id: partnerId,
                duration: durationSeconds,
                test_cases_passed: results.passed,
                total_test_cases: results.totalTests,
                runtime_ms: results.overallRuntime,
                language: language,
                final_code: code,
                mode: room.mode,
                difficulty: room.difficulty,
                end_reason: visibleOnly ? null : 'both-submitted', // Only set end_reason on full submit
                completed_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,room_id',
                ignoreDuplicates: false // Update if exists
            });
        }
    }

    res.json({ success: true, results });
}));

export default router;
