
"use client";

import React from 'react';
import { useAuth } from '../lib/auth';
import { UserRole } from '../types';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

// Fixed: Added React import to resolve React namespace and support React.ReactNode for component props.
export default function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}