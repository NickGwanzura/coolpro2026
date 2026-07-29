import { redirect } from 'next/navigation';

export default function JobsRedirectPage() {
    redirect('/field-operations?tab=logs');
}
