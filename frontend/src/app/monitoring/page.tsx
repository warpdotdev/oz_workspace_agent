'use client';

import { useEffect, useState } from 'react';
import { api, MonitoringStats, EventLevel } from '@/lib/api';
import { StatusOverview } from '@/components/StatusOverview';
import { EventTimeline } from '@/components/EventTimeline';
import { ErrorAlerts } from '@/components/ErrorAlerts';
import { AuditLogTable } from '@/components/AuditLogTable';

export default function MonitoringPage() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await api.getMonitoringStats();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading monitoring data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-600">No monitoring data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Monitoring Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time agent status, events, and system health</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh (10s)
              </label>
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Refresh Now
              </button>
              <a
                href="/agents"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                View Agents
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Status Overview */}
        <StatusOverview overview={stats.overview} />

        {/* Error Alerts */}
        {stats.errorSummary.length > 0 && (
          <ErrorAlerts errors={stats.errorSummary} />
        )}

        {/* Event Timeline and Audit Logs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Timeline */}
          <div>
            <EventTimeline events={stats.recentEvents} />
          </div>

          {/* Audit Logs */}
          <div>
            <AuditLogTable logs={stats.recentAuditLogs} />
          </div>
        </div>
      </div>
    </div>
  );
}
