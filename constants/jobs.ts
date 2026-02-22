export interface Job {
    id: string;
    clientName: string;
    location: string;
    date: string;
    status: 'completed' | 'in-progress' | 'scheduled';
    equipmentType: string;
    serialNumber?: string;
}

export const MOCK_JOBS: Job[] = [
    {
        id: 'job-101',
        clientName: 'Ok Zimbabwe - Harare',
        location: 'First Street, Harare',
        date: '2026-02-20',
        status: 'completed',
        equipmentType: 'Variable Refrigerant Flow (VRF) System',
        serialNumber: 'OKZ-HRE-2026-001'
    },
    {
        id: 'job-102',
        clientName: 'Spar Bulawayo',
        location: 'Fife Street, Bulawayo',
        date: '2026-02-18',
        status: 'completed',
        equipmentType: 'Display Cases (CO2 Transcritical)',
        serialNumber: 'SPR-BYO-2026-042'
    },
    {
        id: 'job-103',
        clientName: 'Delta Beverages',
        location: 'Southerton, Harare',
        date: '2026-02-22',
        status: 'in-progress',
        equipmentType: 'Industrial Chiller',
    }
];
