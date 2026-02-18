
import React from 'react';
import { RewardItem } from '../types';

const REWARDS: RewardItem[] = [
  { id: '1', title: 'Digital Manifold Set 10% Discount', points: 500, vendor: 'Fieldpiece', image: 'https://picsum.photos/seed/tool1/400/300' },
  { id: '2', title: 'Refillable Nitrogen Tank Voucher', points: 300, vendor: 'GasCo', image: 'https://picsum.photos/seed/gas/400/300' },
  { id: '3', title: 'Safe Handling PPE Kit', points: 200, vendor: 'CoolSafe', image: 'https://picsum.photos/seed/ppe/400/300' },
  { id: '4', title: 'Transcritical CO2 Advanced Training', points: 1000, vendor: 'Global HVAC Academy', image: 'https://picsum.photos/seed/train/400/300' },
];

const RewardsHub: React.FC = () => {
  const currentPoints = 850;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
               <h3 className="text-4xl font-black mb-2 tracking-tight">Your Rewards Balance</h3>
               <p className="text-slate-400 font-medium">Earn points by completing training and logging low-leak installs.</p>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-8 rounded-[32px] text-center min-w-[200px]">
               <span className="text-5xl font-black text-cyan-400 leading-none">{currentPoints}</span>
               <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">Points Available</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {REWARDS.map(reward => (
          <div key={reward.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
             <div className="h-48 bg-slate-100 overflow-hidden">
                <img src={reward.image} alt={reward.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div className="p-6 flex-1 flex flex-col">
                <div className="mb-2">
                   <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">{reward.vendor}</span>
                   <h4 className="font-bold text-slate-800 mt-1 leading-tight">{reward.title}</h4>
                </div>
                <div className="mt-auto pt-6 flex items-center justify-between">
                   <div className="text-lg font-black text-slate-900">{reward.points} <span className="text-[10px] font-bold text-slate-400 uppercase">Pts</span></div>
                   <button 
                    disabled={currentPoints < reward.points}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentPoints >= reward.points ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                   >
                     Redeem
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardsHub;
