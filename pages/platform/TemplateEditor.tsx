import React from 'react';
import { Truck, UtensilsCrossed, ChefHat, Wrench, Scissors, Dumbbell, ShoppingBag, Briefcase, Settings, Info, Check, X } from 'lucide-react';
import { BUSINESS_PRESETS, BUSINESS_TYPE_OPTIONS, type BusinessType } from '../../utils/businessConfig';

const ICON_MAP: Record<string, React.ElementType> = {
  Truck, UtensilsCrossed, ChefHat, Wrench, Scissors, Dumbbell, ShoppingBag, Briefcase, Settings,
};

const FEATURE_LABELS: Record<string, string> = {
  menuBrowsing: 'Menu',
  onlineOrdering: 'Ordering',
  catering: 'Catering',
  bookingPortal: 'Booking',
  gallery: 'Gallery',
  rewards: 'Rewards',
  aiChat: 'AI Chat',
  socialMedia: 'Social',
  tracking: 'Tracking',
  contracts: 'Contracts',
  pitmaster: 'Specialist',
  events: 'Events',
  promoters: 'Promoters',
};

const TemplateEditor: React.FC = () => {
  const presetEntries = Object.entries(BUSINESS_PRESETS) as [BusinessType, typeof BUSINESS_PRESETS[BusinessType]][];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Business Templates</h2>
      </div>

      <div className="mb-6 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-start gap-2">
        <Info size={14} className="text-purple-400 mt-0.5 shrink-0" />
        <p className="text-xs text-purple-300">
          Templates are configured in code. Contact support to customize business type presets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {presetEntries.map(([type, config]) => {
          const option = BUSINESS_TYPE_OPTIONS.find(o => o.type === type);
          const IconComp = ICON_MAP[option?.icon || 'Settings'] || Settings;
          const enabledCount = Object.values(config.features).filter(Boolean).length;
          const totalCount = Object.keys(config.features).length;

          return (
            <div key={type} className="bg-gray-900/60 rounded-xl border border-gray-800 hover:border-purple-800/50 transition-colors">
              {/* Header */}
              <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-800/50">
                <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-400">
                  <IconComp size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">{option?.label || type}</h3>
                  <p className="text-[11px] text-gray-500 truncate">{option?.description || ''}</p>
                </div>
                <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  {enabledCount}/{totalCount}
                </span>
              </div>

              {/* Labels */}
              <div className="px-5 py-3 border-b border-gray-800/30">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  <LabelRow label="Items" value={config.labels.items} />
                  <LabelRow label="Booking" value={config.labels.booking} />
                  <LabelRow label="Customer" value={config.labels.customer} />
                  <LabelRow label="Package" value={config.labels.package} />
                  <LabelRow label="Specialist" value={config.labels.specialist} />
                  <LabelRow label="Gallery" value={config.labels.gallery} />
                </div>
              </div>

              {/* Features */}
              <div className="px-5 py-3 border-b border-gray-800/30">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(config.features).map(([key, enabled]) => (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                        enabled
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-800/40 text-gray-600'
                      }`}
                    >
                      {enabled ? <Check size={8} /> : <X size={8} />}
                      {FEATURE_LABELS[key] || key}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Persona */}
              <div className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-400 text-[10px] font-bold">
                    AI
                  </div>
                  <div className="text-xs">
                    <p className="text-white font-medium">{config.aiPersona.name}</p>
                    <p className="text-gray-500">{config.aiPersona.role}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LabelRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-1.5">
    <span className="text-gray-500 text-[10px] w-16 shrink-0">{label}</span>
    <span className="text-gray-200 font-medium">{value}</span>
  </div>
);

export default TemplateEditor;
