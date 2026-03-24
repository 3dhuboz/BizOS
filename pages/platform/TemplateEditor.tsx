import React from 'react';
import { Truck, UtensilsCrossed, ChefHat, Wrench, Scissors, Dumbbell, ShoppingBag, Briefcase, Settings, Info } from 'lucide-react';
import { BUSINESS_PRESETS, BUSINESS_TYPE_OPTIONS, type BusinessType } from '../../utils/businessConfig';

const ICON_MAP: Record<string, React.ElementType> = {
  Truck, UtensilsCrossed, ChefHat, Wrench, Scissors, Dumbbell, ShoppingBag, Briefcase, Settings,
};

const TemplateEditor: React.FC = () => {
  const presetEntries = Object.entries(BUSINESS_PRESETS) as [BusinessType, typeof BUSINESS_PRESETS[BusinessType]][];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Business Templates</h2>
      </div>

      {/* Info Note */}
      <div className="mb-6 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-start gap-2">
        <Info size={15} className="text-purple-400 mt-0.5 shrink-0" />
        <p className="text-xs text-purple-300">
          Templates are configured in code. Contact support to customize business type presets.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {presetEntries.map(([type, config]) => {
          const option = BUSINESS_TYPE_OPTIONS.find(o => o.type === type);
          const IconComp = ICON_MAP[option?.icon || 'Settings'] || Settings;

          const featureKeys = Object.entries(config.features)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key);

          const disabledFeatures = Object.entries(config.features)
            .filter(([, enabled]) => !enabled)
            .map(([key]) => key);

          return (
            <div
              key={type}
              className="bg-gray-900/60 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-800/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-900/30 text-purple-400">
                  <IconComp size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{option?.label || type}</h3>
                  <p className="text-[10px] text-gray-500">{option?.description || ''}</p>
                </div>
              </div>

              {/* Labels */}
              <div className="px-5 py-3 border-b border-gray-800/40">
                <p className="text-[10px] font-medium text-bbq-gold uppercase tracking-wide mb-2">Labels</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-gray-500">Items:</span> <span className="text-gray-300">{config.labels.items}</span></div>
                  <div><span className="text-gray-500">Booking:</span> <span className="text-gray-300">{config.labels.booking}</span></div>
                  <div><span className="text-gray-500">Customer:</span> <span className="text-gray-300">{config.labels.customer}</span></div>
                  <div><span className="text-gray-500">Package:</span> <span className="text-gray-300">{config.labels.package}</span></div>
                  <div><span className="text-gray-500">Specialist:</span> <span className="text-gray-300">{config.labels.specialist}</span></div>
                  <div><span className="text-gray-500">Gallery:</span> <span className="text-gray-300">{config.labels.gallery}</span></div>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="px-5 py-3 border-b border-gray-800/40">
                <p className="text-[10px] font-medium text-bbq-gold uppercase tracking-wide mb-2">Features</p>
                <div className="flex flex-wrap gap-1.5">
                  {featureKeys.map(key => (
                    <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/15 text-green-400 border border-green-500/20">
                      {key}
                    </span>
                  ))}
                  {disabledFeatures.map(key => (
                    <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-800/60 text-gray-600 border border-gray-700/30 line-through">
                      {key}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Persona */}
              <div className="px-5 py-3">
                <p className="text-[10px] font-medium text-bbq-gold uppercase tracking-wide mb-2">AI Persona</p>
                <div className="text-xs">
                  <p className="text-white font-medium">{config.aiPersona.name}</p>
                  <p className="text-gray-500">{config.aiPersona.role}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateEditor;
