
export enum UserRole {
  TECHNICIAN = 'TECHNICIAN',
  TRAINER = 'TRAINER',
  VENDOR = 'VENDOR',
  ORG_ADMIN = 'ORG_ADMIN',
  REGULATOR = 'REGULATOR'
}

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error';

export interface Job {
  id: string;
  clientName: string;
  facilityType: 'SUPERMARKET' | 'COLD_STORAGE' | 'RETAIL';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  lastUpdated: string;
  refrigerantUsage: number;
}

export interface RefrigerantLog {
  id: string;
  date: string;
  type: string;
  amountKg: number;
  action: 'CHARGE' | 'RECOVERY' | 'LEAK_FIX';
  location: string;
  technicianId: string;
  syncStatus: SyncStatus;
}

export interface SizingInputs {
  step: number;
  facilityType: string;
  roomWidth: number;
  roomLength: number;
  roomHeight: number;
  insulationType: 'PUR' | 'PIR' | 'EPS';
  insulationThickness: number;
  ambientTemp: number;
  targetTemp: number;
  productMass: number;
  productCp: number;
  loadingTimeHours: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: number;
  progress: number;
  level: 'BASIC' | 'ADVANCED' | 'GWP_SPECIALIST';
  isDownloaded: boolean;
}

export interface RewardItem {
  id: string;
  title: string;
  points: number;
  vendor: string;
  image: string;
}
