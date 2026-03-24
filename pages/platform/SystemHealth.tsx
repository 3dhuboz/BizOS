import React, { useState, useEffect } from 'react';
import { Activity, Database, Clock, RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { fetchSystemHealth } from '../../services/platformApi';

interface HealthData {
  tables: Record<string, number>;
  latencyMs: number;
  timestamp: string;
}

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHealth(); }, []);

  const getLatencyStatus = (ms: number) => {
    if (ms < 50) return { color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', label: 'Excellent', icon: CheckCircle };
    if (ms < 200) return { color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', label: 'Moderate', icon: AlertTriangle };
    return { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: 'High', icon: XCircle };
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="animate-spin text-purple-400" />
        <span className="ml-3 text-gray-400 text-sm">Checking system health...</span>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="text-center py-20">
        <XCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={loadHealth} className="text-sm text-purple-400 hover:text-purple-300 underline">
          Retry
        </button>
      </div>
    );
  }

  const latency = health?.latencyMs ?? 0;
  const status = getLatencyStatus(latency);
  const StatusIcon = status.icon;
  const tableEntries = health?.tables ? Object.entries(health.tables).sort(([a], [b]) => a.localeCompare(b)) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">System Health</h2>
        <button
          onClick={loadHealth}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Latency Card */}
      <div className={`rounded-xl p-5 border mb-6 ${status.bg}`}>
        <div className="flex items-center gap-3 mb-3">
          <StatusIcon size={20} className={status.color} />
          <div>
            <h3 className="text-sm font-bold text-white">Database Latency</h3>
            <p className={`text-xs ${status.color}`}>{status.label}</p>
          </div>
          <div className="ml-auto text-right">
            <p className={`text-2xl font-bold ${status.color}`}>{latency}ms</p>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              latency < 50 ? 'bg-green-500' : latency < 200 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, (latency / 500) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>0ms</span>
          <span>50ms</span>
          <span>200ms</span>
          <span>500ms+</span>
        </div>
      </div>

      {/* Table Counts */}
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-800/60 flex items-center gap-2">
          <Database size={14} className="text-purple-400" />
          <h3 className="text-sm font-medium text-white">Table Row Counts</h3>
          <span className="ml-auto text-[10px] text-gray-500">{tableEntries.length} tables</span>
        </div>
        <div className="divide-y divide-gray-800/40">
          {tableEntries.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">No table data available</div>
          ) : (
            tableEntries.map(([table, count]) => (
              <div key={table} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-800/20 transition-colors">
                <span className="text-sm text-gray-300 font-mono">{table}</span>
                <span className="text-sm font-medium text-white tabular-nums">{count.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Timestamp */}
      {health?.timestamp && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={12} />
          <span>Last checked: {new Date(health.timestamp).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
