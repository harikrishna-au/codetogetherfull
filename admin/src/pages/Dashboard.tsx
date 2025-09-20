import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface DashboardProps {
  onNavigate: (page: 'dashboard' | 'view-questions' | 'add-question' | 'clear-queues') => void;
}

interface Stats {
  totalQuestions: number;
  questionsToday: number;
  activeUsers: number;
  queueLength: number;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    questionsToday: 0,
    activeUsers: 0,
    queueLength: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const stats = await api.stats.getDashboard();
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Total Questions',
      value: stats.totalQuestions,
      icon: '📝',
      color: 'blue',
      action: () => onNavigate('view-questions')
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: '👥',
      color: 'green',
      action: () => {}
    },
    {
      title: 'Queue Length',
      value: stats.queueLength,
      icon: '⏳',
      color: 'yellow',
      action: () => onNavigate('clear-queues')
    },
    {
      title: 'Questions Today',
      value: stats.questionsToday,
      icon: '📅',
      color: 'purple',
      action: () => onNavigate('add-question')
    }
  ];

  const quickActions = [
    {
      title: 'Add New Question',
      description: 'Create a new coding question with test cases',
      icon: '➕',
      color: 'blue',
      action: () => onNavigate('add-question')
    },
    {
      title: 'View All Questions',
      description: 'Browse and manage existing questions',
      icon: '📝',
      color: 'green',
      action: () => onNavigate('view-questions')
    },
    {
      title: 'Clear Queues',
      description: 'Reset matchmaking queues and user states',
      icon: '🧹',
      color: 'red',
      action: () => onNavigate('clear-queues')
    },
    {
      title: 'Initialize Sample Questions',
      description: 'Load sample questions into the database',
      icon: '🚀',
      color: 'purple',
      action: () => initializeSampleQuestions()
    }
  ];

  const initializeSampleQuestions = async () => {
    try {
      const result = await api.questions.initializeSample();
      alert(`Successfully initialized ${result.totalQuestions} questions!`);
      fetchStats(); // Refresh stats
    } catch (error) {
      alert('Error initializing questions: ' + error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Stats
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            onClick={card.action}
            className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
              card.color === 'blue' ? 'border-blue-500 hover:border-blue-600' :
              card.color === 'green' ? 'border-green-500 hover:border-green-600' :
              card.color === 'yellow' ? 'border-yellow-500 hover:border-yellow-600' :
              'border-purple-500 hover:border-purple-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={action.action}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border ${
                action.color === 'blue' ? 'hover:border-blue-300' :
                action.color === 'green' ? 'hover:border-green-300' :
                action.color === 'red' ? 'hover:border-red-300' :
                'hover:border-purple-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{action.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Database Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Connected</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Question Service</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Online</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Matchmaking Service</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
