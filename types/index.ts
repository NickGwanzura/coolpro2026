import React from 'react';

export type UserRole = 'technician' | 'trainer' | 'vendor' | 'org_admin' | 'program_admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  region: string;
  isDemo: boolean;
  avatar?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}