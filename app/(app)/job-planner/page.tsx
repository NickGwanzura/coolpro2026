import { redirect } from 'next/navigation';

export default function JobPlannerRedirectPage() {
    redirect('/field-operations?tab=planner');
}
