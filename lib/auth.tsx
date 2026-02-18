
"use client";

// Fixed: Re-exporting from auth.ts to ensure a single source of truth and 
// avoid circular dependency issues when the compiler resolves the "auth" module.
export * from './auth';
