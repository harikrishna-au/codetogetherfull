import express from 'express';
import Question from '../models/Question.js';

const router = express.Router();

// Initialize sample questions in database
async function initializeSampleQuestions() {
  try {
    const count = await Question.countDocuments();
    if (count === 0) {
      const sampleQuestions = [
        {
          questionId: 'q1',
          title: 'Two Sum',
          difficulty: 'easy',
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          examples: [
            {
              input: 'nums = [2,7,11,15], target = 9',
              output: '[0,1]',
              explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
            }
          ],
          constraints: [
            '2 <= nums.length <= 10^4',
            '-10^9 <= nums[i] <= 10^9',
            '-10^9 <= target <= 10^9',
            'Only one valid answer exists.'
          ],
          tags: ['Array', 'Hash Table'],
          hints: [
            'A really brute force way would be to search for all possible pairs of numbers but that would be too slow.',
            'Use a hash map to store the complement of each number.'
          ],
          starterCode: {
            javascript: 'function twoSum(nums, target) {\n    // Your code here\n}',
            python: 'def two_sum(nums, target):\n    # Your code here\n    pass',
            java: 'public int[] twoSum(int[] nums, int target) {\n    // Your code here\n}'
          },
          testCases: [
            { input: { nums: [2, 7, 11, 15], target: 9 }, output: '[0,1]' },
            { input: { nums: [3, 2, 4], target: 6 }, output: '[1,2]' },
            { input: { nums: [3, 3], target: 6 }, output: '[0,1]' }
          ]
        },
        {
          questionId: 'q2',
          title: 'Valid Parentheses',
          difficulty: 'easy',
          description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
          examples: [
            {
              input: 's = "()"',
              output: 'true'
            },
            {
              input: 's = "()[]{}"',
              output: 'true'
            },
            {
              input: 's = "(]"',
              output: 'false'
            }
          ],
          constraints: [
            '1 <= s.length <= 10^4',
            's consists of parentheses only \'()[]{}\''
          ],
          tags: ['String', 'Stack'],
          hints: [
            'Use a stack to keep track of opening brackets.',
            'When you encounter a closing bracket, check if it matches the most recent opening bracket.'
          ],
          starterCode: {
            javascript: 'function isValid(s) {\n    // Your code here\n}',
            python: 'def is_valid(s):\n    # Your code here\n    pass',
            java: 'public boolean isValid(String s) {\n    // Your code here\n}'
          },
          testCases: [
            { input: { s: "()" }, output: 'true' },
            { input: { s: "()[]{}" }, output: 'true' },
            { input: { s: "(]" }, output: 'false' }
          ]
        }
      ];
      
      await Question.insertMany(sampleQuestions);
      console.log('✅ Sample questions initialized in database');
    }
  } catch (error) {
    console.error('❌ Failed to initialize sample questions:', error);
  }
}

// Initialize questions on module load
initializeSampleQuestions();

// Get all questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find({ isActive: true }).lean();
    res.json({ success: true, questions });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get question by ID
router.get('/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findOne({ questionId, isActive: true }).lean();
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json({ success: true, question });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// Get random question by difficulty
router.get('/random/:difficulty', async (req, res) => {
  try {
    const { difficulty } = req.params;
    const questions = await Question.find({ difficulty, isActive: true }).lean();
    
    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this difficulty' });
    }
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    res.json({ success: true, question: randomQuestion });
  } catch (error) {
    console.error('Get random question error:', error);
    res.status(500).json({ error: 'Failed to fetch random question' });
  }
});

// Add new question
router.post('/', async (req, res) => {
  try {
    const questionData = req.body;
    
    // Generate ID if not provided
    if (!questionData.questionId) {
      const count = await Question.countDocuments();
      questionData.questionId = `q${count + 1}`;
    }
    
    // Check if question ID already exists
    const existing = await Question.findOne({ questionId: questionData.questionId });
    if (existing) {
      return res.status(400).json({ error: 'Question ID already exists' });
    }
    
    const newQuestion = new Question(questionData);
    await newQuestion.save();
    
    res.status(201).json({ success: true, question: newQuestion.toObject() });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Update question
router.put('/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const updates = req.body;
    
    const question = await Question.findOneAndUpdate(
      { questionId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json({ success: true, question: question.toObject() });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
router.delete('/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findOneAndUpdate(
      { questionId },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json({ success: true, deletedQuestion: question.toObject() });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Get questions count
router.get('/count', async (req, res) => {
  try {
    const count = await Question.countDocuments({ isActive: true });
    res.json({ success: true, totalQuestions: count });
  } catch (error) {
    console.error('Get questions count error:', error);
    res.status(500).json({ error: 'Failed to get questions count' });
  }
});

// Initialize sample questions
router.post('/initialize', async (req, res) => {
  try {
    await initializeSampleQuestions();
    const count = await Question.countDocuments({ isActive: true });
    res.json({ success: true, totalQuestions: count });
  } catch (error) {
    console.error('Initialize questions error:', error);
    res.status(500).json({ error: 'Failed to initialize questions' });
  }
});

export default router;
