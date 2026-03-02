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
  children?: NavItem[];
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

export const JobTypeImages: Record<JobType, string> = {
  C40_FREEZER: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
  C60_FREEZER: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&h=200&fit=crop',
  C90_FREEZER: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=300&h=200&fit=crop',
  COLD_ROOM: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop',
  FREEZER_ROOM: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300&h=200&fit=crop'
};

export const JobTypeDescriptions: Record<JobType, string> = {
  C40_FREEZER: 'Light commercial freezer up to -20°C',
  C60_FREEZER: 'Medium commercial freezer up to -25°C',
  C90_FREEZER: 'Heavy duty freezer up to -35°C',
  COLD_ROOM: 'Positive temperature cold storage (0°C to +10°C)',
  FREEZER_ROOM: 'Negative temperature storage (-18°C to -25°C)'
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
export interface OccupationalAccident {
  id: string;
  date: string;
  jobSite: string;
  clientName: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  technicianName: string;
  // Investigation fields
  rootCause?: string;
  investigationDate?: string;
  investigatorName?: string;
  correctiveActions?: string;
  preventiveMeasures?: string;
  status?: 'Open' | 'Under Investigation' | 'Closed';
}

export const RootCauseCategories = {
  LACK_OF_TRAINING: {
    label: 'Lack of Training',
    color: '#dc2626',
    description: 'Insufficient or inadequate safety training',
    examples: ['No formal HVAC-R safety certification', 'Missing site-specific induction', 'Inadequate PPE training']
  },
  NEGLIGENCE: {
    label: 'Negligence',
    color: '#ea580c',
    description: 'Failure to follow established safety procedures',
    examples: ['Skipped safety checks', 'PPE not worn', 'Shortcuts taken', 'Rushing to complete job']
  },
  SYSTEM_FAILURE: {
    label: 'System Failure',
    color: '#7c3aed',
    description: 'Equipment, process, or procedural failures',
    examples: ['Equipment malfunction', 'Inadequate safety systems', 'Poor maintenance', 'Design defects']
  },
  ENVIRONMENTAL: {
    label: 'Environmental Factors',
    color: '#0891b2',
    description: 'External conditions beyond control',
    examples: ['Extreme weather', 'Poor lighting', 'Confined space hazards', 'Noise exposure']
  },
  COMMUNICATION: {
    label: 'Communication Failure',
    color: '#ca8a04',
    description: 'Information gaps or miscommunication',
    examples: ['Missing handover', 'Unclear instructions', 'Language barriers', 'No warning signs']
  },
  EQUIPMENT: {
    label: 'Equipment Issue',
    color: '#16a34a',
    description: 'Tool, machinery, or material problems',
    examples: ['Faulty tools', 'Worn-out equipment', 'Wrong equipment used', 'Missing equipment']
  }
};

export const SeverityCategories = {
  Critical: {
    label: 'Critical',
    color: '#dc2626',
    bgColor: '#fef2f2',
    description: 'Fatality, permanent disability, or major environmental damage. Requires immediate regulatory notification.',
    examples: ['Worker fatality', 'Amputation', 'Major refrigerant release', 'Building collapse']
  },
  High: {
    label: 'High',
    color: '#ea580c',
    bgColor: '#fff7ed',
    description: 'Serious injury requiring hospitalization, or significant property/equipment damage.',
    examples: ['Fractures', 'Electrical shock', 'Major refrigerant leak', 'Fire']
  },
  Medium: {
    label: 'Medium',
    color: '#ca8a04',
    bgColor: '#fefce8',
    description: 'Minor injury requiring first aid, or minor property damage. No lost time.',
    examples: ['Cuts/abrasions', 'Minor burns', 'Small refrigerant leak', 'Slip/trip']
  },
  Low: {
    label: 'Low',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    description: 'Near-miss incident or minor issue. No injury or damage.',
    examples: ['Near miss', 'Potential hazard identified', 'Minor oil spill cleaned immediately']
  }
};
