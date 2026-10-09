/** Roles that use the technician field tools (jobs, installations, gas logs, COC requests). */
export function isFieldWorkerRole(role: string | null | undefined): boolean {
  return role === 'technician' || role === 'contractor';
}
