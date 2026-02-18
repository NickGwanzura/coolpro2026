
import React, { useState, useMemo } from 'react';
import { SizingInputs } from '../types';
import { INSULATION_U_VALUES, Icons, REFRIGERANTS } from '../constants';
import { getTechnicalAdvice } from '../services/gemini';

const SizingTool: React.FC = () => {
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<SizingInputs>({
    step: 1,
    facilityType: 'SUPERMARKET',
    roomWidth: 6,
    roomLength: 8,
    roomHeight: 3.5,
    insulationType: 'PUR',
    insulationThickness: 100,
    ambientTemp: 35,
    targetTemp: -18,
    productMass: 5000,
    productCp: 3.2,
    loadingTimeHours: 24
  });

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const results = useMemo(() => {
    const area = 2 * (inputs.roomWidth * inputs.roomHeight + inputs.roomLength * inputs.roomHeight) + (inputs.roomWidth * inputs.roomLength);
    const uValue = (INSULATION_U_VALUES[inputs.insulationType as keyof typeof INSULATION_U_VALUES] || 0.022) / (inputs.insulationThickness / 1000);
    const tempDiff = inputs.ambientTemp - inputs.targetTemp;
    const transmissionLoad = area * uValue * tempDiff;
    const productLoad = (inputs.productMass * inputs.productCp * tempDiff) / (inputs.loadingTimeHours * 3600);
    const volume = inputs.roomWidth * inputs.roomLength * inputs.roomHeight;
    const infiltrationLoad = (volume * 10 * 0.3 * tempDiff) / 3600;
    const totalLoad = (transmissionLoad + (productLoad * 1000) + infiltrationLoad) * 1.15;
    
    return {
      transmission: transmissionLoad / 1000,
      product: productLoad,
      total: totalLoad / 1000
    };
  }, [inputs]);

  const handleAiConsult = async () => {
    setIsLoadingAi(true);
    const prompt = `Review this commercial refrigeration sizing design for a ${inputs.facilityType}:
    Room: ${inputs.roomWidth}x${inputs.roomLength}x${inputs.roomHeight}m
    Insulation: ${inputs.insulationThickness}mm ${inputs.insulationType}
    Product: ${inputs.productMass}kg meat/produce
    Ambient: ${inputs.ambientTemp}C, Target: ${inputs.targetTemp}C
    Total Calc Load: ${results.total.toFixed(2)}kW.
    Please provide:
    1. Recommended compressor capacity (kW at suction temp).
    2. Evaporator surface area recommendation.
    3. Low-GWP natural refrigerant alternatives (CO2 or Propane) suitable for this load.`;
    
    const advice = await getTechnicalAdvice(prompt);
    setAiAdvice(advice || '');
    setIsLoadingAi(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`flex items-center gap-2 ${step >= i ? 'text-cyan-600' : 'text-slate-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= i ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'}`}>
                {i}
              </div>
              <span className="text-xs font-black uppercase hidden sm:block tracking-widest">
                {i === 1 ? 'Dimensions' : i === 2 ? 'Conditions' : 'Summary'}
              </span>
              {i < 3 && <div className={`w-12 h-0.5 ${step > i ? 'bg-cyan-600' : 'bg-slate-200'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
            {step === 1 && (
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-slate-900">Room Dimensions & Build</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <InputGroup label="Width (m)" value={inputs.roomWidth} onChange={v => setInputs({...inputs, roomWidth: v})} />
                  <InputGroup label="Length (m)" value={inputs.roomLength} onChange={v => setInputs({...inputs, roomLength: v})} />
                  <InputGroup label="Height (m)" value={inputs.roomHeight} onChange={v => setInputs({...inputs, roomHeight: v})} />
                </div>
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Insulation System</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['PUR', 'PIR', 'EPS'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setInputs({...inputs, insulationType: type as any})}
                        className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${inputs.insulationType === type ? 'border-cyan-600 bg-cyan-50 text-cyan-700 shadow-md' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        {type} Core
                      </button>
                    ))}
                  </div>
                  <input 
                    type="range" min="50" max="300" step="10" 
                    value={inputs.insulationThickness} 
                    onChange={e => setInputs({...inputs, insulationThickness: Number(e.target.value)})}
                    className="w-full accent-cyan-600"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>50mm</span>
                    <span className="text-cyan-600 font-black">{inputs.insulationThickness}mm Thickness</span>
                    <span>300mm</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-slate-900">Operating Conditions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <InputGroup label="Ambient Outdoor Temp (°C)" value={inputs.ambientTemp} onChange={v => setInputs({...inputs, ambientTemp: v})} />
                  <InputGroup label="Internal Target Temp (°C)" value={inputs.targetTemp} onChange={v => setInputs({...inputs, targetTemp: v})} />
                  <InputGroup label="Product Mass (kg)" value={inputs.productMass} onChange={v => setInputs({...inputs, productMass: v})} />
                  <InputGroup label="Pull-down Time (Hours)" value={inputs.loadingTimeHours} onChange={v => setInputs({...inputs, loadingTimeHours: v})} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div className="flex items-center gap-6 p-8 bg-slate-900 rounded-3xl text-white">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total System Load</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-cyan-400">{results.total.toFixed(2)}</span>
                      <span className="text-xl font-bold opacity-50">kW</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Icons.Thermometer className="text-cyan-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Heat Gain Breakdown</p>
                    <div className="space-y-3">
                      <BreakdownLine label="Transmission" value={results.transmission} />
                      <BreakdownLine label="Product Load" value={results.product} />
                      <BreakdownLine label="Safety Margin" value={results.total * 0.15} />
                    </div>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Recommended Gas Charge</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">R-744 (CO2)</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">R-290 (Propane)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
              <button 
                onClick={() => setStep(s => Math.max(1, s-1))}
                className={`text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 ${step === 1 ? 'invisible' : ''}`}
              >
                Back
              </button>
              {step < 3 ? (
                <button 
                  onClick={() => setStep(s => Math.min(3, s+1))}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all"
                >
                  Continue to {step === 1 ? 'Conditions' : 'Results'}
                </button>
              ) : (
                <button 
                  onClick={handleAiConsult}
                  disabled={isLoadingAi}
                  className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-cyan-700 shadow-xl shadow-cyan-600/20 flex items-center gap-3"
                >
                  {isLoadingAi ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Icons.Shield className="w-4 h-4" />}
                  Generate Engineering Report
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {aiAdvice ? (
             <div className="bg-cyan-900 text-cyan-50 p-8 rounded-3xl shadow-2xl animate-in zoom-in-95">
                <h4 className="flex items-center gap-2 text-lg font-bold mb-4">
                  <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white"><Icons.Shield /></div>
                  Expert Verification
                </h4>
                <div className="text-xs leading-relaxed space-y-4 opacity-90 prose prose-invert">
                  {aiAdvice.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
                <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors">Download Technical Sheet (PDF)</button>
             </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center opacity-60 h-full">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                  <Icons.Shield className="w-8 h-8" />
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Sizing Completion</p>
               <p className="text-[10px] text-slate-300 mt-2 px-6">Generate results to unlock AI-powered engineering verification and low-GWP guidance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    <input 
      type="number" 
      value={value} 
      onChange={e => onChange(Number(e.target.value))}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
    />
  </div>
);

const BreakdownLine = ({ label, value }: any) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    <span className="text-xs font-black text-slate-800">{value.toFixed(2)} kW</span>
  </div>
);

export default SizingTool;
