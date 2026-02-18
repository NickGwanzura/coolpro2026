
import React, { useState } from 'react';

const FieldToolkit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'leaks'>('checklist');

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button 
          onClick={() => setActiveTab('checklist')}
          className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'checklist' ? 'bg-white text-cyan-600 border-r border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Commissioning Checklist
        </button>
        <button 
          onClick={() => setActiveTab('leaks')}
          className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'leaks' ? 'bg-white text-cyan-600 border-l border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Refrigerant Log (Offline Sync)
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'checklist' ? (
          <div className="space-y-4">
            <h4 className="text-lg font-bold mb-4">New Installation Verification</h4>
            {[
              "Leak test with Nitrogen @ 25 Bar for 24 hours",
              "Evacuation below 500 Microns",
              "Superheat checked at evaporator outlet",
              "Compressor oil level verified",
              "Label unit with refrigerant GWP data"
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="checkbox" className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500" />
                <span className="text-slate-700 font-medium">{item}</span>
              </label>
            ))}
            <div className="pt-6">
              <button className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold">Complete & Save Locally</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
              <div className="text-amber-600 mt-1">⚠️</div>
              <p className="text-sm text-amber-800">You have <b>3 unsynced logs</b> in your local storage. These will be uploaded when you regain internet connection.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500">Facility Name</label>
                 <input className="w-full border p-2 rounded" placeholder="Supermarket A-1" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500">Refrigerant Added (kg)</label>
                 <input type="number" className="w-full border p-2 rounded" placeholder="0.00" />
               </div>
            </div>
            
            <button className="bg-cyan-600 text-white w-full py-3 rounded-lg font-bold">Log Event (Offline Ready)</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldToolkit;
