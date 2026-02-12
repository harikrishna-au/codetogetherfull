
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Button from '../components/Button';
import {
  Users,
  Zap,
  Activity,
  LayoutGrid,
  Trash2,
  UserX,
  XCircle,
  RefreshCcw,
  Info
} from 'lucide-react';

interface QueueStats {
  friendlyQueue: number;
  competitiveQueue: number;
  totalActiveUsers: number;
  totalRooms: number;
}

export default function ClearQueues() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [stats, setStats] = useState<QueueStats>({
    friendlyQueue: 0,
    competitiveQueue: 0,
    totalActiveUsers: 0,
    totalRooms: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const stats = await api.queues.getStats();
      setStats({
        friendlyQueue: stats.easy?.count || 0,
        competitiveQueue: stats.medium?.count || 0,
        totalActiveUsers: Object.values(stats).reduce((total: number, stat: any) => total + stat.count, 0),
        totalRooms: 0, // Can be implemented later
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all queues? This will disconnect all waiting users.')) {
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      await api.queues.clearAll();
      setResult({ message: 'Queues cleared successfully!', type: 'success' });
      fetchStats(); // Refresh stats after clearing
    } catch (error: any) {
      setResult({ message: 'Error clearing queues: ' + error.message, type: 'error' });
    }
    setLoading(false);
  };

  const handleClearUserStates = async () => {
    if (!confirm('Are you sure you want to reset all user states? This will affect all active sessions.')) {
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      await api.users.resetAll();
      setResult({ message: 'User states cleared successfully!', type: 'success' });
      fetchStats();
    } catch (error: any) {
      setResult({ message: 'Error clearing user states: ' + error.message, type: 'error' });
    }
    setLoading(false);
  };

  const handleClearRooms = async () => {
    if (!confirm('Are you sure you want to clear all rooms? This will end all active sessions.')) {
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      // This would need to be implemented in the backend
      setResult({ message: 'Room clearing not yet implemented.', type: 'error' });
    } catch (error: any) {
      setResult({ message: 'Error clearing rooms: ' + error.message, type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-gray-900">Queue Management</h1>
        <Button
          onClick={fetchStats}
          variant="secondary"
          size="sm"
          disabled={statsLoading}
        >
          <span className="flex items-center gap-2">
            <RefreshCcw size={14} />
            {statsLoading ? 'Loading...' : 'Refresh Stats'}
          </span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-md border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Friendly Queue</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.friendlyQueue}</p>
            </div>
            <Users size={24} className="text-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-md border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Competitive Queue</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.competitiveQueue}</p>
            </div>
            <Zap size={24} className="text-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-md border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalActiveUsers}</p>
            </div>
            <Activity size={24} className="text-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-md border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Rooms</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalRooms}</p>
            </div>
            <LayoutGrid size={24} className="text-gray-300" />
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Danger Zone</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-md border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Trash2 size={24} />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Clear Queues</h3>
            <p className="text-sm text-gray-500 mb-6 flex-1">
              Remove all users from matchmaking queues. Users will be notified.
            </p>
            <Button
              variant="danger"
              className="w-full"
              onClick={handleClear}
              disabled={loading}
            >
              {loading ? 'Clearing...' : 'Clear All Queues'}
            </Button>
          </div>

          <div className="bg-white rounded-md border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <UserX size={24} />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Reset User States</h3>
            <p className="text-sm text-gray-500 mb-6 flex-1">
              Reset all user states to 'not available'. This affects session tracking.
            </p>
            <Button
              variant="danger"
              className="w-full"
              onClick={handleClearUserStates}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset User States'}
            </Button>
          </div>

          <div className="bg-white rounded-md border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <XCircle size={24} />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Clear Keep-Alive Rooms</h3>
            <p className="text-sm text-gray-500 mb-6 flex-1">
              End all active coding sessions and remove room data. Destructive.
            </p>
            <Button
              variant="danger"
              className="w-full"
              onClick={handleClearRooms}
              disabled={loading}
            >
              {loading ? 'Clearing...' : 'Clear All Rooms'}
            </Button>
          </div>
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-md border flex items-start gap-3 ${result.type === 'success'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
            : 'bg-red-50 border-red-100 text-red-900'
          }`}>
          <Info size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm">{result.message}</p>
        </div>
      )}
    </div>
  );
}
