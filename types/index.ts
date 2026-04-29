import React from 'react';

export type AppLanguage = 'en' | 'fr';
export type SafetyAlertColor = 'green' | 'orange' | 'red' | 'blue';
export type RefrigerantRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type UserRole = 'technician' | 'trainer' | 'vendor' | 'org_admin' | 'lecturer' | 'regulator';

export const UserRole = {
  TECHNICIAN: 'technician' as const,
  TRAINER: 'trainer' as const,
  VENDOR: 'vendor' as const,
  ORG_ADMIN: 'org_admin' as const,
  LECTURER: 'lecturer' as const,
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
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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

export type PlannerJobStatus = 'scheduled' | 'in-progress' | 'completed' | 'follow-up';
export type RefrigerantSafetyClass = 'A1' | 'A2L' | 'A2' | 'A3' | 'B1' | 'B2L' | 'B2' | 'B3';
export type EquipmentStatus = 'normal' | 'due-soon' | 'overdue';
export type SupplierQuotaStatus = 'within-quota' | 'near-limit' | 'exceeded';

export interface PlannerServiceRecord {
  id: string;
  date: string;
  notes: string;
  technicianName: string;
  status: PlannerJobStatus;
}

export interface PlannerClient {
  id: string;
  name: string;
  clientName?: string;
  technicianId?: string;
  location: string;
  province: string;
  contactPerson: string;
  contactNumber: string;
  contactDetails?: string;
  equipmentIds?: string[];
  jobHistory?: string[];
  serviceHistory: PlannerServiceRecord[];
}

export interface PlannerSafetyChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  appliesTo: RefrigerantSafetyClass[] | 'all';
}

export interface PlannerJob {
  id: string;
  clientId: string;
  clientName: string;
  location: string;
  province: string;
  district?: string;
  technicianId: string;
  technicianName: string;
  jobType: JobType;
  refrigerantClass: RefrigerantSafetyClass;
  scheduledDate: string;
  status: PlannerJobStatus;
  preJobChecklistComplete: boolean;
  checklistItems: PlannerSafetyChecklistItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentRecord {
  id: string;
  clientId?: string;
  equipmentId: string;
  clientName: string;
  manufacturer?: string;
  model?: string;
  province: string;
  refrigerantType: string;
  refrigerantClass?: RefrigerantSafetyClass;
  ashraeSafetyClass: RefrigerantSafetyClass;
  serialNumber?: string;
  healthStatus?: 'healthy' | 'watch' | 'critical';
  lastServiceDate: string;
  nextServiceDue: string;
  status: EquipmentStatus;
  technicianName: string;
  serviceHistory: PlannerServiceRecord[];
  predictedFailureReason?: string;
  recommendedAction?: string;
}

export interface PredictiveAlert {
  id: string;
  equipmentId: string;
  technicianId?: string;
  clientName: string;
  province: string;
  predictedFailureReason: string;
  recommendedAction: string;
  urgency: 'low' | 'medium' | 'high';
  status: EquipmentStatus;
  alertType?: 'service-due' | 'leak-risk' | 'charge-loss' | 'inspection';
  predictedDate?: string;
}

export interface ApprovedSupplier {
  id: string;
  name: string;
  refrigerants: string[];
  approvedRefrigerants?: string[];
  totalSalesKg: number;
  importQuotaKg: number;
  importQuotas?: Record<string, number>;
  usagePercent: number;
  quotaStatus: SupplierQuotaStatus;
  nouApproved: boolean;
  region: string;
}

export type SupplierRegistrationStatus = 'submitted' | 'under-review' | 'approved' | 'rejected';

export interface SupplierRegistration {
  id: string;
  companyName: string;
  tradingName?: string;
  registrationNumber: string;
  supplierType: 'importer' | 'wholesaler' | 'distributor' | 'manufacturer' | 'service-partner';
  contactName: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  refrigerantsSupplied: string[];
  taxNumber?: string;
  pesepayMerchantId?: string;
  website?: string;
  notes?: string;
  status: SupplierRegistrationStatus;
  submittedAt: string;
}

export type SupplierLedgerDirection = 'purchase' | 'sale';

export interface SupplierLedgerEntry {
  id: string;
  supplierId?: string;
  supplierEmail: string;
  supplierName: string;
  direction: SupplierLedgerDirection;
  technicianId?: string;
  technicianRegistrationNumber?: string;
  counterpartyName: string;
  counterpartyCompany?: string;
  counterpartyType: 'importer' | 'distributor' | 'technician' | 'contractor' | 'retailer' | 'cold-chain-client';
  province: string;
  refrigerant: string;
  quantityKg: number;
  unitPriceUsd: number;
  totalValueUsd: number;
  invoiceNumber: string;
  transactionDate: string;
  referenceMonth: string;
  reportedToNou: boolean;
  clientReported: boolean;
  notes?: string;
}

export type ApplicationStatus = 'submitted' | 'under-review' | 'approved' | 'rejected';

export interface StudentApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  polytech: string;
  fieldOfStudy: string;
  studentIdNumber: string;
  enrolmentYear: number;
  idDocumentName?: string;
  status: ApplicationStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
  submittedAt: string;
}

