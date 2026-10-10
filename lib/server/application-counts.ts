import { db } from '@/db/client';
import {
  registrationApplications,
  studentApplications,
  supplierApplications,
  technicianApplications,
} from '@/db/schema/index';
import { pendingVerificationIds, type ApplicationEntityType } from '@/lib/server/email-verification';
import { countOpenApplications, sumCounts, type ApplicationCounts, type ApplicationLane } from '@/lib/application-counts';

/** Open applications waiting for an admin, and those still waiting on the applicant's email. */
export async function loadApplicationCounts(): Promise<ApplicationCounts> {
  const [students, technicians, professionals, suppliers] = await Promise.all([
    db.select({ id: studentApplications.id, status: studentApplications.status }).from(studentApplications),
    db.select({ id: technicianApplications.id, status: technicianApplications.status }).from(technicianApplications),
    db.select({ id: registrationApplications.id, status: registrationApplications.status }).from(registrationApplications),
    db.select({ id: supplierApplications.id, status: supplierApplications.status }).from(supplierApplications),
  ]);

  const lane = async (entityType: ApplicationEntityType, rows: Array<{ id: string; status: string }>) => {
    const open = rows.filter((row) => row.status === 'submitted' || row.status === 'under-review');
    return countOpenApplications(rows, await pendingVerificationIds(entityType, open.map((row) => row.id)));
  };

  const byLane: Record<ApplicationLane, Awaited<ReturnType<typeof lane>>> = {
    students: await lane('student_application', students),
    technicians: await lane('technician_application', technicians),
    professionals: await lane('registration_application', professionals),
    suppliers: await lane('supplier_application', suppliers),
  };
  return sumCounts(byLane);
}
