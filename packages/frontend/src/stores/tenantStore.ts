import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  currentTenant: string;
  setTenant: (tenant: string) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: 'interview-prep',
      setTenant: (tenant) => set({ currentTenant: tenant }),
    }),
    {
      name: 'dochound-tenant',
    }
  )
);
