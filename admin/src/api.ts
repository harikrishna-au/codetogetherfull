// API service for admin panel
const API_BASE_URL = '/admin-api/admin';

interface Question {
  id?: string;
  questionId: string;
  title: string;
  difficulty: string;
  description: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
  tags?: string[];
  hints?: string[];
  starterCode?: any;
  compileTestCases?: any;
  majorTestCases?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface TestCase {
  input: any;
  output: string;
  explanation?: string;
}

interface QueueStats {
  [difficulty: string]: {
    count: number;
    averageWaitTime: number;
    oldestWaitTime: number;
  };
}

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  questions?: T;
  testCases?: T;
  error?: string;
  message?: string;
  nextId?: string;
  totalQuestions?: number;
  activeUsers?: any[];
  [key: string]: any; // Allow additional properties
}

// Generic API request function
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Question API endpoints
export const questionApi = {
  // Get all questions
  async getAll(): Promise<Question[]> {
    const response = await apiRequest<Question[]>('/questions');
    return response.questions || [];
  },

  // Add a new question
  async add(questionData: Question): Promise<void> {
    await apiRequest('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  },

  // Delete a question
  async delete(questionId: string): Promise<void> {
    await apiRequest(`/questions/${questionId}`, {
      method: 'DELETE',
    });
  },

  // Get next question ID
  async getNextId(): Promise<string> {
    const response = await apiRequest<{ nextId: string }>('/next-question-id');
    return response.nextId || 'q1';
  },

  // Initialize sample questions
  async initializeSample(): Promise<{ totalQuestions: number }> {
    const response = await apiRequest<{ totalQuestions: number }>('/api/questions/initialize', {
      method: 'POST',
    });
    return { totalQuestions: response.totalQuestions || 0 };
  },
};

// Test Cases API endpoints
export const testCaseApi = {
  // Get test cases for a specific question
  async getByQuestionId(questionId: string): Promise<TestCase[]> {
    const response = await apiRequest<TestCase[]>(`/testcases/${questionId}`);
    return response.testCases || [];
  },

  // Add test cases for a question
  async add(questionId: string, testCases: TestCase[]): Promise<void> {
    await apiRequest(`/testcases/${questionId}`, {
      method: 'POST',
      body: JSON.stringify({ testCases }),
    });
  },
};

// Queue Management API endpoints
export const queueApi = {
  // Get queue statistics
  async getStats(): Promise<QueueStats> {
    const response = await apiRequest<QueueStats>('/queue/stats');
    return response.data || {};
  },

  // Clear all queues
  async clearAll(): Promise<void> {
    await apiRequest('/clear-queues', {
      method: 'POST',
    });
  },

  // Clear specific difficulty queue
  async clearDifficulty(difficulty: string): Promise<void> {
    await apiRequest(`/queue/clear/${difficulty}`, {
      method: 'POST',
    });
  },

  // Get queue contents for a specific difficulty
  async getContents(difficulty: string): Promise<any[]> {
    const response = await apiRequest<any[]>(`/queue/contents/${difficulty}`);
    return response.data || [];
  },
};

// Room Management API endpoints
export const roomApi = {
  // Get all active rooms
  async getActive(): Promise<any[]> {
    const response = await apiRequest<any[]>('/rooms');
    return response.data || [];
  },

  // Terminate a specific room
  async terminate(roomId: string): Promise<void> {
    await apiRequest(`/rooms/${roomId}/terminate`, {
      method: 'POST',
    });
  },
};

// User Management API endpoints
export const userApi = {
  // Clear all user states (reset completion matrices)
  async resetAll(): Promise<void> {
    await apiRequest('/users/reset', {
      method: 'POST',
    });
  },

  // Get active users count
  async getActiveCount(): Promise<number> {
    try {
      const response = await apiRequest<{ activeUsers: any[] }>('/api/active-users');
      return response.activeUsers?.length || 0;
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      return 0;
    }
  },
};

// Statistics API endpoints
export const statsApi = {
  // Get dashboard statistics
  async getDashboard(): Promise<{
    totalQuestions: number;
    activeUsers: number;
    queueLength: number;
    questionsToday: number;
  }> {
    try {
      const [questionsResponse, activeUsersCount, queueStats] = await Promise.all([
        apiRequest<{ totalQuestions: number }>('/api/questions/count'),
        userApi.getActiveCount(),
        queueApi.getStats(),
      ]);

      const totalQueueLength = Object.values(queueStats).reduce(
        (total: number, stat: any) => total + stat.count,
        0
      );

      return {
        totalQuestions: questionsResponse.totalQuestions || 0,
        activeUsers: activeUsersCount,
        queueLength: totalQueueLength,
        questionsToday: 0, // Can be implemented later
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {
        totalQuestions: 0,
        activeUsers: 0,
        queueLength: 0,
        questionsToday: 0,
      };
    }
  },
};

// Export all APIs
export const api = {
  questions: questionApi,
  testCases: testCaseApi,
  queues: queueApi,
  rooms: roomApi,
  users: userApi,
  stats: statsApi,
};

export default api;
