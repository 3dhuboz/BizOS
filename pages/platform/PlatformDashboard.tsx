import React, { useState } from 'react';
import { BarChart3, Building2, LayoutTemplate, Activity, Cloud, WifiOff, Shield, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import PlatformOverview from './PlatformOverview';
import TenantList from './TenantList';
import TemplateEditor from './TemplateEditor';
import SystemHealth from './SystemHealth';

type TabId = 'overview' | 'tenants' | 'templates' | 'system';

interface TabDef {
  id: TabId;
  icon: React.ElementType;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'overview',  icon: BarChart3,       label: 'Overview' },
  { id: 'tenants',   icon: Building2,       label: 'Tenants' },
  { id: 'templates', icon: LayoutTemplate,  label: 'Templates' },
  { id: 'system',    icon: Activity,        label: 'System' },
];

const PlatformDashboard: React.FC = () => {
  const { connectionError, logout } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const activeLabel = TABS.find(t => t.id === activeTab)?.label ?? '';
  const ActiveIcon = TABS.find(t => t.id === activeTab)?.icon ?? BarChart3;

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-gray-800/70 bg-gray-950">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-800/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-600">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">BizOS</p>
              <p className="text-[10px] text-purple-400 font-medium uppercase tracking-widest">Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeTab === id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-800/70 space-y-2">
          {connectionError ? (
            <span className="text-[10px] flex items-center gap-1.5 text-red-400">
              <WifiOff size={10} /> Offline
            </span>
          ) : (
            <span className="text-[10px] flex items-center gap-1.5 text-green-500">
              <Cloud size={10} /> Live · Cloudflare D1
            </span>
          )}
          <button onClick={logout} className="text-[10px] flex items-center gap-1.5 text-gray-500 hover:text-white transition">
            <LogOut size={10} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-gray-950 border-t border-gray-800">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1 py-3 flex-1 text-[10px] font-bold uppercase tracking-wide transition-all ${
              activeTab === id ? 'text-purple-400 border-t-2 border-purple-500' : 'text-gray-500 border-t-2 border-transparent'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-800/60 bg-gray-900/30 shrink-0">
          <ActiveIcon size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-white">{activeLabel}</span>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-600/20 px-2.5 py-1 rounded-full border border-purple-500/20">
            DEV
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6 pb-24 md:pb-6">
          {activeTab === 'overview'  && <PlatformOverview />}
          {activeTab === 'tenants'   && <TenantList />}
          {activeTab === 'templates' && <TemplateEditor />}
          {activeTab === 'system'    && <SystemHealth />}
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;
