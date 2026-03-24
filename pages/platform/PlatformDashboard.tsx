import React, { useState, useMemo } from 'react';
import { BarChart3, Building2, LayoutTemplate, Activity, Cloud, WifiOff, Shield } from 'lucide-react';
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
  const { connectionError } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const activeLabel = TABS.find(t => t.id === activeTab)?.label ?? '';

  return (
    <div className="flex -mx-4 md:-mx-8 min-h-[calc(100vh-160px)]">

      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-48 shrink-0 border-r border-gray-800/70 bg-gray-950/40">
        <div className="px-4 py-4 border-b border-gray-800/70">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-purple-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
              Platform
            </p>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeTab === id
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/20'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-800/70">
          <span className="text-[10px] flex items-center gap-1.5 text-purple-400 mb-1.5">
            <Shield size={10} /> Platform Owner
          </span>
          {connectionError ? (
            <span className="text-[10px] flex items-center gap-1.5 text-red-400">
              <WifiOff size={10} /> Offline
            </span>
          ) : (
            <span className="text-[10px] flex items-center gap-1.5 text-green-500">
              <Cloud size={10} /> Live
            </span>
          )}
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="md:hidden fixed bottom-[72px] left-0 right-0 z-40 flex overflow-x-auto bg-gray-950/95 border-t border-gray-800 backdrop-blur-md">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-0.5 px-3.5 py-2 shrink-0 text-[9px] font-bold uppercase tracking-wide transition-all flex-1 ${
              activeTab === id ? 'text-white border-t-2 border-purple-500' : 'text-gray-500 border-t-2 border-transparent'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Section header bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-800/60 bg-gray-950/20">
          {(() => { const t = TABS.find(x => x.id === activeTab); return t ? <t.icon size={15} className="text-purple-400" /> : null; })()}
          <span className="text-sm font-semibold text-white">{activeLabel}</span>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">
            DEV
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 p-5 md:p-6 overflow-auto">
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
