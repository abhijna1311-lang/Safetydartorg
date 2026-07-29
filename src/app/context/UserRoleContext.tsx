import { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'Operator' | 'Supervisor' | 'Assistant Manager' | 'Program Manager';

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
    initials: 'BS',
    name: 'Bukayo Saka',
    badge: '90001',
    canFileOnBehalf: false,
  },
  {
    role: 'Supervisor',
    label: 'Field Supervisor',
    sublabel: 'Can file reports on behalf of operators',
    initials: 'AP',
    name: 'Alexia Putellas',
    badge: '90002',
    canFileOnBehalf: true,
  },
  {
    role: 'Assistant Manager',
    label: 'Assistant Manager',
    sublabel: 'Reviews Field Supervisor reports before Safety Program Manager review',
    initials: 'LB',
    name: 'Lucy Bronze',
    badge: '90004',
    canFileOnBehalf: false,
  },
  {
    role: 'Program Manager',
    label: 'Safety Program Manager',
    sublabel: 'Can file reports on behalf of operators',
    initials: 'JB',
    name: 'Jude Bellingham',
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