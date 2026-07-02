import { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'Operator' | 'Supervisor' | 'Program Manager';

export interface RoleConfig {
  role: UserRole;
  label: string;
  sublabel: string;
  initials: string;
  name: string;
  badge: string;
  canFileOnBehalf: boolean;
}

export const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: 'Operator',
    label: 'Operator',
    sublabel: 'Route operator — files reports for themselves',
    initials: 'JD',
    name: 'John Doe',
    badge: '90001',
    canFileOnBehalf: false,
  },
  {
    role: 'Supervisor',
    label: 'Supervisor',
    sublabel: 'Can file reports on behalf of operators',
    initials: 'MC',
    name: 'Maria Chen',
    badge: '90002',
    canFileOnBehalf: true,
  },
  {
    role: 'Program Manager',
    label: 'Program Manager',
    sublabel: 'Can file reports on behalf of operators',
    initials: 'DP',
    name: 'David Park',
    badge: '90003',
    canFileOnBehalf: true,
  },
];

interface UserRoleContextValue {
  roleConfig: RoleConfig;
  setRole: (role: UserRole) => void;
}

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('Operator');

  const setRole = (r: UserRole) => setRoleState(r);

  const roleConfig = ROLE_CONFIGS.find(c => c.role === role)!;

  return (
    <UserRoleContext.Provider value={{ roleConfig, setRole }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) throw new Error('useUserRole must be used inside UserRoleProvider');
  return ctx;
}