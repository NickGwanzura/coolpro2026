'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, ShieldCheck, Tag, Truck } from 'lucide-react';
import { useSupplierApplications, useSupplierLedger } from '@/lib/api';
import type { RewardItem, SupplierQuotaStatus } from '@/types/index';

const REWARDS: RewardItem[] = [
  {
    id: '1',
    title: 'Digital Manifold Set 10% Discount',
    points: 500,
    vendor: 'Fieldpiece',
    image: 'https://picsum.photos/seed/tool1/400/300',
  },
  {
    id: '2',
    title: 'Refillable Nitrogen Tank Voucher',
    points: 300,
    vendor: 'GasCo',
    image: 'https://picsum.photos/seed/gas/400/300',
  },
  {
    id: '3',
    title: 'Safe Handling PPE Kit',
    points: 200,
    vendor: 'CoolSafe',
    image: 'https://picsum.photos/seed/ppe/400/300',
  },
  {
    id: '4',
    title: 'Transcritical CO2 Advanced Training',
    points: 1000,
    vendor: 'Global HVAC Academy',
    image: 'https://picsum.photos/seed/train/400/300',
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value));
}

const supplierQuotaStyles: Record<SupplierQuotaStatus, string> = {
  'within-quota': 'bg-emerald-50 text-emerald-700',
  'near-limit': 'bg-amber-50 text-amber-700',
  exceeded: 'bg-rose-50 text-rose-700',
};

export default function RewardsHub({ adminView = false }: { adminView?: boolean }) {
  const currentPoints = 850;
  const { data: supplierApplications = [] } = useSupplierApplications();
  const { data: supplierLedger = [] } = useSupplierLedger();

  const approvedSupplierRows = useMemo(() => {
    const approved = supplierApplications.filter(app => app.status === 'approved');
    return approved.map(app => {
      const totalSalesKg = supplierLedger
        .filter(e => e.supplierId === app.id && e.direction === 'sale')
        .reduce((sum, e) => sum + e.quantityKg, 0);
      const importQuotaKg = 3000;
      const usagePercent = importQuotaKg > 0 ? (totalSalesKg / importQuotaKg) * 100 : 0;
      const quotaStatus: SupplierQuotaStatus =
        usagePercent >= 100 ? 'exceeded' : usagePercent >= 85 ? 'near-limit' : 'within-quota';
      return {
        id: app.id,
        name: app.companyName,
        province: app.province,
        refrigerants: app.refrigerantsSupplied,
        totalSalesKg,
        importQuotaKg,
        usagePercent,
        quotaStatus,
      };
    });
  }, [supplierApplications, supplierLedger]);

  const supplierStats = useMemo(() => {
    const pending = supplierApplications.filter(
      application => application.status === 'submitted' || application.status === 'under-review'
    );
    const approved = supplierApplications.filter(application => application.status === 'approved');

    return {
      approvedSuppliers: approved.length,
      pendingApplications: pending.length,
      regionsCovered: new Set(supplierApplications.map(application => application.province)).size,
      refrigerantCoverage: new Set(
        approved.flatMap(application => application.refrigerantsSupplied)
      ).size,
      pending,
      approved,
    };
  }, [supplierApplications]);

  const rewardSummary = useMemo(() => {
    return {
      totalRewards: REWARDS.length,
      activeVendors: new Set(REWARDS.map(reward => reward.vendor)).size,
      totalPointsExposure: REWARDS.reduce((sum, reward) => sum + reward.points, 0),
      premiumRewards: REWARDS.filter(reward => reward.points >= 500).length,
    };
  }, []);

  if (adminView) {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard label="Active rewards" value={rewardSummary.totalRewards} />
          <OverviewCard label="Participating vendors" value={rewardSummary.activeVendors} />
          <OverviewCard label="Premium rewards" value={rewardSummary.premiumRewards} />
          <OverviewCard label="Points exposure" value={rewardSummary.totalPointsExposure} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reward catalog overview</h3>
              <p className="text-sm text-gray-500">All live rewards currently available across the network</p>
            </div>
            <div className="space-y-3">
              {REWARDS.map(reward => (
                <div key={reward.id} className="flex items-center justify-between border border-gray-200 bg-gray-50 px-4 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{reward.title}</p>
                    <p className="text-sm text-gray-500">{reward.vendor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{reward.points}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-slate-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supplier-backed coverage</h3>
                <p className="text-sm text-gray-500">Reward and supplier network health</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <OverviewCard label="Approved suppliers" value={supplierStats.approvedSuppliers} compact />
              <OverviewCard label="Pending applications" value={supplierStats.pendingApplications} compact />
              <OverviewCard label="Regions covered" value={supplierStats.regionsCovered} compact />
              <OverviewCard label="Refrigerant lines" value={supplierStats.refrigerantCoverage} compact />
            </div>
            <div className="mt-5 space-y-3">
              {supplierStats.approved.length === 0 ? (
                <div className="border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No approved suppliers yet.
                </div>
              ) : (
                supplierStats.approved.map((supplier) => (
                  <div key={supplier.id} className="border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{supplier.companyName}</p>
                        <p className="text-sm text-gray-500">{supplier.province}</p>
                      </div>
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        approved
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{supplier.refrigerantsSupplied.join(', ')}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Points Balance Hero */}
      <section className="overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl">
        <div className="relative p-8">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-20 translate-x-20 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row md:text-left">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold sm:text-3xl">Your Rewards Balance</h3>
              <p className="mt-2 text-gray-400">
                Earn points by completing training and logging low-leak installs.
              </p>
            </div>
            <div className="min-w-[180px] border border-white/10 bg-white/10 p-6 text-center backdrop-blur-md">
              <span className="text-4xl font-bold leading-none text-blue-400 sm:text-5xl">{currentPoints}</span>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Points Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Earn Points */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Earn Points</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { action: 'Complete a training module', points: '+50 pts', color: 'bg-blue-50 text-blue-700' },
            { action: 'Pass a certification exam', points: '+200 pts', color: 'bg-purple-50 text-purple-700' },
            { action: 'Log a low-leak installation', points: '+100 pts', color: 'bg-emerald-50 text-emerald-700' },
            { action: 'Submit a field safety report', points: '+75 pts', color: 'bg-amber-50 text-amber-700' },
          ].map(item => (
            <article key={item.action} className="border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <span className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${item.color}`}>{item.points}</span>
              <p className="text-sm font-medium text-gray-700">{item.action}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Redeemable Rewards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Redeem Rewards</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REWARDS.map((reward) => {
            const canRedeem = currentPoints >= reward.points;
            return (
              <article
                key={reward.id}
                className="group flex flex-col overflow-hidden border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-44 overflow-hidden bg-gray-100">
                  <img
                    src={reward.image}
                    alt={reward.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">{reward.vendor}</span>
                    <h4 className="mt-1 leading-tight font-semibold text-gray-900">{reward.title}</h4>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="text-lg font-bold text-gray-900">
                      {reward.points} <span className="text-xs font-medium uppercase text-gray-400">Pts</span>
                    </div>
                    <button
                      disabled={!canRedeem}
                      className={`inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-all ${
                        canRedeem
                          ? 'bg-gray-900 text-white hover:bg-gray-800'
                          : 'cursor-not-allowed bg-gray-100 text-gray-400'
                      }`}
                    >
                      Redeem
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: number;
  compact?: boolean;
}) {
  return (
    <article className={`border border-gray-200 bg-white shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`${compact ? 'mt-1 text-2xl' : 'mt-2 text-3xl'} font-bold tracking-tight text-gray-900`}>{value}</p>
    </article>
  );
}
