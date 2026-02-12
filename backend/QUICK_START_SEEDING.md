# Quick Start: Seeding Problems

## Step 1: Run the Migration

First, apply the database schema:

```bash
# Option A: If using Supabase CLI
supabase db push

# Option B: If using direct SQL
# Go to Supabase Dashboard → SQL Editor → Paste the contents of supabase_migration.sql → Run
```

## Step 2: Verify Tables Exist

In Supabase Dashboard → Table Editor, you should see:
- ✅ `questions` table
- ✅ `test_cases` table

## Step 3: Add Your First Problem

### Via Supabase Dashboard (Easiest)

1. Go to **Table Editor** → Select `questions`
2. Click **Insert** → **Insert row**
3. Fill in the fields (see example below)
4. Click **Save**
5. **Copy the generated UUID** from the `id` column
6. Go to `test_cases` table
7. Insert test cases using the copied UUID as `question_id`

### Example Problem Data

**For `questions` table:**

```
title: Two Sum
description: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
difficulty: easy
examples: [{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."}]
constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists."]
starter_code: {"javascript": "function twoSum(nums, target) {\n  // Write your code here\n  \n}", "python": "def two_sum(nums, target):\n    # Write your code here\n    pass", "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        \n    }\n}", "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};"}
tags: {array,hash-table}
category: Arrays & Strings
```

**For `test_cases` table (repeat for each test case):**

```
question_id: <paste UUID from questions table>
input: {"nums": [2,7,11,15], "target": 9}
expected_output: [0,1]
is_hidden: false
```

## Step 4: Verify

Run this in SQL Editor:

```sql
SELECT 
  q.title,
  q.difficulty,
  COUNT(tc.id) as test_cases
FROM questions q
LEFT JOIN test_cases tc ON q.id = tc.question_id
GROUP BY q.id
ORDER BY q.created_at DESC;
```

You should see your problem with test case count!

## Step 5: Test in App

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Join a coding session
4. Your problem should load! 🎉

---

## Need More Help?

See the full [SEEDING_GUIDE.md](./SEEDING_GUIDE.md) for:
- Multiple seeding methods
- SQL examples
- Batch seeding with TypeScript
- Troubleshooting tips
- Complete problem format reference

---

## Problem Format Template

Use this template when adding problems:

```json
{
  "title": "Problem Name",
  "difficulty": "easy|medium|hard",
  "description": "Full problem description...",
  "examples": [
    {
      "input": "input description",
      "output": "output description",
      "explanation": "optional explanation"
    }
  ],
  "constraints": [
    "constraint 1",
    "constraint 2"
  ],
  "starterCode": {
    "javascript": "function solution() {\n  // code\n}",
    "python": "def solution():\n    pass",
    "java": "class Solution {\n    // code\n}",
    "cpp": "class Solution {\npublic:\n    // code\n};"
  },
  "testCases": [
    {
      "input": {"param1": "value"},
      "expectedOutput": "expected result",
      "isHidden": false
    }
  ],
  "tags": ["tag1", "tag2"],
  "category": "Category Name"
}
```
