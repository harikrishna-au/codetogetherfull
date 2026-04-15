import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Question } from '../models/Question.js';
import { logger } from '../utils/logger.js';
const sampleQuestions = [
    {
        questionId: 'q1',
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        difficulty: 'Easy',
        examples: [
            {
                input: 'nums = [2,7,11,15], target = 9',
                output: '[0,1]',
                explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
            },
            {
                input: 'nums = [3,2,4], target = 6',
                output: '[1,2]',
            },
            {
                input: 'nums = [3,3], target = 6',
                output: '[0,1]',
            },
        ],
        constraints: [
            '2 ≤ nums.length ≤ 10⁴',
            '-10⁹ ≤ nums[i] ≤ 10⁹',
            '-10⁹ ≤ target ≤ 10⁹',
            'Only one valid answer exists.',
        ],
        tags: ['Array', 'Hash Table'],
        hints: [
            'A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it\'s best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.',
            'So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?',
            'The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?',
        ],
        starterCode: {
            javascript: 'function twoSum(nums, target) {\n    // Write your solution here\n}',
            python: 'def two_sum(nums, target):\n    # Write your solution here\n    pass',
            java: 'public int[] twoSum(int[] nums, int target) {\n    // Write your solution here\n}',
            cpp: 'vector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n}',
        },
        compileTestCases: [
            {
                input: { nums: [2, 7, 11, 15], target: 9 },
                output: '[0,1]',
            },
            {
                input: { nums: [3, 2, 4], target: 6 },
                output: '[1,2]',
            },
        ],
        majorTestCases: [
            {
                input: { nums: [2, 7, 11, 15], target: 9 },
                output: '[0,1]',
            },
            {
                input: { nums: [3, 2, 4], target: 6 },
                output: '[1,2]',
            },
            {
                input: { nums: [3, 3], target: 6 },
                output: '[0,1]',
            },
        ],
    },
    {
        questionId: 'q2',
        title: 'Add Two Numbers',
        description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\nYou may assume the two numbers do not contain any leading zero, except the number 0 itself.',
        difficulty: 'Medium',
        examples: [
            {
                input: 'l1 = [2,4,3], l2 = [5,6,4]',
                output: '[7,0,8]',
                explanation: '342 + 465 = 807.',
            },
            {
                input: 'l1 = [0], l2 = [0]',
                output: '[0]',
            },
            {
                input: 'l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]',
                output: '[8,9,9,9,0,0,0,1]',
            },
        ],
        constraints: [
            'The number of nodes in each linked list is in the range [1, 100].',
            '0 ≤ Node.val ≤ 9',
            'It is guaranteed that the list represents a number that does not have leading zeros.',
        ],
        tags: ['Linked List', 'Math', 'Recursion'],
        hints: [
            'Think about how you would add two numbers on paper. You start from the least significant digit.',
            'Since the digits are stored in reverse order, you can start from the head of both linked lists.',
            'Don\'t forget to handle the carry over.',
        ],
        starterCode: {
            javascript: 'function addTwoNumbers(l1, l2) {\n    // Write your solution here\n}',
            python: 'def add_two_numbers(l1, l2):\n    # Write your solution here\n    pass',
            java: 'public ListNode addTwoNumbers(ListNode l1, ListNode l2) {\n    // Write your solution here\n}',
            cpp: 'ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {\n    // Write your solution here\n}',
        },
        compileTestCases: [
            {
                input: { l1: [2, 4, 3], l2: [5, 6, 4] },
                output: '[7,0,8]',
            },
        ],
        majorTestCases: [
            {
                input: { l1: [2, 4, 3], l2: [5, 6, 4] },
                output: '[7,0,8]',
            },
            {
                input: { l1: [0], l2: [0] },
                output: '[0]',
            },
            {
                input: { l1: [9, 9, 9, 9, 9, 9, 9], l2: [9, 9, 9, 9] },
                output: '[8,9,9,9,0,0,0,1]',
            },
        ],
    },
    {
        questionId: 'q3',
        title: 'Median of Two Sorted Arrays',
        description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).',
        difficulty: 'Hard',
        examples: [
            {
                input: 'nums1 = [1,3], nums2 = [2]',
                output: '2.00000',
                explanation: 'merged array = [1,2,3] and median is 2.',
            },
            {
                input: 'nums1 = [1,2], nums2 = [3,4]',
                output: '2.50000',
                explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.',
            },
        ],
        constraints: [
            'nums1.length == m',
            'nums2.length == n',
            '0 ≤ m ≤ 1000',
            '0 ≤ n ≤ 1000',
            '1 ≤ m + n ≤ 2000',
            '-10⁶ ≤ nums1[i], nums2[i] ≤ 10⁶',
        ],
        tags: ['Array', 'Binary Search', 'Divide and Conquer'],
        hints: [
            'To solve this problem, we need to understand what a median is. A median is the middle value in an ordered integer list.',
            'If we can ensure that the left half contains the same number of elements as the right half, we can locate the median.',
            'We can use binary search to find the correct partition.',
        ],
        starterCode: {
            javascript: 'function findMedianSortedArrays(nums1, nums2) {\n    // Write your solution here\n}',
            python: 'def find_median_sorted_arrays(nums1, nums2):\n    # Write your solution here\n    pass',
            java: 'public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n    // Write your solution here\n}',
            cpp: 'double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n    // Write your solution here\n}',
        },
        compileTestCases: [
            {
                input: { nums1: [1, 3], nums2: [2] },
                output: '2.00000',
            },
        ],
        majorTestCases: [
            {
                input: { nums1: [1, 3], nums2: [2] },
                output: '2.00000',
            },
            {
                input: { nums1: [1, 2], nums2: [3, 4] },
                output: '2.50000',
            },
        ],
    },
];
export const seedDatabase = async () => {
    try {
        logger.info('🌱 Starting database seeding...');
        await connectDatabase();
        await Question.deleteMany({});
        logger.info('Cleared existing questions');
        await Question.insertMany(sampleQuestions);
        logger.info(`✅ Inserted ${sampleQuestions.length} sample questions`);
        logger.info('🌱 Database seeding completed successfully');
    }
    catch (error) {
        logger.error('❌ Database seeding failed:', error);
        throw error;
    }
};
if (import.meta.url === `file://${process.argv[1]}`) {
    seedDatabase()
        .then(() => {
        logger.info('Seeding completed, disconnecting...');
        return disconnectDatabase();
    })
        .then(() => {
        process.exit(0);
    })
        .catch((error) => {
        logger.error('Seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seedDatabase.js.map