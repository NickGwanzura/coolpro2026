import type { UserRole } from '@/types/index';

export interface UserSession {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    region: string;
    isDemo: boolean;
}

export const MOCK_USERS: Record<string, UserSession> = {
    technician: {
        id: 'tech-001',
        name: 'Demo Technician',
        email: 'tech@coolpro.demo',
        role: 'technician',
        region: 'Harare',
        isDemo: true,
    },
    trainer: {
        id: 'trainer-001',
        name: 'Demo Trainer',
        email: 'trainer@coolpro.demo',
        role: 'trainer',
        region: 'Bulawayo',
        isDemo: true,
    },
    vendor: {
        id: 'vendor-001',
        name: 'Demo Vendor',
        email: 'vendor@coolpro.demo',
        role: 'vendor',
        region: 'Mutare',
        isDemo: true,
    },
    org_admin: {
        id: 'org-001',
        name: 'Demo Org Admin',
        email: 'org@coolpro.demo',
        role: 'org_admin',
        region: 'Gweru',
        isDemo: true,
    },
    lecturer: {
        id: 'lect-001',
        name: 'Demo Lecturer',
        email: 'lecturer@coolpro.demo',
        role: 'lecturer',
        region: 'Harare',
        isDemo: true,
    },

};
