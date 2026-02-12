import express from 'express';
import { supabase } from '../config/supabase.js';
import { AppError, asyncHandler } from '../utils/errors.js';

const router = express.Router();

// Get all questions
router.get('/', asyncHandler(async (req: any, res: any) => {
    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, title, description, difficulty, examples, constraints, starter_code, tags, category, created_at, updated_at')
        .order('created_at', { ascending: true });

    if (error) throw new AppError(error.message, 500);

    const mappedQuestions = (questions || []).map(q => ({
        id: q.id,
        questionId: q.id,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        examples: q.examples || [],
        constraints: q.constraints || [],
        starterCode: q.starter_code || {},
        tags: q.tags || [],
        category: q.category,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
    }));

    res.json({ success: true, questions: mappedQuestions });
}));

// Count questions
router.get('/count', asyncHandler(async (req: any, res: any) => {
    const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

    if (error) throw new AppError(error.message, 500);

    res.json({ totalQuestions: count || 0 });
}));

// Get next ID
router.get('/next-id', asyncHandler(async (req: any, res: any) => {
    // Generate a simple ID or fetch max
    res.json({ nextId: `q${Date.now()}` });
}));

// Add question
router.post('/', asyncHandler(async (req: any, res: any) => {
    const question = req.body;
    // Map API question to DB schema
    const dbQuestion = {
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        category: question.tags?.[0] || 'Uncategorized', // Simplification
        // Add other fields matching DB schema
    };

    const { data, error } = await supabase
        .from('questions')
        .insert(dbQuestion)
        .select()
        .single();

    if (error) throw new AppError(error.message, 500);

    res.status(201).json({ success: true, question: data });
}));

// Initialize sample
router.post('/initialize', asyncHandler(async (req: any, res: any) => {
    res.json({ totalQuestions: 0 });
}));

// Delete question
router.delete('/:id', asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

    if (error) throw new AppError(error.message, 500);

    res.json({ success: true });
}));

export default router;
