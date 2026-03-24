import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle, ShoppingBag, DollarSign, Users, CalendarCheck, RefreshCw } from 'lucide-react';
import { fetchPlatformStats } from '../../services/platformApi';
import type { PlatformStats } from '../../types';

const PlatformOverview: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlatformStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="animate-spin text-purple-400" />
        <span className="ml-3 text-gray-400 text-sm">Loading platform stats...</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={loadStats} className="text-sm text-purple-400 hover:text-purple-300 underline">
          Retry
        </button>
      </div>
    );
  }

  const cards = [
    { label: 'Total Tenants',   value: stats?.totalTenants ?? 0,   icon: Building2,    color: 'text-purple-400' },
    { label: 'Active Tenants',  value: stats?.activeTenants ?? 0,  icon: CheckCircle,  color: 'text-green-400' },
    { label: 'Total Orders',    value: stats?.totalOrders ?? 0,    icon: ShoppingBag,  color: 'text-blue-400' },
    { label: 'Revenue',         value: stats?.totalRevenue ?? 0,   icon: DollarSign,   color: 'text-bbq-gold', isCurrency: true },
    { label: 'Total Customers', value: stats?.totalCustomers ?? 0, icon: Users,        color: 'text-orange-400' },
    { label: 'Total Bookings',  value: stats?.totalBookings ?? 0,  icon: CalendarCheck, color: 'text-cyan-400' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Platform Overview</h2>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, isCurrency }) => (
          <div
            key={label}
            className="bg-gray-900/60 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-gray-800/60 ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {isCurrency
                ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : value.toLocaleString()
              }
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformOverview;
