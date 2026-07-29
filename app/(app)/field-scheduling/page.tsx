import { redirect } from 'next/navigation';

export default function FieldSchedulingRedirectPage() {
    redirect('/field-operations?tab=schedule');
}
