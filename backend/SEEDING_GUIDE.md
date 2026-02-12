# Problem Seeding Guide

This guide explains how to manually seed coding problems into the Supabase database.

## Prerequisites

1. Supabase project is set up
2. Database migration has been run (`supabase_migration.sql`)
3. You have your Supabase URL and Service Role Key

## Option 1: Manual Seeding via Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Navigate to your project
3. Click on "Table Editor" in the sidebar

### Step 2: Insert a Question

1. Select the `questions` table
2. Click "Insert" → "Insert row"
3. Fill in the fields:

```
title: "Two Sum"
description: "Given an array of integers nums and an integer target..."
difficulty: "easy"
examples: [{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "..."}]
constraints: ["2 <= nums.length <= 10^4", "..."]
starter_code: {"javascript": "function twoSum(nums, target) {\n  // Write your code here\n}", "python": "...", "java": "...", "cpp": "..."}
tags: ["array", "hash-table"]
category: "Arrays & Strings"
```

4. Click "Save"
5. **Copy the generated UUID** from the `id` column

### Step 3: Insert Test Cases

1. Select the `test_cases` table
2. Click "Insert" → "Insert row"
3. Fill in the fields:

```
question_id: <paste the UUID from step 2>
input: {"nums": [2,7,11,15], "target": 9}
expected_output: [0,1]
is_hidden: false
```

4. Repeat for each test case (3-5 visible + 2-3 hidden)

### Step 4: Verify

Run this query in the SQL Editor:

```sql
SELECT 
  q.title,
  q.difficulty,
  COUNT(tc.id) as test_case_count
FROM questions q
LEFT JOIN test_cases tc ON q.id = tc.question_id
GROUP BY q.id, q.title, q.difficulty
ORDER BY q.created_at DESC;
```

---

## Option 2: Seeding via SQL

### Step 1: Prepare SQL Insert Statement

Create a file `seed_problem.sql`:

```sql
-- Insert question
INSERT INTO questions (
  title,
  description,
  difficulty,
  examples,
  constraints,
  starter_code,
  tags,
  category
) VALUES (
  'Two Sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  'easy',
  '[
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ]'::jsonb,
  '["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"]'::jsonb,
  '{
    "javascript": "function twoSum(nums, target) {\n  // Write your code here\n}",
    "python": "def two_sum(nums, target):\n    # Write your code here\n    pass",
    "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}",
    "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};"
  }'::jsonb,
  ARRAY['array', 'hash-table'],
  'Arrays & Strings'
) RETURNING id;

-- Note the returned ID, then insert test cases:
INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES
  ('<question-id>', '{"nums": [2,7,11,15], "target": 9}'::jsonb, '[0,1]'::jsonb, false),
  ('<question-id>', '{"nums": [3,2,4], "target": 6}'::jsonb, '[1,2]'::jsonb, false),
  ('<question-id>', '{"nums": [3,3], "target": 6}'::jsonb, '[0,1]'::jsonb, false),
  ('<question-id>', '{"nums": [1,5,3,7,9], "target": 12}'::jsonb, '[2,4]'::jsonb, true),
  ('<question-id>', '{"nums": [-1,-2,-3,-4,-5], "target": -8}'::jsonb, '[2,4]'::jsonb, true);
```

### Step 2: Run SQL

In Supabase SQL Editor:
1. Paste the SQL
2. Click "Run"
3. Verify the inserts succeeded

---

## Option 3: Using the Seed Script (Batch Insert)

If you have multiple problems ready, you can use the TypeScript seed script.

### Step 1: Add Problems to Seed Script

Edit `backend/src/scripts/seedProblems.ts` and add your problems to the `problems` array:

```typescript
const problems: Problem[] = [
  {
    title: "Two Sum",
    difficulty: "easy",
    description: "Given an array of integers...",
    examples: [...],
    constraints: [...],
    starterCode: {...},
    testCases: [...],
    tags: ["array", "hash-table"],
    category: "Arrays & Strings"
  },
  // Add more problems...
];
```

### Step 2: Run Seed Script

```bash
cd backend
npm run seed:problems
```

---

## Problem Format Reference

### Complete Example

```json
{
  "title": "Two Sum",
  "difficulty": "easy",
  "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ],
  "constraints": [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9"
  ],
  "starterCode": {
    "javascript": "function twoSum(nums, target) {\n  // Write your code here\n}",
    "python": "def two_sum(nums, target):\n    # Write your code here\n    pass",
    "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}",
    "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};"
  },
  "testCases": [
    {
      "input": {"nums": [2,7,11,15], "target": 9},
      "expectedOutput": [0,1],
      "isHidden": false
    },
    {
      "input": {"nums": [3,2,4], "target": 6},
      "expectedOutput": [1,2],
      "isHidden": true
    }
  ],
  "tags": ["array", "hash-table"],
  "category": "Arrays & Strings"
}
```

---

## Verification Queries

### Count problems by difficulty
```sql
SELECT difficulty, COUNT(*) 
FROM questions 
GROUP BY difficulty;
```

### List all problems with test case counts
```sql
SELECT 
  q.title,
  q.difficulty,
  q.category,
  COUNT(tc.id) as test_cases
FROM questions q
LEFT JOIN test_cases tc ON q.id = tc.question_id
GROUP BY q.id
ORDER BY q.created_at DESC;
```

### Get a specific problem with test cases
```sql
SELECT 
  q.*,
  json_agg(tc.*) as test_cases
FROM questions q
LEFT JOIN test_cases tc ON q.id = tc.question_id
WHERE q.title = 'Two Sum'
GROUP BY q.id;
```

---

## Tips

1. **Start with Easy problems** - They're simpler to test
2. **Test incrementally** - Add 1-2 problems, verify they work in the app
3. **Use consistent formatting** - Makes debugging easier
4. **Include edge cases** - Add test cases for edge conditions
5. **Balance visible/hidden** - 3-5 visible, 2-3 hidden per problem

---

## Troubleshooting

**Problem: JSONB format error**
- Ensure all JSON is valid
- Use single quotes for SQL strings, double quotes inside JSON
- Escape newlines in code: `\n`

**Problem: Foreign key constraint**
- Make sure `question_id` exists before inserting test cases
- Copy the exact UUID from the questions table

**Problem: Difficulty validation error**
- Only use: `easy`, `medium`, or `hard` (lowercase)

---

## Next Steps

After seeding problems:
1. Restart your backend server
2. Test problem fetching in the frontend
3. Verify problems display correctly in sessions
4. Check that test cases are properly linked
