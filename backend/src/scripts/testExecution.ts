
import axios from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:4000/api/execute';
const QUESTION_ID = 'f022a438-7e08-4fc9-8831-a32ff08e43b7'; // Two Sum ID from seed

async function testExecution() {
    console.log('🚀 Starting Code Execution Verification\n');

    const testCases = [
        {
            lang: 'javascript',
            name: 'JS: Two Sum (Correct)',
            code: `
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`
        },
        {
            lang: 'python',
            name: 'Python: Two Sum (Correct)',
            code: `
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums): # Correcting to match 'twoSum'
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`
        },
        {
            lang: 'java',
            name: 'Java: Two Sum (Correct)',
            code: `
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`
        },
        {
            lang: 'cpp',
            name: 'C++: Two Sum (Correct)',
            code: `
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (map.count(complement)) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}`
        },
        {
            lang: 'javascript',
            name: 'JS: Infinite Loop (Timeout)',
            code: `
function twoSum(nums, target) {
    while(true) {}
}`
        },
        {
            lang: 'javascript',
            name: 'JS: Syntax Error',
            code: `
function twoSum(nums, target) {
    return [
}`
        }
    ];

    let successCount = 0;

    for (const test of testCases) {
        console.log(`Testing ${test.name}...`);
        try {
            const start = Date.now();
            const res = await axios.post(API_URL, {
                questionId: QUESTION_ID,
                language: test.lang,
                code: test.code
            });
            const duration = Date.now() - start;

            const results = res.data.results;
            const allPassed = results.results.every((r: any) => r.passed);
            const isTimeout = test.name.includes('Timeout');
            const isSyntaxError = test.name.includes('Syntax Error');

            if (isTimeout) {
                if (results.error === 'TIMEOUT' || results.results.some((r: any) => r.error && r.error.includes('timed out'))) {
                    console.log(`✅ Passed (Correctly Temporized) - ${duration}ms`);
                    successCount++;
                } else {
                    console.log(`❌ Failed: Expected Timeout, got ${JSON.stringify(results).substring(0, 100)}`);
                }
            } else if (isSyntaxError) {
                if (!results.success && (results.compileError || results.error)) { // backend might return error object structure differently
                    console.log(`✅ Passed (Caught Syntax Error) - ${duration}ms`);
                    successCount++;
                } else if (results.results && results.results.some((r: any) => r.error)) {
                    console.log(`✅ Passed (Caught Syntax Error in execution) - ${duration}ms`);
                    successCount++;
                } else {
                    console.log(`❌ Failed: Expected Syntax Error, got success`);
                }
            } else {
                if (res.data.success && allPassed) {
                    console.log(`✅ Passed - ${duration}ms`);
                    successCount++;
                } else {
                    const firstFail = results.results?.find((r: any) => !r.passed);
                    if (firstFail) {
                        console.log(`❌ Failed: Expected ${JSON.stringify(firstFail.expected)} but got ${JSON.stringify(firstFail.actual)}`);
                        if (firstFail.error) console.log(`   Error: ${firstFail.error}`);
                    } else {
                        console.log(`❌ Failed: Unknown reason.`);
                    }
                }
            }

        } catch (error: any) {
            const isSyntaxError = test.name.includes('Syntax Error');
            if (isSyntaxError && error.response && error.response.status === 500) {
                // The backend might throw 500 for syntax errors depending on implementation
                console.log(`✅ Passed (Caught Syntax Error via 500)`);
                successCount++;
            } else {
                console.log(`❌ Error: ${error.message}`);
                if (error.response) {
                    console.log(`   Response: ${JSON.stringify(error.response.data)}`);
                }
            }
        }
        console.log('---');
    }

    console.log(`\nResults: ${successCount}/${testCases.length} Passed`);
}

testExecution();
