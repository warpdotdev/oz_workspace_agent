import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { generatePerformanceMetrics } from '../services/mockAgentService';
import type { PerformanceMetric } from '../types';

interface PerformanceChartProps {
  agentId: string;
  className?: string;
}

type MetricType = 'tasksCompleted' | 'successRate' | 'tokenUsage' | 'responseTime';

interface ChartDataPoint {
  time: string;
  tasksCompleted: number;
  successRate: number;
  tokenUsage: number;
  responseTime: number;
}

const metricConfig: Record<MetricType, { label: string; color: string; unit: string }> = {
  tasksCompleted: { label: 'Tasks Completed', color: '#10B981', unit: '' },
  successRate: { label: 'Success Rate', color: '#3B82F6', unit: '%' },
  tokenUsage: { label: 'Token Usage', color: '#F59E0B', unit: '' },
  responseTime: { label: 'Response Time', color: '#8B5CF6', unit: 'ms' },
};

export const PerformanceChart = ({ agentId, className = '' }: PerformanceChartProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tasksCompleted');

  // Generate initial metrics and update periodically
  useEffect(() => {
    setMetrics(generatePerformanceMetrics(20));

    const interval = setInterval(() => {
      setMetrics((prev) => {
        const newMetric: PerformanceMetric = {
          timestamp: new Date(),
          tasksCompleted: Math.floor(Math.random() * 5) + 1,
          successRate: Math.floor(Math.random() * 10) + 90,
          tokenUsage: Math.floor(Math.random() * 500) + 200,
          responseTime: Math.floor(Math.random() * 500) + 100,
        };
        return [...prev.slice(1), newMetric];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [agentId]);

  // Format metrics for chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    return metrics.map((m) => ({
      time: m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tasksCompleted: m.tasksCompleted,
      successRate: m.successRate,
      tokenUsage: m.tokenUsage,
      responseTime: m.responseTime,
    }));
  }, [metrics]);

  const config = metricConfig[selectedMetric];

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 ${className}`}>
      {/* Header with metric selector */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold">Performance</h3>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
        >
          {Object.entries(metricConfig).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}${config.unit}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6',
              }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value) => [`${value}${config.unit}`, config.label]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={() => config.label}
            />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: config.color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick stats */}
      <div className="p-4 border-t border-gray-800 grid grid-cols-4 gap-4">
        {Object.entries(metricConfig).map(([key, { label, color, unit }]) => {
          const values = metrics.map((m) => m[key as MetricType]);
          const avg = values.length > 0 
            ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
            : 0;
          const latest = values[values.length - 1] || 0;
          
          return (
            <button
              key={key}
              onClick={() => setSelectedMetric(key as MetricType)}
              className={`text-left p-2 rounded transition-colors ${
                selectedMetric === key 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'hover:bg-gray-800/50'
              }`}
            >
              <div className="text-xs text-gray-400">{label}</div>
              <div className="text-lg font-semibold" style={{ color }}>
                {latest}{unit}
              </div>
              <div className="text-xs text-gray-500">
                avg: {avg}{unit}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PerformanceChart;
