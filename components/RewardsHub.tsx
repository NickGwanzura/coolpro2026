
import React from 'react';
import { RewardItem } from '../types';
import { Gift, Tag, ArrowRight } from 'lucide-react';

const REWARDS: RewardItem[] = [
  { id: '1', title: 'Digital Manifold Set 10% Discount', points: 500, vendor: 'Fieldpiece', image: 'https://picsum.photos/seed/tool1/400/300' },
  { id: '2', title: 'Refillable Nitrogen Tank Voucher', points: 300, vendor: 'GasCo', image: 'https://picsum.photos/seed/gas/400/300' },
  { id: '3', title: 'Safe Handling PPE Kit', points: 200, vendor: 'CoolSafe', image: 'https://picsum.photos/seed/ppe/400/300' },
  { id: '4', title: 'Transcritical CO2 Advanced Training', points: 1000, vendor: 'Global HVAC Academy', image: 'https://picsum.photos/seed/train/400/300' },
];

const RewardsHub: React.FC = () => {
  const currentPoints = 850;

  return (
    <div className="space-y-8">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">Your Rewards Balance</h3>
            <p className="text-gray-400">Earn points by completing training and logging low-leak installs.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-2xl text-center min-w-[180px]">
            <span className="text-4xl sm:text-5xl font-bold text-blue-400 leading-none">{currentPoints}</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-2">Points Available</p>
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {REWARDS.map(reward => {
          const canRedeem = currentPoints >= reward.points;
          
          return (
            <div 
              key={reward.id} 
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="h-44 bg-gray-100 overflow-hidden">
                <img 
                  src={reward.image} 
                  alt={reward.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-3">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{reward.vendor}</span>
                  <h4 className="font-semibold text-gray-900 mt-1 leading-tight">{reward.title}</h4>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="text-lg font-bold text-gray-900">
                    {reward.points} <span className="text-xs font-medium text-gray-400 uppercase">Pts</span>
                  </div>
                  <button 
                    disabled={!canRedeem}
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      canRedeem 
                        ? 'bg-gray-900 text-white hover:bg-gray-800' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Redeem
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RewardsHub;
