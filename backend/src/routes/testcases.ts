import express from 'express';
import { supabase } from '../config/supabase.js';
import { AppError, asyncHandler } from '../utils/errors.js';

const router = express.Router();

// Get test cases for question
router.get('/:questionId', asyncHandler(async (req: any, res: any) => {
    const { questionId } = req.params;
    const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('question_id', questionId)
        .order('is_hidden', { ascending: true });

    if (error) throw new AppError(error.message, 500);

    const mappedTestCases = (data || []).map(tc => ({
        id: tc.id,
        questionId: tc.question_id,
        input: tc.input,
        output: tc.expected_output,
        isHidden: tc.is_hidden,
    }));

    res.json({ success: true, testCases: mappedTestCases });
}));

// Add test cases
router.post('/:questionId', asyncHandler(async (req: any, res: any) => {
    const { questionId } = req.params;
    const { testCases } = req.body;

    // validation
    if (!Array.isArray(testCases)) {
        throw new AppError('testCases must be an array', 400);
    }

    const testCasesToInsert = testCases.map(tc => ({
        question_id: questionId,
        input: tc.input,
        expected_output: tc.output, // DB uses expected_output
        is_hidden: false // Default
    }));

    const { error } = await supabase
        .from('test_cases')
        .insert(testCasesToInsert);

    if (error) throw new AppError(error.message, 500);

    res.json({ success: true });
}));

export default router;
