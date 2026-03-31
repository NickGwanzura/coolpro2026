import { NOUDiscrepancyAlert, NOUGreyMarketAlert, NOUMonthlyTrendPoint, NOURefrigerantBreakdown, NOUStats } from '@/types/index';

export const MOCK_NOU_STATS: NOUStats = {
  totalTechnicians: 847,
  totalPurchasedKg: 12480,
  totalRecoveredKg: 9820,
  emissionsAvoidedTonnes: 14.2,
  flaggedDiscrepancies: 3,
  greyMarketAlerts: 2,
};

export const MOCK_NOU_REFRIGERANT_BREAKDOWN: NOURefrigerantBreakdown[] = [
  { refrigerant: 'R-290', purchasedKg: 4320, percentage: 34.6 },
  { refrigerant: 'R-32', purchasedKg: 3890, percentage: 31.2 },
  { refrigerant: 'R-744', purchasedKg: 2980, percentage: 23.9 },
  { refrigerant: 'R-22', purchasedKg: 1290, percentage: 10.3 },
];

export const MOCK_NOU_MONTHLY_TRENDS: NOUMonthlyTrendPoint[] = [
  { month: 'Jan', purchasedKg: 920, usedKg: 860 },
  { month: 'Feb', purchasedKg: 1010, usedKg: 970 },
  { month: 'Mar', purchasedKg: 1095, usedKg: 1050 },
  { month: 'Apr', purchasedKg: 1180, usedKg: 1125 },
  { month: 'May', purchasedKg: 1265, usedKg: 1210 },
  { month: 'Jun', purchasedKg: 1340, usedKg: 1295 },
];

export const MOCK_NOU_DISCREPANCY_ALERTS: NOUDiscrepancyAlert[] = [
  {
    id: 'disc-001',
    technicianId: '1',
    technicianName: 'Tapiwa Moyo',
    province: 'Harare',
    purchasedKg: 240,
    loggedUsageKg: 185,
    ratio: 1.3,
    flagReason: 'Purchased volume exceeds logged usage by 29%.',
    action: 'investigate',
  },
  {
    id: 'disc-002',
    technicianId: '2',
    technicianName: 'Nyasha Chikomo',
    province: 'Bulawayo',
    purchasedKg: 180,
    loggedUsageKg: 141,
    ratio: 1.28,
    flagReason: 'Mismatch suggests missing recovery logs.',
    action: 'view-profile',
  },
  {
    id: 'disc-003',
    technicianId: '3',
    technicianName: 'Munyaradzi Dube',
    province: 'Midlands',
    purchasedKg: 160,
    loggedUsageKg: 112,
    ratio: 1.43,
    flagReason: 'Large divergence between purchases and register entries.',
    action: 'clear-flag',
  },
];

export const MOCK_NOU_GREY_MARKET_ALERTS: NOUGreyMarketAlert[] = [
  {
    id: 'grey-001',
    technicianId: '4',
    technicianName: 'Tawanda Ncube',
    province: 'Manicaland',
    loggedUsageKg: 95,
    alertReason: 'Usage logged but no approved supplier purchase found.',
    action: 'investigate',
  },
  {
    id: 'grey-002',
    technicianId: '5',
    technicianName: 'Rudo Maphosa',
    province: 'Mashonaland West',
    loggedUsageKg: 68,
    alertReason: 'Recovery activity recorded without supplier traceability.',
    action: 'view-profile',
  },
];