export interface TechnicianApplicationCertification {
  name: string;
  issuingBody: string;
  dateIssued?: string;
  expiryDate?: string;
  certificateNumber?: string;
}

export interface TechnicianApplication {
  id: string;
  name: string;
  nationalId: string;
  registrationNumber: string;
  email: string;
  contactNumber: string;
  province: string;
  district: string;
  region: string;
  specialization: string;
  employmentStatus: 'employed' | 'self-employed' | 'unemployed';
  employer?: string;
  yearsExperience: number;
  certifications: TechnicianApplicationCertification[];
  refrigerantsHandled: string[];
  status: ApplicationStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
  approvedTechnicianId?: string;
  submittedAt: string;
}

export type SupplierComplianceStatus = 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected';

export interface SupplierComplianceApplication {
  id: string;
  supplierEmail: string;
  supplierName: string;
  certificateType: 'distribution-compliance' | 'nou-reporting' | 'traceability-audit';
  monthCoverage: string;
  sitesCovered: number;
  contactPerson: string;
  supportingSummary: string;
  status: SupplierComplianceStatus;
  submittedAt: string;
  notes?: string;
}

export interface RefrigerantDefinition {
  code: string;
  name: string;
  ashraeSafetyClass: RefrigerantSafetyClass;
  alertLevel: SafetyAlertColor;
  odp: number;
  gwp: number;
  nouApproved: boolean;
  ppeRequired: string[];
  handlingPrecautions: string[];
}

export interface NOUStats {
  totalTechnicians: number;
  totalPurchasedKg: number;
  totalRecoveredKg: number;
  emissionsAvoidedTonnes: number;
  flaggedDiscrepancies: number;
  greyMarketAlerts: number;
}

export interface NOURefrigerantBreakdown {
  refrigerant: string;
  purchasedKg: number;
  percentage: number;
}

export interface NOUMonthlyTrendPoint {
  month: string;
  purchasedKg: number;
  usedKg: number;
}

export interface NOUDiscrepancyAlert {
  id: string;
  technicianId: string;
  technicianName: string;
  province: string;
  purchasedKg: number;
  loggedUsageKg: number;
  ratio: number;
  flagReason: string;
  action: 'view-profile' | 'investigate' | 'clear-flag';
}

export interface NOUGreyMarketAlert {
  id: string;
  technicianId: string;
  technicianName: string;
  province: string;
  loggedUsageKg: number;
  alertReason: string;
  action: 'view-profile' | 'investigate' | 'clear-flag';
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
  safetyCategory?: SafetyAlertColor | 'mixed';
  offlineBundleUrl?: string;
  cpd_credits?: number;
}

export interface TrainingSession {
  id: string;
  title: string;
  summary: string;
  venue: string;
  province: string;
  startDate: string;
  endDate: string;
  feeUsd: number;
  seats: number;
  seatsRemaining: number;
  trainerName: string;
  trainerEmail: string;
  status: 'scheduled' | 'open' | 'completed' | 'full';
}

export type TrainerCertificateStatus =
  | 'draft'
  | 'submitted-for-admin-approval'
  | 'admin-approved'
  | 'rejected'
  | 'issued';

export interface TrainerCertificateRequest {
  id: string;
  technicianId: string;
  technicianName: string;
  technicianRegistrationNumber: string;
  technicianCompany: string;
  trainerName: string;
  trainerEmail: string;
  courseTitle: string;
  examDate: string;
  theoryScore: number;
  practicalScore: number;
  overallScore: number;
  notes?: string;
  status: TrainerCertificateStatus;
  submittedAt: string;
  reviewedAt?: string;
  adminReviewer?: string;
  certificateNumber?: string;
  issuedAt?: string;
  verificationToken?: string;
  verificationUrl?: string;
  cpdCredits?: number;
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
  refrigerantsHandled?: string[];
  supplierId?: string;
  registrationDate: string;
  expiryDate: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastRenewalDate?: string;
  nextRenewalDate?: string;
  qrToken?: string;
}

