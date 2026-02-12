import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Example {
    input: string;
    output: string;
    explanation?: string;
}

interface StarterCode {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
}

interface TestCase {
    input: Record<string, any>;
    expectedOutput: any;
    isHidden: boolean;
}

interface Problem {
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    description: string;
    examples: Example[];
    constraints: string[];
    starterCode: StarterCode;
    testCases: TestCase[];
    tags?: string[];
    category?: string;
}

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
 * Seed all problems
 * 
 * NOTE: Add your problems to the `problems` array below.
 * Use the format provided in the documentation.
 */
async function seedAllProblems() {
    console.log('🌱 Starting problem database seeding...\n');

    // TODO: Add your problems here
    // Example format:
    const problems: Problem[] = [
        {
            title: "Two Sum",
            difficulty: "easy",
            description:
                "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to the target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",

            examples: [
                {
                    input: "nums = [2,7,11,15], target = 9",
                    output: "[0,1]",
                    explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
                },
                {
                    input: "nums = [3,2,4], target = 6",
                    output: "[1,2]"
                },
                {
                    input: "nums = [3,3], target = 6",
                    output: "[0,1]"
                }
            ],

            constraints: [
                "2 <= nums.length <= 10^4",
                "-10^9 <= nums[i] <= 10^9",
                "-10^9 <= target <= 10^9",
                "Only one valid answer exists."
            ],

            starterCode: {
                javascript: `function twoSum(nums, target) {
  // Write your code here
};`,
                python: `def two_sum(nums, target):
    # Write your code here
    pass`,
                java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        
    }
}`,
                cpp: `vector<int> twoSum(vector<int>& nums, int target) {
  // Write your code here
}`
            },

            testCases: [
                { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1], isHidden: false },
                { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2], isHidden: false },
                { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1], isHidden: false }
            ],

            tags: ["array", "hash-map"],
            category: "Arrays & Hashing"
        }
    ];

    if (problems.length === 0) {
        console.log('⚠️  No problems to seed. Add problems to the `problems` array.');
        console.log('📖 See the format guide in the documentation.\n');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const problem of problems) {
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
    console.log(`   Total: ${problems.length}\n`);
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
