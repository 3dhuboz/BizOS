import React from 'react';
import { Eye, X } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, currentTenant, exitImpersonation } = useTenant();

  if (!isImpersonating || !currentTenant) return null;

  const handleExit = () => {
    exitImpersonation();
    window.location.hash = '#/platform';
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-black"
      style={{ zIndex: 100 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye size={14} />
          <span>Viewing as: <strong>{currentTenant.businessName}</strong></span>
          <span className="text-yellow-800 text-xs">({currentTenant.businessType.replace('_', ' ')})</span>
        </div>
        <button
          onClick={handleExit}
          className="flex items-center gap-1 px-3 py-0.5 bg-black/20 hover:bg-black/30 rounded text-sm font-medium transition-colors"
        >
          <X size={13} />
          Exit
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
