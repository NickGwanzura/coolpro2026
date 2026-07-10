import type { RewardItem } from '@/types/index';

// Single source of truth for the redeemable reward catalog — used by the UI to render the
// catalog and by the redemption API to validate rewardId/pointsCost server-side, so a client
// can never submit an arbitrary points cost for a redemption request.
export const TECHNICIAN_REWARDS: RewardItem[] = [
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
