import { Suspense } from 'react';
import FieldOperations from '@/components/FieldOperations';

export default function FieldOperationsPage() {
    return (
        <Suspense fallback={null}>
            <FieldOperations />
        </Suspense>
    );
}
