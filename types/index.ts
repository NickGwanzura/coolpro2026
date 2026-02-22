import React from 'react';

export type UserRole = 'technician' | 'trainer' | 'vendor' | 'org_admin' | 'program_admin' | 'regulator';

export const UserRole = {
  TECHNICIAN: 'technician' as const,
  TRAINER: 'trainer' as const,
  VENDOR: 'vendor' as const,
  ORG_ADMIN: 'org_admin' as const,
  PROGRAM_ADMIN: 'program_admin' as const,
  REGULATOR: 'regulator' as const,
};

export interface User {
  id: string;
  name: string;
  role: UserRole | string;
  region: string;
  isDemo: boolean;
  avatar?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed' | 'pending' | 'offline' | 'error';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: (UserRole | string)[];
}

// Job Types for Sizing Tool
export type JobType = 'C40_FREEZER' | 'C60_FREEZER' | 'C90_FREEZER' | 'COLD_ROOM' | 'FREEZER_ROOM';

export const JobTypeLabels: Record<JobType, string> = {
  C40_FREEZER: 'C40 Freezer',
  C60_FREEZER: 'C60 Freezer',
  C90_FREEZER: 'C90 Freezer',
  COLD_ROOM: 'Cold Room',
  FREEZER_ROOM: 'Freezer Room'
};

export const JobTypeDefaults: Record<JobType, { targetTemp: number; defaultLoadingTime: number }> = {
  C40_FREEZER: { targetTemp: -20, defaultLoadingTime: 24 },
  C60_FREEZER: { targetTemp: -25, defaultLoadingTime: 24 },
  C90_FREEZER: { targetTemp: -35, defaultLoadingTime: 24 },
  COLD_ROOM: { targetTemp: 2, defaultLoadingTime: 24 },
  FREEZER_ROOM: { targetTemp: -18, defaultLoadingTime: 24 }
};

// Job interface from old types.ts
export interface Job {
  id: string;
  clientName: string;
  facilityType: 'SUPERMARKET' | 'COLD_STORAGE' | 'RETAIL';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  lastUpdated: string;
  refrigerantUsage: number;
}

// SizingInputs from old types.ts
export interface SizingInputs {
  step: number;
  facilityType: string;
  jobType: JobType;
  roomWidth: number;
  roomLength: number;
  roomHeight: number;
  insulationType: 'Polyurethane' | 'Polystyrene' | 'PUR' | 'PIR' | 'EPS';
  insulationThickness: number;
  ambientTemp: number;
  targetTemp: number;
  productTemp: number;
  productMass: number;
  productCp: number;
  loadingTimeHours: number;
}

// Course from old types.ts
export interface Course {
  id: string;
  title: string;
  description: string;
  modules: number;
  progress: number;
  level: 'BASIC' | 'ADVANCED' | 'GWP_SPECIALIST';
  isDownloaded: boolean;
}

// RewardItem from old types.ts
export interface RewardItem {
  id: string;
  title: string;
  points: number;
  vendor: string;
  image: string;
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

export interface RefrigerantLog {
  id: string;
  technicianId: string;
  technicianName: string;
  clientName: string;
  location: string;
  jobType: JobType;
  refrigerantType: string;
  amount: number;
  actionType: 'Charge' | 'Recovery' | 'Leak Repair';
  timestamp: string;
}

// Installation Types
export interface Installation {
  id: string;
  technicianId: string;
  technicianName: string;
  clientName: string;
  jobDetails: string;
  floorSpace: string;
  jobType: JobType;
  installationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  images: string[];
  cocRequested: boolean;
  cocApproved: boolean;
  cocApprovalDate?: string;
}

// Certificate of Conformity
export interface CertificateOfConformity {
  id: string;
  installationId: string;
  certificateNumber: string;
  clientName: string;
  jobType: JobType;
  jobDetails: string;
  floorSpace: string;
  installationDate: string;
  approvedBy: string;
  approvalDate: string;
  technicianName: string;
}

