import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { problems, Problem } from './problemData.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    console.error('Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Seed a single problem into the database
 */
async function seedProblem(problem: Problem) {
    try {
        // Insert question
        const { data: question, error: questionError } = await supabase
            .from('questions')
            .insert({
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty,
                examples: problem.examples,
                constraints: problem.constraints,
                starter_code: problem.starterCode,
                tags: problem.tags || [],
                category: problem.category || 'General',
            })
            .select()
            .single();

        if (questionError) {
            console.error(`Error inserting question "${problem.title}":`, questionError);
            return false;
        }

        console.log(`✓ Inserted question: ${problem.title} (${problem.difficulty})`);

        // Insert test cases
        const testCasesToInsert = problem.testCases.map((tc) => ({
            question_id: question.id,
            input: tc.input,
            expected_output: tc.expectedOutput,
            is_hidden: tc.isHidden,
        }));

        const { error: testCasesError } = await supabase
            .from('test_cases')
            .insert(testCasesToInsert);

        if (testCasesError) {
            console.error(`Error inserting test cases for "${problem.title}":`, testCasesError);
            return false;
        }

        console.log(`  ✓ Inserted ${problem.testCases.length} test cases`);
        return true;
    } catch (error) {
        console.error(`Error seeding problem "${problem.title}":`, error);
        return false;
    }
}

/**
 * Seed all problems from problemData.ts
 */
async function seedAllProblems() {
    console.log('🌱 Starting problem database seeding...\n');
    console.log(`Found ${problems.length} problems to seed.\n`);

    if (problems.length === 0) {
        console.log('⚠️  No problems to seed.');
        return;
    }

    // Check for existing questions to avoid duplicates
    const { data: existing, error: checkError } = await supabase
        .from('questions')
        .select('title');

    if (checkError) {
        console.error('Error checking existing questions:', checkError);
        return;
    }

    const existingTitles = new Set((existing || []).map((q) => q.title));
    const newProblems = problems.filter((p) => !existingTitles.has(p.title));

    if (newProblems.length < problems.length) {
        const skipped = problems.length - newProblems.length;
        console.log(`⏭️  Skipping ${skipped} problems that already exist in the database.`);
    }

    if (newProblems.length === 0) {
        console.log('✅ All problems already exist. Nothing to seed.\n');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const problem of newProblems) {
        const success = await seedProblem(problem);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        console.log(''); // Empty line for readability
    }

    console.log('✅ Seeding complete!');
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Total: ${newProblems.length}\n`);
}

// Run the seeding
seedAllProblems()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
