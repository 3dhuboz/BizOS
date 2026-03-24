import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchMyInsights } from '../services/api';
import type { CustomerStats } from '../types';
import { TrendingUp, Star, ShoppingBag, Calendar, Award } from 'lucide-react';

const TIER_COLORS = { bronze: 'text-amber-600', silver: 'text-gray-300', gold: 'text-yellow-400' };
const TIER_THRESHOLDS = { bronze: 0, silver: 200, gold: 500 };

const CustomerInsights: React.FC = () => {
  const { user, getLabel } = useApp();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyInsights()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading your insights...</div>;

  if (!stats) return (
    <div className="text-center py-20">
      <ShoppingBag size={48} className="mx-auto text-gray-600 mb-4" />
      <p className="text-gray-400">No {getLabel('bookings').toLowerCase()} yet. Place your first one to see insights!</p>
    </div>
  );

  const tier = stats.tier || 'bronze';
  const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : null;
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
  const progress = nextThreshold ? Math.min(100, (stats.lifetimeValue / nextThreshold) * 100) : 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Your Insights</h1>

      {/* Tier Badge */}
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Award size={28} className={TIER_COLORS[tier]} />
          <div>
            <p className={`text-lg font-bold capitalize ${TIER_COLORS[tier]}`}>{tier} {getLabel('customer')}</p>
            {nextTier && <p className="text-xs text-gray-500">Spend ${nextThreshold?.toFixed(0)} total to reach {nextTier}</p>}
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="bg-gradient-to-r from-bbq-red to-bbq-gold h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={TrendingUp} label="Total Spent" value={`$${stats.lifetimeValue.toFixed(2)}`} />
        <StatCard icon={ShoppingBag} label={`Total ${getLabel('bookings')}`} value={String(stats.orderCount)} />
        <StatCard icon={Star} label="Avg Value" value={`$${stats.averageOrderValue.toFixed(2)}`} />
        <StatCard icon={Calendar} label="Days Since Last" value={stats.daysSinceLastOrder != null ? String(stats.daysSinceLastOrder) : '—'} />
      </div>

      {/* Favorite Items */}
      {stats.favoriteItems.length > 0 && (
        <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Your Favourites</h3>
          <div className="space-y-2">
            {stats.favoriteItems.slice(0, 5).map((fav, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-white text-sm">{fav.name}</span>
                <span className="text-xs text-gray-500">{fav.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800 text-center">
    <Icon size={20} className="mx-auto text-gray-500 mb-2" />
    <p className="text-xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

export default CustomerInsights;
