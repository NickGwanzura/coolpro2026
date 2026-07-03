import type { UserRole } from '@/types/index';

export interface UserSession {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    region: string;
    isDemo: boolean;
}
