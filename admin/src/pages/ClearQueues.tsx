import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface QueueStats {
  friendlyQueue: number;
  competitiveQueue: number;
  totalActiveUsers: number;
  totalRooms: number;
}

export default function ClearQueues() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
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
      setResult('Queues cleared successfully!');
      fetchStats(); // Refresh stats after clearing
    } catch (error) {
      setResult('Error clearing queues: ' + error);
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
      setResult('User states cleared successfully!');
      fetchStats();
    } catch (error) {
      setResult('Error clearing user states: ' + error);
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
      setResult('Room clearing not yet implemented.');
    } catch (error) {
      setResult('Error clearing rooms: ' + error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={statsLoading}
        >
          {statsLoading ? 'Loading...' : 'Refresh Stats'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Friendly Queue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.friendlyQueue}</p>
            </div>
            <span className="text-2xl">👥</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Competitive Queue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.competitiveQueue}</p>
            </div>
            <span className="text-2xl">⚔️</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActiveUsers}</p>
            </div>
            <span className="text-2xl">🟢</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
            </div>
            <span className="text-2xl">🏠</span>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🧹</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Queues</h3>
            <p className="text-sm text-gray-600 mb-4">
              Remove all users from matchmaking queues. Users will be notified.
            </p>
            <button
              onClick={handleClear}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Clearing...' : 'Clear All Queues'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset User States</h3>
            <p className="text-sm text-gray-600 mb-4">
              Reset all user states to 'not available'. This affects session tracking.
            </p>
            <button
              onClick={handleClearUserStates}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Clearing...' : 'Reset User States'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear All Rooms</h3>
            <p className="text-sm text-gray-600 mb-4">
              End all active coding sessions and remove room data.
            </p>
            <button
              onClick={handleClearRooms}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Clearing...' : 'Clear All Rooms'}
            </button>
          </div>
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-lg ${
          result.includes('successfully') 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          {result}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Instructions</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Clear Queues:</strong> Use this when users are stuck in matchmaking or to reset the matching system.</p>
          <p><strong>Reset User States:</strong> Use this to fix user state inconsistencies or when users appear online but aren't.</p>
          <p><strong>Clear Rooms:</strong> Use this to end all active sessions and clean up room data. This is a destructive action.</p>
        </div>
      </div>
    </div>
  );
}
