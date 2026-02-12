---
name: 🟡 Build Problem Database
about: Feature - Create comprehensive coding problem library
title: '🟡 Build Problem Database'
labels: enhancement, backend, content
assignees: ''
---

## Priority: Medium

### Description
Currently the app has very limited problems (falls back to "Two Sum"). Need to build a comprehensive problem database with variety.

### Current State
- ✅ Problem fetching mechanism via Socket.IO
- ✅ Problem display UI with examples/constraints
- ❌ Limited problem set (only fallback problem)
- ❌ No problem categorization
- ❌ No difficulty algorithm
- ❌ No problem management system

### What Needs to Be Done

#### Database Schema
Create Supabase tables for:
1. **problems** table
   - id, title, description, difficulty
   - examples (JSON), constraints (JSON)
   - test_cases (JSON), solution_template
   - tags, category, acceptance_rate
   - created_at, updated_at

2. **problem_tags** table
   - id, name, description

3. **user_solutions** table
   - id, user_id, problem_id, code, language
   - status (solved/attempted), time_taken
   - created_at

#### Problem Categories
- Arrays & Strings
- Hash Tables
- Linked Lists
- Trees & Graphs
- Dynamic Programming
- Sorting & Searching
- Recursion & Backtracking
- Math & Logic
- System Design (for advanced)

#### Initial Problem Set (50-100 problems)

**Easy (30 problems)**
- Two Sum
- Reverse String
- Palindrome Check
- FizzBuzz
- Valid Parentheses
- Maximum Subarray
- Merge Sorted Arrays
- Remove Duplicates
- etc.

**Medium (40 problems)**
- Add Two Numbers (Linked List)
- Longest Substring Without Repeating
- Container With Most Water
- 3Sum
- Binary Tree Level Order Traversal
- etc.

**Hard (20 problems)**
- Median of Two Sorted Arrays
- Trapping Rain Water
- Word Ladder
- etc.

### Implementation Steps
1. Create Supabase migration for problem tables
2. Write seed script to populate initial problems
3. Add problem selection algorithm (random by difficulty)
4. Create admin panel for problem management
5. Add problem search/filter API
6. Implement problem tagging system
7. Add user solution tracking

### Problem Format
```typescript
interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  testCases: Array<{
    input: any;
    expectedOutput: any;
    hidden?: boolean;
  }>;
  solutionTemplate: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
  };
  tags: string[];
  category: string;
}
```

### Acceptance Criteria
- [ ] Database schema created and migrated
- [ ] At least 50 problems seeded
- [ ] Problems categorized by difficulty
- [ ] Problems tagged appropriately
- [ ] Random problem selection works
- [ ] Test cases included for each problem
- [ ] Solution templates for all languages
- [ ] Admin panel for problem CRUD

### Resources
- LeetCode for problem inspiration
- HackerRank problem sets
- Codewars kata library

### Estimated Effort
2-3 weeks (including content creation)
