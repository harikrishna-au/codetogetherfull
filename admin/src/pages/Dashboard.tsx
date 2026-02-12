
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import {
  FileText,
  Users,
  Hourglass,
  Calendar,
  Plus,
  Eraser,
  RefreshCcw,
  CheckCircle,
  Server,
  Database
} from 'lucide-react';

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
      icon: <FileText size={24} />,
      action: () => onNavigate('view-questions')
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: <Users size={24} />,
      action: () => { }
    },
    {
      title: 'Queue Length',
      value: stats.queueLength,
      icon: <Hourglass size={24} />,
      action: () => onNavigate('clear-queues')
    },
    {
      title: 'Questions Today',
      value: stats.questionsToday,
      icon: <Calendar size={24} />,
      action: () => onNavigate('add-question')
    }
  ];

  const quickActions = [
    {
      title: 'Add New Question',
      description: 'Create a new coding question with test cases',
      icon: <Plus size={24} />,
      action: () => onNavigate('add-question')
    },
    {
      title: 'View All Questions',
      description: 'Browse and manage existing questions',
      icon: <FileText size={24} />,
      action: () => onNavigate('view-questions')
    },
    {
      title: 'Clear Queues',
      description: 'Reset matchmaking queues and user states',
      icon: <Eraser size={24} />,
      action: () => onNavigate('clear-queues')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <span className="ml-3 text-gray-500 text-sm">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Overview</h2>
          <Button onClick={fetchStats} variant="secondary" size="sm">
            <span className="flex items-center gap-2">
              <RefreshCcw size={14} />
              Refresh
            </span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              onClick={card.action}
              className="bg-white rounded-md border border-gray-200 p-5 cursor-pointer hover:border-black transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
                <span className="text-gray-300">{card.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={action.action}
              className="group bg-white rounded-md border border-gray-200 p-5 cursor-pointer hover:border-black transition-colors duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-black transition-colors">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1 group-hover:underline decoration-1 underline-offset-4">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">System Status</h2>
        <div className="bg-white rounded-md border border-gray-200 divide-y divide-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Database size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">Database Status</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-900 font-medium">Connected</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">Question Service</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-900 font-medium">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Server size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">Matchmaking Service</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-900 font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
