'use client';

import OccupationalAccidentSection from '@/components/OccupationalAccidentSection';

export default function SafetyPage() {
    return (
        <div className="p-6">
            <OccupationalAccidentSection isAdmin={true} />
        </div>
    );
}
