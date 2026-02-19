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

// Technician Registry Types
export interface Technician {
  id: string;
  name: string;
  nationalId: string;
  registrationNumber: string;
  region: string;
  province: string;
  district: string;
  contactNumber: string;
  email?: string;
  specialization: string;
  certifications: Certification[];
  trainingHistory: TrainingRecord[];
  employmentStatus: 'employed' | 'self-employed' | 'unemployed';
  employer?: string;
  registrationDate: string;
  expiryDate: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastRenewalDate?: string;
  nextRenewalDate?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  dateIssued: string;
  expiryDate: string;
  certificateNumber: string;
  status: 'valid' | 'expired' | 'pending';
}

export interface TrainingRecord {
  id: string;
  courseName: string;
  provider: string;
  dateCompleted: string;
  duration: string;
  certificateNumber?: string;
}

export interface Province {
  id: string;
  name: string;
  districts: string[];
}