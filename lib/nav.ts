
import { Icons } from '../constants';
// Fixed: Updated import path to types/index which contains the NavItem interface definition.
import { NavItem, UserRole } from '../types/index';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Icons.Dashboard,
    roles: ['technician', 'trainer', 'vendor', 'org_admin', 'program_admin'],
  },
  {
    label: 'LMS Academy',
    href: '/learn',
    icon: Icons.Book,
    roles: ['technician', 'trainer', 'program_admin'],
  },
  {
    label: 'Sizing Engine',
    href: '/sizing-tool',
    icon: Icons.Thermometer,
    roles: ['technician', 'program_admin'],
  },
  {
    label: 'Field Operations',
    href: '/field-toolkit',
    icon: Icons.Sync,
    roles: ['technician', 'org_admin', 'program_admin'],
  },
  {
    label: 'Job Postings',
    href: '/jobs',
    icon: Icons.Gauge,
    roles: ['technician', 'org_admin', 'program_admin'],
  },
  {
    label: 'Certifications',
    href: '/certifications',
    icon: Icons.Shield,
    roles: ['technician', 'trainer', 'program_admin'],
  },
  {
    label: 'Rewards & Points',
    href: '/rewards',
    icon: Icons.Award,
    roles: ['technician', 'vendor', 'program_admin'],
  },
  {
    label: 'Program Admin',
    href: '/admin',
    icon: Icons.Shield,
    roles: ['program_admin', 'org_admin'],
  },
];