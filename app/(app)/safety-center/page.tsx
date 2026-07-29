import { Suspense } from 'react';
import SafetyCenter from '@/components/SafetyCenter';

export default function SafetyCenterPage() {
    return (
        <Suspense fallback={null}>
            <SafetyCenter />
        </Suspense>
    );
}
