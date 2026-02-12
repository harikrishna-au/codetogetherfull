import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

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
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      action: () => onNavigate('view-questions')
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: '👥',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-500',
      action: () => { }
    },
    {
      title: 'Queue Length',
      value: stats.queueLength,
      icon: '⏳',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-500',
      action: () => onNavigate('clear-queues')
    },
    {
      title: 'Questions Today',
      value: stats.questionsToday,
      icon: '📅',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-500',
      action: () => onNavigate('add-question')
    }
  ];

  const quickActions = [
    {
      title: 'Add New Question',
      description: 'Create a new coding question with test cases',
      icon: '➕',
      action: () => onNavigate('add-question')
    },
    {
      title: 'View All Questions',
      description: 'Browse and manage existing questions',
      icon: '📝',
      action: () => onNavigate('view-questions')
    },
    {
      title: 'Clear Queues',
      description: 'Reset matchmaking queues and user states',
      icon: '🧹',
      action: () => onNavigate('clear-queues')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <Button onClick={fetchStats} variant="secondary" size="sm">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              onClick={card.action}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${card.borderColor} ${card.bgColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
                </div>
                <span className="text-4xl">{card.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={action.action}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">System Status</h2>
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-700 font-medium">Database Status</span>
              <Badge variant="success">Connected</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-700 font-medium">Question Service</span>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-700 font-medium">Matchmaking Service</span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
