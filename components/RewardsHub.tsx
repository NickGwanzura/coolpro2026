'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { useSupplierApplications, useRewardSummary, useRewardRedemptions, createRewardRedemption, reviewRewardRedemption } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { TECHNICIAN_REWARDS, VENDOR_REWARDS } from '@/constants/rewards';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value));
}

export default function RewardsHub({ adminView = false }: { adminView?: boolean }) {
  const { success, error: toastError } = useToast();
  const { data: supplierApplications = [] } = useSupplierApplications(adminView);
  const { data: summary } = useRewardSummary(undefined, !adminView);
  const { data: redemptions = [] } = useRewardRedemptions();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const currentPoints = summary?.availablePoints ?? 0;

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId);
    try {
      await createRewardRedemption(rewardId);
      success('Redemption requested — an admin will review it shortly.');
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to submit redemption request.');
    } finally {
      setRedeemingId(null);
    }
  };

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setReviewingId(id);
    try {
      await reviewRewardRedemption(id, action);
      success(action === 'approve' ? 'Redemption fulfilled.' : 'Redemption rejected.');
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to update redemption.');
    } finally {
      setReviewingId(null);
    }
  };

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

  const rewardCatalogSummary = useMemo(() => {
    return {
      totalRewards: TECHNICIAN_REWARDS.length + VENDOR_REWARDS.length,
      activeVendors: new Set(TECHNICIAN_REWARDS.map(reward => reward.vendor)).size,
      totalPointsExposure:
        TECHNICIAN_REWARDS.reduce((sum, reward) => sum + reward.points, 0) +
        VENDOR_REWARDS.reduce((sum, reward) => sum + reward.points, 0),
      premiumRewards:
        TECHNICIAN_REWARDS.filter(reward => reward.points >= 500).length +
        VENDOR_REWARDS.filter(reward => reward.points >= 500).length,
    };
  }, []);

  const pendingRedemptions = useMemo(() => redemptions.filter(r => r.status === 'requested'), [redemptions]);

  if (adminView) {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard label="Active rewards" value={rewardCatalogSummary.totalRewards} />
          <OverviewCard label="Participating vendors" value={rewardCatalogSummary.activeVendors} />
          <OverviewCard label="Premium rewards" value={rewardCatalogSummary.premiumRewards} />
          <OverviewCard label="Points exposure" value={rewardCatalogSummary.totalPointsExposure} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Redemption queue</h3>
            <p className="text-sm text-gray-500">Technician redemption requests awaiting fulfillment</p>
          </div>
          {pendingRedemptions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              No redemption requests awaiting review.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRedemptions.map(redemption => (
                <div key={redemption.id} className="rounded-lg flex flex-col gap-3 border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {redemption.rewardTitle}
                      <span className="ml-2 inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                        {redemption.userRole}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {redemption.userName} · {redemption.pointsCost} pts · requested {formatDate(redemption.requestedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(redemption.id, 'approve')}
                      disabled={reviewingId === redemption.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Fulfill
                    </button>
                    <button
                      onClick={() => handleReview(redemption.id, 'reject')}
                      disabled={reviewingId === redemption.id}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reward catalog overview</h3>
              <p className="text-sm text-gray-500">All live rewards currently available across the network</p>
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Technician catalog</p>
            <div className="space-y-3">
              {TECHNICIAN_REWARDS.map(reward => (
                <div key={reward.id} className="rounded-lg flex items-center justify-between border border-gray-200 bg-gray-50 px-4 py-4">
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
            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Vendor catalog</p>
            <div className="space-y-3">
              {VENDOR_REWARDS.map(reward => (
                <div key={reward.id} className="rounded-lg flex items-center justify-between border border-gray-200 bg-gray-50 px-4 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{reward.title}</p>
                    <p className="text-sm text-gray-500">{reward.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{reward.points}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No approved suppliers yet.
                </div>
              ) : (
                supplierStats.approved.map((supplier) => (
                  <div key={supplier.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
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
                Earn points by passing exams, completing jobs, and logging responsible refrigerant handling.
              </p>
            </div>
            <div className="min-w-[180px] rounded-lg border border-white/10 bg-white/10 p-6 text-center backdrop-blur-md">
              <span className="text-4xl font-bold leading-none text-blue-400 sm:text-5xl">{currentPoints}</span>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Points Available</p>
              {summary && summary.reservedPoints > 0 && (
                <p className="mt-1 text-[10px] text-gray-500">{summary.reservedPoints} pts reserved in pending redemptions</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How to Earn Points */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Earn Points</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(summary?.breakdown ?? []).map(item => (
            <article key={item.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="inline-block rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">+{item.pointsEach} pts each</span>
              <p className="mt-2 text-sm font-medium text-gray-700">{item.label}</p>
              <p className="mt-1 text-xs text-gray-400">{item.count} logged · {item.totalPoints} pts earned</p>
            </article>
          ))}
        </div>
      </section>

      {/* My Redemptions */}
      {redemptions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Redemption Requests</h2>
          <div className="space-y-2">
            {redemptions.slice(0, 5).map(redemption => {
              const statusStyles: Record<string, string> = {
                requested: 'bg-amber-50 text-amber-700',
                fulfilled: 'bg-emerald-50 text-emerald-700',
                rejected: 'bg-rose-50 text-rose-700',
              };
              return (
                <div key={redemption.id} className="rounded-lg flex items-center justify-between border border-gray-200 bg-white p-3 text-sm">
                  <span className="font-medium text-gray-700">{redemption.rewardTitle}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[redemption.status]}`}>
                    {redemption.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Redeemable Rewards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Redeem Rewards</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TECHNICIAN_REWARDS.map((reward) => {
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
                      disabled={!canRedeem || redeemingId === reward.id}
                      onClick={() => handleRedeem(reward.id)}
                      className={`inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-all ${
                        canRedeem
                          ? 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                          : 'cursor-not-allowed bg-gray-100 text-gray-400'
                      }`}
                    >
                      {redeemingId === reward.id ? 'Requesting…' : 'Redeem'}
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
    <article className={`rounded-lg border border-gray-200 bg-white shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`${compact ? 'mt-1 text-2xl' : 'mt-2 text-3xl'} font-bold tracking-tight text-gray-900`}>{value}</p>
    </article>
  );
}