export interface Certification {
  id: string;
  technicianId?: string;
  type?: string;
  name: string;
  issuingBody: string;
  dateIssued: string;
  issueDate?: string;
  expiryDate: string;
  certificateNumber: string;
  status: 'valid' | 'expired' | 'pending';
  cpd_credits?: number;
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
  refrigerantClass?: RefrigerantSafetyClass;
  amount: number;
  actionType: 'Charge' | 'Recovery' | 'Leak Repair';
  timestamp: string;
  approvedSupplierId?: string;
  approvedSupplierName?: string;
  supplierVerified?: boolean;
  pesepayTransactionId?: string;
  odp?: number;
  gwp?: number;
  co2EqEmissions?: number;
  ashraeSafetyClass?: RefrigerantSafetyClass;
  supplierId?: string;
  purchaseTransactionId?: string;
}

// Installation Types
export interface Installation {
  id: string;
  technicianId: string;
  technicianName: string;
  clientName: string;
  location?: string;
  jobDetails: string;
  floorSpace: string;
  jobType: JobType;
  installationDate: string;
  equipmentId?: string;
  ocrScanData?: OcrScanRecord | null;
  nameplateJson?: Record<string, string | number | boolean | null>;
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
  technicianId?: string;
  date: string;
  jobSite: string;
  clientName: string;
  severityClass?: 'Critical' | 'High' | 'Medium' | 'Low';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  technicianName: string;
  refrigerantInvolved?: string;
  nearMissFlag?: boolean;
  nouNotified?: boolean;
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

export interface WhatGasRefrigerantProfile {
  code: string;
  commonName: string;
  ashraeSafetyClass: RefrigerantSafetyClass;
  riskColor: SafetyAlertColor;
  riskLevel: RefrigerantRiskLevel;
  typicalUse: string;
  odp: number;
  gwp: number;
  emergencyNotes: string[];
  fieldChecklist: string[];
  whatGasReference: string;
}

export interface OcrScanRecord {
  id: string;
  createdAt: string;
  rawText: string;
  refrigerantCode?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  matchConfidence?: number;
  whatGasMatch?: WhatGasRefrigerantProfile | null;
}

export interface Equipment {
  id: string;
  clientId: string;
  manufacturer: string;
  model: string;
  refrigerantType: string;
  refrigerantClass: RefrigerantSafetyClass;
  serialNumber: string;
  healthStatus: 'healthy' | 'watch' | 'critical';
}

export interface SafetySession {
  id: string;
  technicianId: string;
  query: string;
  response: string;
  sourceDocuments: string[];
  refrigerantClass?: RefrigerantSafetyClass;
  createdAt: string;
  language: AppLanguage;
  emergencyMode: boolean;
}

export interface ImageRecord {
  id: string;
  jobId: string;
  beforeAfter: 'before' | 'after' | 'inspection';
  annotationsJson: Array<{
    id: string;
    x: number;
    y: number;
    label: string;
  }>;
  gpsTag?: string;
  imageDataUrl: string;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  totalHandlers: number;
  totalKgPurchased: number;
  totalKgRecovered: number;
  emissionsAvoided: number;
  leakIncidents: number;
}

export interface ClientProfile {
  id: string;
  technicianId: string;
  clientName: string;
  contactDetails: string;
  location: string;
  equipmentIds: string[];
  jobHistory: string[];
}

export interface JobReport {
  id: string;
  jobId: string;
  technicianId: string;
  pdfUrl: string;
  sentToClient: boolean;
  workPerformed: string;
  refrigerantUsed: string;
  photos: string[];
}

export interface SupplyChainPurchase {
  id: string;
  technicianId: string;
  supplierId: string;
  refrigerantType: string;
  quantityKg: number;
  pesepayTransactionId?: string;
}

export interface RewardAccount {
  id: string;
  technicianId: string;
  totalPoints: number;
  tier: 'starter' | 'pro' | 'elite';
}

export interface MaintenanceAlert {
  id: string;
  equipmentId: string;
  technicianId: string;
  alertType: 'service-due' | 'leak-risk' | 'charge-loss' | 'inspection';
  predictedDate: string;
  status: 'open' | 'scheduled' | 'resolved';
}

export interface EmergencySafetyScript {
  id: string;
  language: AppLanguage;
  title: string;
  refrigerantCode: string;
  severity: SafetyAlertColor;
  steps: string[];
  offlineReady: boolean;
}

export interface CertificateRecord {
  id: string;
  technicianId: string;
  technicianName: string;
  certificateNumber: string;
  certificateType: string;
  issuingBody: string;
  issueDate: string;
  expiryDate: string;
  verificationToken: string;
  verificationUrl: string;
  status: 'valid' | 'expired' | 'revoked' | 'pending';
}
