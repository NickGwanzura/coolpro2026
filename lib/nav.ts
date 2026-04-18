
import { Icons } from '../constants';
// Fixed: Updated import path to types/index which contains the NavItem interface definition.
import { NavItem } from '../types/index';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Icons.Dashboard,
    roles: ['technician', 'trainer', 'lecturer', 'org_admin'],
  },
  {
    label: 'RAC Technician Learning Hub',
    href: '/learn',
    icon: Icons.Book,
    roles: ['technician', 'trainer', 'lecturer', 'org_admin'],
    children: [
      {
        label: 'Learning Hub',
        href: '/learn',
        icon: Icons.Book,
        roles: ['technician', 'trainer', 'lecturer', 'org_admin'],
      },
      {
        label: 'Safety',
        href: '/safety',
        icon: Icons.Shield,
        roles: ['technician', 'trainer', 'lecturer', 'org_admin'],
      },
      {
        label: 'Manage Courses',
        href: '/learn/manage',
        icon: Icons.Book,
        roles: ['trainer', 'lecturer'],
      },
    ],
  },
  {
    label: 'WhatGas + Risk Engine',
    href: '/whatgas',
    icon: Icons.Flask,
    roles: ['technician', 'org_admin'],
  },
  {
    label: 'Emergency Mode',
    href: '/emergency-mode',
    icon: Icons.Siren,
    roles: ['technician', 'org_admin'],
  },
  {
    label: 'Commercial Refrigeration System Sizing Tool',
    href: '/sizing-tool',
    icon: Icons.Thermometer,
    roles: ['technician', 'org_admin'],
  },
  {
    label: 'Field Toolkit - Installations, COC, Logs',
    href: '/field-toolkit',
    icon: Icons.Sync,
    roles: ['technician', 'org_admin'],
  },
  {
    label: 'Job Postings',
    href: '/jobs',
    icon: Icons.Gauge,
    roles: ['technician', 'org_admin'],
  },
  {
    label: 'Certifications',
    href: '/certifications',
    icon: Icons.Shield,
    roles: ['technician', 'trainer', 'lecturer', 'org_admin'],
  },
  {
    label: 'Rewards & Points',
    href: '/rewards',
    icon: Icons.Award,
    roles: ['technician', 'org_admin'],
  },
  {
    label: 'Technician Registry',
    href: '/technician-registry',
    icon: Icons.User,
    roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'regulator'],
  },
  {
    label: 'NOU Dashboard',
    href: '/nou-dashboard',
    icon: Icons.Dashboard,
    roles: ['org_admin', 'regulator'],
  },
  {
    label: 'Course Approvals',
    href: '/learn/approvals',
    icon: Icons.Shield,
    roles: ['regulator', 'org_admin'],
  },
  {
    label: 'Supplier Approvals',
    href: '/suppliers/approvals',
    icon: Icons.Shield,
    roles: ['org_admin', 'regulator'],
  },
  {
    label: 'Vendor Reorder',
    href: '/suppliers/reorder',
    icon: Icons.Sync,
    roles: ['vendor'],
  },
  {
    label: 'Verify Buyer',
    href: '/suppliers/verify-buyer',
    icon: Icons.Shield,
    roles: ['vendor'],
  },
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: Icons.Shield,
    roles: ['org_admin'],
  },
];
