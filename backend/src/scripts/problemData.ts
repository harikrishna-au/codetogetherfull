
export interface Example {
    input: string;
    output: string;
    explanation?: string;
}

export interface StarterCode {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
}

export interface TestCase {
    input: Record<string, any>;
    expectedOutput: any;
    isHidden: boolean;
}

export interface Problem {
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

export const problems: Problem[] = [
    // --- EASY (10 Problems) ---
    {
        title: "Two Sum",
        difficulty: "easy",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
        examples: [
            { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
            { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
        ],
        constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "One valid answer exists."],
        starterCode: {
            javascript: "function twoSum(nums, target) {\n    \n}",
            python: "def twoSum(nums, target):\n    pass",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};"
        },
        testCases: [
            { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1], isHidden: false },
            { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2], isHidden: false },
            { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1], isHidden: false },
            { input: { nums: [1, 2, 3, 4, 5], target: 9 }, expectedOutput: [3, 4], isHidden: true },
            { input: { nums: [100, 200, 300], target: 500 }, expectedOutput: [1, 2], isHidden: true }
        ],
        tags: ["Array", "Hash Table"],
        category: "Algorithms"
    },
    {
        title: "Reverse String",
        difficulty: "easy",
        description: "Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
        examples: [
            { input: "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]", output: "[\"o\",\"l\",\"l\",\"e\",\"h\"]" },
            { input: "s = [\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", output: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]" }
        ],
        constraints: ["1 <= s.length <= 10^5", "s[i] is a printable ascii character."],
        starterCode: {
            javascript: "function reverseString(s) {\n    \n}",
            python: "def reverseString(s):\n    pass",
            java: "class Solution {\n    public void reverseString(char[] s) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        \n    }\n};"
        },
        testCases: [
            { input: { s: ["h", "e", "l", "l", "o"] }, expectedOutput: ["o", "l", "l", "e", "h"], isHidden: false },
            { input: { s: ["H", "a", "n", "n", "a", "h"] }, expectedOutput: ["h", "a", "n", "n", "a", "H"], isHidden: false },
            { input: { s: ["A"] }, expectedOutput: ["A"], isHidden: true },
            { input: { s: ["a", "b"] }, expectedOutput: ["b", "a"], isHidden: true }
        ],
        tags: ["String", "Two Pointers"],
        category: "Algorithms"
    },
    {
        title: "Palindrome Number",
        difficulty: "easy",
        description: "Given an integer x, return true if x is a palindrome, and false otherwise.",
        examples: [
            { input: "x = 121", output: "true", explanation: "121 reads as 121 from left to right and from right to left." },
            { input: "x = -121", output: "false", explanation: "From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome." }
        ],
        constraints: ["-2^31 <= x <= 2^31 - 1"],
        starterCode: {
            javascript: "function isPalindrome(x) {\n    \n}",
            python: "def isPalindrome(x):\n    pass",
            java: "class Solution {\n    public boolean isPalindrome(int x) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    bool isPalindrome(int x) {\n        \n    }\n};"
        },
        testCases: [
            { input: { x: 121 }, expectedOutput: true, isHidden: false },
            { input: { x: -121 }, expectedOutput: false, isHidden: false },
            { input: { x: 10 }, expectedOutput: false, isHidden: false },
            { input: { x: 12321 }, expectedOutput: true, isHidden: true },
            { input: { x: 0 }, expectedOutput: true, isHidden: true }
        ],
        tags: ["Math"],
        category: "Algorithms"
    },
    {
        title: "Fizz Buzz",
        difficulty: "easy",
        description: "Given an integer n, return a string array answer (1-indexed) where:\n\nanswer[i] == \"FizzBuzz\" if i is divisible by 3 and 5.\nanswer[i] == \"Fizz\" if i is divisible by 3.\nanswer[i] == \"Buzz\" if i is divisible by 5.\nanswer[i] == i (as a string) if none of the above conditions are true.",
        examples: [
            { input: "n = 3", output: "[\"1\",\"2\",\"Fizz\"]" },
            { input: "n = 5", output: "[\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\"]" }
        ],
        constraints: ["1 <= n <= 10^4"],
        starterCode: {
            javascript: "function fizzBuzz(n) {\n    \n}",
            python: "def fizzBuzz(n):\n    pass",
            java: "class Solution {\n    public List<String> fizzBuzz(int n) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    vector<string> fizzBuzz(int n) {\n        \n    }\n};"
        },
        testCases: [
            { input: { n: 3 }, expectedOutput: ["1", "2", "Fizz"], isHidden: false },
            { input: { n: 5 }, expectedOutput: ["1", "2", "Fizz", "4", "Buzz"], isHidden: false },
            { input: { n: 15 }, expectedOutput: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"], isHidden: false },
            { input: { n: 1 }, expectedOutput: ["1"], isHidden: true }
        ],
        tags: ["Math", "String", "Simulation"],
        category: "Algorithms"
    },
    {
        title: "Valid Parentheses",
        difficulty: "easy", // Keeping it easy/medium border, listed as Easy here for balance
        description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
        examples: [
            { input: "s = \"()\"", output: "true" },
            { input: "s = \"()[]{}\"", output: "true" },
            { input: "s = \"(]\"", output: "false" }
        ],
        constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
        starterCode: {
            javascript: "function isValid(s) {\n    \n}",
            python: "def isValid(s):\n    pass",
            java: "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};"
        },
        testCases: [
            { input: { s: "()" }, expectedOutput: true, isHidden: false },
            { input: { s: "()[]{}" }, expectedOutput: true, isHidden: false },
            { input: { s: "(]" }, expectedOutput: false, isHidden: false },
            { input: { s: "([)]" }, expectedOutput: false, isHidden: true },
            { input: { s: "{[]}" }, expectedOutput: true, isHidden: true }
        ],
        tags: ["Stack", "String"],
        category: "Algorithms"
    },
    {
        title: "Missing Number",
        difficulty: "easy",
        description: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.",
        examples: [
            { input: "nums = [3,0,1]", output: "2", explanation: "n = 3 since there are 3 numbers, so all numbers are in the range [0,3]. 2 is the missing number in the range since it does not appear in nums." },
            { input: "nums = [0,1]", output: "2", explanation: "n = 2 since there are 2 numbers, so all numbers are in the range [0,2]. 2 is the missing number." }
        ],
        constraints: ["n == nums.length", "1 <= n <= 10^4", "0 <= nums[i] <= n", "All the numbers of nums are unique."],
        starterCode: {
            javascript: "function missingNumber(nums) {\n    \n}",
            python: "def missingNumber(nums):\n    pass",
            java: "class Solution {\n    public int missingNumber(int[] nums) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        \n    }\n};"
        },
        testCases: [
            { input: { nums: [3, 0, 1] }, expectedOutput: 2, isHidden: false },
            { input: { nums: [0, 1] }, expectedOutput: 2, isHidden: false },
            { input: { nums: [9, 6, 4, 2, 3, 5, 7, 0, 1] }, expectedOutput: 8, isHidden: false },
            { input: { nums: [0] }, expectedOutput: 1, isHidden: true }
        ],
        tags: ["Array", "Hash Table", "Math", "Bit Manipulation"],
        category: "Algorithms"
    },
    {
        title: "Single Number",
        difficulty: "easy",
        description: "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with a linear runtime complexity and use only constant extra space.",
        examples: [
            { input: "nums = [2,2,1]", output: "1" },
            { input: "nums = [4,1,2,1,2]", output: "4" }
        ],
        constraints: ["1 <= nums.length <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4", "Each element in the array appears twice except for one element which appears only once."],
        starterCode: {
            javascript: "function singleNumber(nums) {\n    \n}",
            python: "def singleNumber(nums):\n    pass",
            java: "class Solution {\n    public int singleNumber(int[] nums) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int singleNumber(vector<int>& nums) {\n        \n    }\n};"
        },
        testCases: [
            { input: { nums: [2, 2, 1] }, expectedOutput: 1, isHidden: false },
            { input: { nums: [4, 1, 2, 1, 2] }, expectedOutput: 4, isHidden: false },
            { input: { nums: [1] }, expectedOutput: 1, isHidden: false },
            { input: { nums: [0, 0, 1] }, expectedOutput: 1, isHidden: true }
        ],
        tags: ["Array", "Bit Manipulation"],
        category: "Algorithms"
    },
    {
        title: "Move Zeroes",
        difficulty: "easy",
        description: "Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements.\n\nNote that you must do this in-place without making a copy of the array.",
        examples: [
            { input: "nums = [0,1,0,3,12]", output: "[1,3,12,0,0]" },
            { input: "nums = [0]", output: "[0]" }
        ],
        constraints: ["1 <= nums.length <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
        starterCode: {
            javascript: "function moveZeroes(nums) {\n    \n}",
            python: "def moveZeroes(nums):\n    pass",
            java: "class Solution {\n    public void moveZeroes(int[] nums) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    void moveZeroes(vector<int>& nums) {\n        \n    }\n};"
        },
        testCases: [
            { input: { nums: [0, 1, 0, 3, 12] }, expectedOutput: [1, 3, 12, 0, 0], isHidden: false },
            { input: { nums: [0] }, expectedOutput: [0], isHidden: false },
            { input: { nums: [1, 2, 3] }, expectedOutput: [1, 2, 3], isHidden: true },
            { input: { nums: [0, 0, 1] }, expectedOutput: [1, 0, 0], isHidden: true }
        ],
        tags: ["Array", "Two Pointers"],
        category: "Algorithms"
    },
    {
        title: "Climbing Stairs",
        difficulty: "easy",
        description: "You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        examples: [
            { input: "n = 2", output: "2", explanation: "There are two ways to climb to the top.\n1. 1 step + 1 step\n2. 2 steps" },
            { input: "n = 3", output: "3", explanation: "There are three ways to climb to the top.\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step" }
        ],
        constraints: ["1 <= n <= 45"],
        starterCode: {
            javascript: "function climbStairs(n) {\n    \n}",
            python: "def climbStairs(n):\n    pass",
            java: "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};"
        },
        testCases: [
            { input: { n: 2 }, expectedOutput: 2, isHidden: false },
            { input: { n: 3 }, expectedOutput: 3, isHidden: false },
            { input: { n: 4 }, expectedOutput: 5, isHidden: true },
            { input: { n: 1 }, expectedOutput: 1, isHidden: true },
            { input: { n: 5 }, expectedOutput: 8, isHidden: true }
        ],
        tags: ["Math", "Dynamic Programming", "Memoization"],
        category: "Algorithms"
    },
    {
        title: "Best Time to Buy and Sell Stock",
        difficulty: "easy",
        description: "You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
        examples: [
            { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.\nNote that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell." },
            { input: "prices = [7,6,4,3,1]", output: "0", explanation: "In this case, no transactions are done and the max profit = 0." }
        ],
        constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
        starterCode: {
            javascript: "function maxProfit(prices) {\n    \n}",
            python: "def maxProfit(prices):\n    pass",
            java: "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};"
        },
        testCases: [
            { input: { prices: [7, 1, 5, 3, 6, 4] }, expectedOutput: 5, isHidden: false },
            { input: { prices: [7, 6, 4, 3, 1] }, expectedOutput: 0, isHidden: false },
            { input: { prices: [2, 4, 1] }, expectedOutput: 2, isHidden: true },
            { input: { prices: [3, 2, 6, 5, 0, 3] }, expectedOutput: 4, isHidden: true }
        ],
        tags: ["Array", "Dynamic Programming"],
        category: "Algorithms"
    },

    // --- MEDIUM (10 Problems) ---
    {
        title: "Add Two Numbers",
        difficulty: "medium",
        description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\nYou may assume the two numbers do not contain any leading zero, except the number 0 itself.",
        examples: [
            { input: "l1 = [2,4,3], l2 = [5,6,4]", output: "[7,0,8]", explanation: "342 + 465 = 807." },
            { input: "l1 = [0], l2 = [0]", output: "[0]" }
        ],
        constraints: ["The number of nodes in each linked list is in the range [1, 100].", "0 <= Node.val <= 9", "It is guaranteed that the list represents a number that does not have leading zeros."],
        starterCode: {
            javascript: "function addTwoNumbers(l1, l2) {\n    \n}",
            python: "def addTwoNumbers(l1, l2):\n    pass",
            java: "class Solution {\n    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {\n        \n    }\n};"
        },
        testCases: [
            { input: { l1: [2, 4, 3], l2: [5, 6, 4] }, expectedOutput: [7, 0, 8], isHidden: false },
            { input: { l1: [0], l2: [0] }, expectedOutput: [0], isHidden: false },
            { input: { l1: [9, 9, 9, 9, 9, 9, 9], l2: [9, 9, 9, 9] }, expectedOutput: [8, 9, 9, 9, 0, 0, 0, 1], isHidden: false },
            { input: { l1: [2, 4, 9], l2: [5, 6, 4, 9] }, expectedOutput: [7, 0, 4, 0, 1], isHidden: true }
        ],
        tags: ["Linked List", "Math", "Recursion"],
        category: "Algorithms"
    },
    {
        title: "Longest Substring Without Repeating Characters",
        difficulty: "medium",
        description: "Given a string s, find the length of the longest substring without repeating characters.",
        examples: [
            { input: "s = \"abcabcbb\"", output: "3", explanation: "The answer is \"abc\", with the length of 3." },
            { input: "s = \"bbbbb\"", output: "1", explanation: "The answer is \"b\", with the length of 1." }
        ],
        constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
        starterCode: {
            javascript: "function lengthOfLongestSubstring(s) {\n    \n}",
            python: "def lengthOfLongestSubstring(s):\n    pass",
            java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};"
        },
        testCases: [
            { input: { s: "abcabcbb" }, expectedOutput: 3, isHidden: false },
            { input: { s: "bbbbb" }, expectedOutput: 1, isHidden: false },
            { input: { s: "pwwkew" }, expectedOutput: 3, isHidden: false },
            { input: { s: "" }, expectedOutput: 0, isHidden: true },
            { input: { s: "au" }, expectedOutput: 2, isHidden: true }
        ],
        tags: ["Hash Table", "String", "Sliding Window"],
        category: "Algorithms"
    },
    {
        title: "Container With Most Water",
        difficulty: "medium",
        description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
        examples: [
            { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49." },
            { input: "height = [1,1]", output: "1" }
        ],
        constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
        starterCode: {
            javascript: "function maxArea(height) {\n    \n}",
            python: "def maxArea(height):\n    pass",
            java: "class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};"
        },
        testCases: [
            { input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, expectedOutput: 49, isHidden: false },
            { input: { height: [1, 1] }, expectedOutput: 1, isHidden: false },
            { input: { height: [4, 3, 2, 1, 4] }, expectedOutput: 16, isHidden: true },
            { input: { height: [1, 2, 1] }, expectedOutput: 2, isHidden: true }
        ],
        tags: ["Array", "Two Pointers", "Greedy"],
        category: "Algorithms"
    },
    {
        title: "Group Anagrams",
        difficulty: "medium",
        description: "Given an array of strings strs, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
        examples: [
            { input: "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", output: "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]" },
            { input: "strs = [\"\"]", output: "[[\"\"]]" }
        ],
        constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters."],
        starterCode: {
            javascript: "function groupAnagrams(strs) {\n    \n}",
            python: "def groupAnagrams(strs):\n    pass",
            java: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};"
        },
        testCases: [
            { input: { strs: ["eat", "tea", "tan", "ate", "nat", "bat"] }, expectedOutput: [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]], isHidden: false },
            { input: { strs: [""] }, expectedOutput: [[""]], isHidden: false },
            { input: { strs: ["a"] }, expectedOutput: [["a"]], isHidden: false },
            { input: { strs: ["cab", "tin", "pew", "duh", "may", "ill", "buy", "bar", "max", "doc"] }, expectedOutput: [["doc"], ["bar"], ["buy"], ["ill"], ["may"], ["duh"], ["pew"], ["tin"], ["cab"], ["max"]], isHidden: true }
        ],
        tags: ["Hash Table", "String", "Sorting"],
        category: "Algorithms"
    },
    {
        title: "Maximum Subarray",
        difficulty: "medium",
        description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
        examples: [
            { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
            { input: "nums = [1]", output: "1", explanation: "The subarray [1] has the largest sum 1." }
        ],
        constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
        starterCode: {
            javascript: "function maxSubArray(nums) {\n    \n}",
            python: "def maxSubArray(nums):\n    pass",
            java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};"
        },
        testCases: [
            { input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expectedOutput: 6, isHidden: false },
            { input: { nums: [1] }, expectedOutput: 1, isHidden: false },
            { input: { nums: [5, 4, -1, 7, 8] }, expectedOutput: 23, isHidden: false },
            { input: { nums: [-1] }, expectedOutput: -1, isHidden: true }
        ],
        tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
        category: "Algorithms"
    },
    {
        title: "Jump Game",
        difficulty: "medium",
        description: "You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\nReturn true if you can reach the last index, or false otherwise.",
        examples: [
            { input: "nums = [2,3,1,1,4]", output: "true", explanation: "Jump 1 step from index 0 to 1, then 3 steps to the last index." },
            { input: "nums = [3,2,1,0,4]", output: "false", explanation: "You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index." }
        ],
        constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^5"],
        starterCode: {
            javascript: "function canJump(nums) {\n    \n}",
            python: "def canJump(nums):\n    pass",
            java: "class Solution {\n    public boolean canJump(int[] nums) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        \n    }\n};"
        },
        testCases: [
            { input: { nums: [2, 3, 1, 1, 4] }, expectedOutput: true, isHidden: false },
            { input: { nums: [3, 2, 1, 0, 4] }, expectedOutput: false, isHidden: false },
            { input: { nums: [0] }, expectedOutput: true, isHidden: true },
            { input: { nums: [2, 0, 0] }, expectedOutput: true, isHidden: true }
        ],
        tags: ["Array", "Dynamic Programming", "Greedy"],
        category: "Algorithms"
    },
    {
        title: "Merge Intervals",
        difficulty: "medium",
        description: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
        examples: [
            { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since [1,3] and [2,6] overlap, merge them into [1,6]." },
            { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]", explanation: "Intervals [1,4] and [4,5] are considered overlapping." }
        ],
        constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= starti <= endi <= 10^4"],
        starterCode: {
            javascript: "function merge(intervals) {\n    \n}",
            python: "def merge(intervals):\n    pass",
            java: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};"
        },
        testCases: [
            { input: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] }, expectedOutput: [[1, 6], [8, 10], [15, 18]], isHidden: false },
            { input: { intervals: [[1, 4], [4, 5]] }, expectedOutput: [[1, 5]], isHidden: false },
            { input: { intervals: [[1, 4], [0, 4]] }, expectedOutput: [[0, 4]], isHidden: true },
            { input: { intervals: [[1, 4], [2, 3]] }, expectedOutput: [[1, 4]], isHidden: true }
        ],
        tags: ["Array", "Sorting"],
        category: "Algorithms"
    },
    {
        title: "Rotate Image",
        difficulty: "medium",
        description: "You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise).\n\nYou have to rotate the image in-place, which means you have to modify the input 2D matrix directly. DO NOT allocate another 2D matrix and do the rotation.",
        examples: [
            { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[[7,4,1],[8,5,2],[9,6,3]]" },
            { input: "matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]", output: "[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]" }
        ],
        constraints: ["n == matrix.length == matrix[i].length", "1 <= n <= 20", "-1000 <= matrix[i][j] <= 1000"],
        starterCode: {
            javascript: "function rotate(matrix) {\n    \n}",
            python: "def rotate(matrix):\n    pass",
            java: "class Solution {\n    public void rotate(int[][] matrix) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    void rotate(vector<vector<int>>& matrix) {\n        \n    }\n};"
        },
        testCases: [
            { input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, expectedOutput: [[7, 4, 1], [8, 5, 2], [9, 6, 3]], isHidden: false },
            { input: { matrix: [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]] }, expectedOutput: [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]], isHidden: false },
            { input: { matrix: [[1]] }, expectedOutput: [[1]], isHidden: true }
        ],
        tags: ["Array", "Math", "Matrix"],
        category: "Algorithms"
    },
    {
        title: "Find First and Last Position of Element in Sorted Array",
        difficulty: "medium",
        description: "Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a given target value.\n\nIf target is not found in the array, return [-1, -1].\n\nYou must write an algorithm with O(log n) runtime complexity.",
        examples: [
            { input: "nums = [5,7,7,8,8,10], target = 8", output: "[3,4]" },
            { input: "nums = [5,7,7,8,8,10], target = 6", output: "[-1,-1]" }
        ],
        constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9", "nums is a non-decreasing array.", "-10^9 <= target <= 10^9"],
        starterCode: {
            javascript: "function searchRange(nums, target) {\n    \n}",
            python: "def searchRange(nums, target):\n    pass",
            java: "class Solution {\n    public int[] searchRange(int[] nums, int target) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    vector<int> searchRange(vector<int>& nums, int target) {\n        \n    }\n};"
        },
        testCases: [
            { input: { nums: [5, 7, 7, 8, 8, 10], target: 8 }, expectedOutput: [3, 4], isHidden: false },
            { input: { nums: [5, 7, 7, 8, 8, 10], target: 6 }, expectedOutput: [-1, -1], isHidden: false },
            { input: { nums: [], target: 0 }, expectedOutput: [-1, -1], isHidden: false },
            { input: { nums: [1], target: 1 }, expectedOutput: [0, 0], isHidden: true }
        ],
        tags: ["Array", "Binary Search"],
        category: "Algorithms"
    },
    {
        title: "Generate Parentheses",
        difficulty: "medium",
        description: "Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.",
        examples: [
            { input: "n = 3", output: "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]" },
            { input: "n = 1", output: "[\"()\"]" }
        ],
        constraints: ["1 <= n <= 8"],
        starterCode: {
            javascript: "function generateParenthesis(n) {\n    \n}",
            python: "def generateParenthesis(n):\n    pass",
            java: "class Solution {\n    public List<String> generateParenthesis(int n) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    vector<string> generateParenthesis(int n) {\n        \n    }\n};"
        },
        testCases: [
            { input: { n: 3 }, expectedOutput: ["((()))", "(()())", "(())()", "()(())", "()()()"], isHidden: false },
            { input: { n: 1 }, expectedOutput: ["()"], isHidden: false },
            { input: { n: 2 }, expectedOutput: ["(())", "()()"], isHidden: true }
        ],
        tags: ["String", "Dynamic Programming", "Backtracking"],
        category: "Algorithms"
    },

    // --- HARD (5 Problems) ---
    {
        title: "Median of Two Sorted Arrays",
        difficulty: "hard",
        description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).",
        examples: [
            { input: "nums1 = [1,3], nums2 = [2]", output: "2.00000", explanation: "merged array = [1,2,3] and median is 2." },
            { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.50000", explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5." }
        ],
        constraints: ["nums1.length == m", "nums2.length == n", "0 <= m <= 1000", "0 <= n <= 1000", "1 <= m + n <= 2000", "-10^6 <= nums1[i], nums2[i] <= 10^6"],
        starterCode: {
            javascript: "function findMedianSortedArrays(nums1, nums2) {\n    \n}",
            python: "def findMedianSortedArrays(nums1, nums2):\n    pass",
            java: "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};"
        },
        testCases: [
            { input: { nums1: [1, 3], nums2: [2] }, expectedOutput: 2.0, isHidden: false },
            { input: { nums1: [1, 2], nums2: [3, 4] }, expectedOutput: 2.5, isHidden: false },
            { input: { nums1: [0, 0], nums2: [0, 0] }, expectedOutput: 0.0, isHidden: true },
            { input: { nums1: [], nums2: [1] }, expectedOutput: 1.0, isHidden: true }
        ],
        tags: ["Array", "Binary Search", "Divide and Conquer"],
        category: "Algorithms"
    },
    {
        title: "Trapping Rain Water",
        difficulty: "hard",
        description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
        examples: [
            { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water (blue section) are being trapped." },
            { input: "height = [4,2,0,3,2,5]", output: "9" }
        ],
        constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
        starterCode: {
            javascript: "function trap(height) {\n    \n}",
            python: "def trap(height):\n    pass",
            java: "class Solution {\n    public int trap(int[] height) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};"
        },
        testCases: [
            { input: { height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] }, expectedOutput: 6, isHidden: false },
            { input: { height: [4, 2, 0, 3, 2, 5] }, expectedOutput: 9, isHidden: false },
            { input: { height: [4, 2, 3] }, expectedOutput: 1, isHidden: true },
            { input: { height: [5, 4, 1, 2] }, expectedOutput: 1, isHidden: true }
        ],
        tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
        category: "Algorithms"
    },
    {
        title: "Merge k Sorted Lists",
        difficulty: "hard",
        description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.",
        examples: [
            { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" },
            { input: "lists = []", output: "[]" }
        ],
        constraints: ["k == lists.length", "0 <= k <= 10^4", "0 <= lists[i].length <= 500", "-10^4 <= lists[i][j] <= 10^4", "lists[i] is sorted in ascending order."],
        starterCode: {
            javascript: "function mergeKLists(lists) {\n    \n}",
            python: "def mergeKLists(lists):\n    pass",
            java: "class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        \n    }\n};"
        },
        testCases: [
            { input: { lists: [[1, 4, 5], [1, 3, 4], [2, 6]] }, expectedOutput: [1, 1, 2, 3, 4, 4, 5, 6], isHidden: false },
            { input: { lists: [] }, expectedOutput: [], isHidden: false },
            { input: { lists: [[]] }, expectedOutput: [], isHidden: true }
        ],
        tags: ["Linked List", "Divide and Conquer", "Heap"],
        category: "Algorithms"
    },
    {
        title: "Longest Valid Parentheses",
        difficulty: "hard",
        description: "Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.",
        examples: [
            { input: "s = \"(()\"", output: "2", explanation: "The longest valid parentheses substring is \"()\"." },
            { input: "s = \")()())\"", output: "4", explanation: "The longest valid parentheses substring is \"()()\"." }
        ],
        constraints: ["0 <= s.length <= 3 * 10^4", "s[i] is '(', or ')'."],
        starterCode: {
            javascript: "function longestValidParentheses(s) {\n    \n}",
            python: "def longestValidParentheses(s):\n    pass",
            java: "class Solution {\n    public int longestValidParentheses(String s) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int longestValidParentheses(string s) {\n        \n    }\n};"
        },
        testCases: [
            { input: { s: "(()" }, expectedOutput: 2, isHidden: false },
            { input: { s: ")()())" }, expectedOutput: 4, isHidden: false },
            { input: { s: "" }, expectedOutput: 0, isHidden: false },
            { input: { s: "()(()" }, expectedOutput: 2, isHidden: true }
        ],
        tags: ["String", "Dynamic Programming", "Stack"],
        category: "Algorithms"
    },
    {
        title: "Edit Distance",
        difficulty: "hard",
        description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\n\nYou have the following three operations permitted on a word:\n\nInsert a character\nDelete a character\nReplace a character",
        examples: [
            { input: "word1 = \"horse\", word2 = \"ros\"", output: "3", explanation: "horse -> rorse (replace 'h' with 'r')\nrorse -> rose (remove 'r')\nrose -> ros (remove 'e')" },
            { input: "word1 = \"intention\", word2 = \"execution\"", output: "5" }
        ],
        constraints: ["0 <= word1.length, word2.length <= 500", "word1 and word2 consist of lowercase English letters."],
        starterCode: {
            javascript: "function minDistance(word1, word2) {\n    \n}",
            python: "def minDistance(word1, word2):\n    pass",
            java: "class Solution {\n    public int minDistance(String word1, String word2) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        \n    }\n};"
        },
        testCases: [
            { input: { word1: "horse", word2: "ros" }, expectedOutput: 3, isHidden: false },
            { input: { word1: "intention", word2: "execution" }, expectedOutput: 5, isHidden: false },
            { input: { word1: "a", word2: "a" }, expectedOutput: 0, isHidden: true },
            { input: { word1: "", word2: "a" }, expectedOutput: 1, isHidden: true }
        ],
        tags: ["String", "Dynamic Programming"],
        category: "Algorithms"
    }
];
