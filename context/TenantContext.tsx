import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { setTenantId } from '../services/api';
import type { Tenant } from '../types';
import { impersonateTenant as apiImpersonate } from '../services/platformApi';

interface TenantContextType {
  tenantId: string | null;
  isPlatformOwner: boolean;
  isImpersonating: boolean;
  currentTenant: Tenant | null;
  impersonateTenant: (id: string) => Promise<void>;
  exitImpersonation: () => void;
  setIsPlatformOwner: (val: boolean) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [isPlatformOwner, setIsPlatformOwner] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  const impersonateTenant = useCallback(async (id: string) => {
    try {
      const { tenant } = await apiImpersonate(id);
      setTenantIdState(id);
      setTenantId(id);
      setCurrentTenant(tenant);
      setIsImpersonating(true);
    } catch (err) {
      console.error('[TenantContext] Impersonation failed:', err);
      throw err;
    }
  }, []);

  const exitImpersonation = useCallback(() => {
    setTenantIdState(null);
    setTenantId(null);
    setCurrentTenant(null);
    setIsImpersonating(false);
  }, []);

  return (
    <TenantContext.Provider value={{
      tenantId,
      isPlatformOwner,
      isImpersonating,
      currentTenant,
      impersonateTenant,
      exitImpersonation,
      setIsPlatformOwner,
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
};
