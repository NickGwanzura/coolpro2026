'use client';

import RewardsHub from '@/components/RewardsHub';

export default function RewardsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
                    <p className="text-gray-500 mt-1">Redeem your points for exclusive rewards and discounts</p>
                </div>
            </div>
            <RewardsHub />
        </div>
    );
}
