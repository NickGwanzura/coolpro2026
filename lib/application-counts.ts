// Counting open applications for the admin alerts. Pure, so it can be tested without a database.

export interface OpenApplication {
  id: string;
  status: string;
}

export interface ApplicationCount {
  /** Open applications whose email is confirmed: these are waiting for an admin. */
  awaitingReview: number;
  /** Open applications still waiting for the applicant to confirm their email. */
  awaitingEmail: number;
}

const OPEN = ['submitted', 'under-review'];

export function countOpenApplications(applications: OpenApplication[], unconfirmedIds: ReadonlySet<string>): ApplicationCount {
  let awaitingReview = 0;
  let awaitingEmail = 0;
  for (const application of applications) {
    if (!OPEN.includes(application.status)) continue;
    if (unconfirmedIds.has(application.id)) awaitingEmail += 1;
    else awaitingReview += 1;
  }
  return { awaitingReview, awaitingEmail };
}

export type ApplicationLane = 'students' | 'technicians' | 'professionals' | 'suppliers';

export interface ApplicationCounts {
  total: ApplicationCount;
  byLane: Record<ApplicationLane, ApplicationCount>;
}

export function sumCounts(byLane: Record<ApplicationLane, ApplicationCount>): ApplicationCounts {
  const lanes = Object.values(byLane);
  return {
    total: {
      awaitingReview: lanes.reduce((sum, lane) => sum + lane.awaitingReview, 0),
      awaitingEmail: lanes.reduce((sum, lane) => sum + lane.awaitingEmail, 0),
    },
    byLane,
  };
}
