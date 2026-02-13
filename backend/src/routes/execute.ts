import express from 'express';
import { AppError, ValidationError, asyncHandler } from '../utils/errors.js';
import { supabase } from '../config/supabase.js';
import { CodeRunner } from '../services/codeRunner.js';

const router = express.Router();
const codeRunner = new CodeRunner();

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'cpp'] as const;

router.post('/', asyncHandler(async (req: any, res: any) => {
    const { code, language, questionId } = req.body;

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
    const { data: testCases, error: tcErr } = await supabase
        .from('test_cases')
        .select('id, input, expected_output, is_hidden')
        .eq('question_id', questionId)
        .order('is_hidden', { ascending: true });

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

    res.json({ success: true, results });
}));

export default router;
