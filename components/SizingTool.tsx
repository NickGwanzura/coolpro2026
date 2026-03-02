
import React, { useState, useMemo, useEffect } from 'react';
import { SizingInputs, JobType, JobTypeLabels, JobTypeDefaults, JobTypeImages, JobTypeDescriptions } from '../types';
import { INSULATION_U_VALUES, Icons, REFRIGERANTS } from '../constants';
import { getTechnicalAdvice } from '../services/groq';
import { ChevronRight, ChevronLeft, Calculator, Thermometer, Shield, Sparkles, Download, Snowflake, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';

// Technical References/Sources
const SIZING_SOURCES = [
  { name: 'SANS 5001-1', description: 'South African National Standard for Refrigeration', url: 'https://www.sabs.co.za' },
  { name: 'ASHRAE Fundamentals', description: 'American Society of Heating, Refrigerating and Air-Conditioning Engineers', url: 'https://www.ashrae.org' },
  { name: 'Manufacturer Data', description: 'Equipment specifications and performance data', url: null },
  { name: 'SANS 10142-1', description: 'Wiring of Premises (Electrical)', url: 'https://www.sabs.co.za' },
];

const SizingTool: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<SizingInputs>({
    step: 1,
    facilityType: 'SUPERMARKET',
    jobType: 'COLD_ROOM',
    roomWidth: 6,
    roomLength: 8,
    roomHeight: 3.5,
    insulationType: 'Polyurethane',
    insulationThickness: 100,
    ambientTemp: 35,
    targetTemp: 2,
    productTemp: 20,
    productMass: 5000,
    productCp: 3.2,
    loadingTimeHours: 24
  });

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const handleDownload = () => {
    // Generate PDF using jsPDF
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('HEVACRAZ TECHNICAL SIZING REPORT', 20, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text('HVAC-R Professionals Zimbabwe', 20, 37);
      
      // Technician
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Technician', 20, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${user?.name || 'Demo Technician'}`, 25, 52);
      
      // Job Type
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Job Type', 20, 68);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(JobTypeLabels[inputs.jobType as JobType] || 'Cold Room', 25, 60);
      
      // Room Dimensions
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Room Dimensions', 20, 76);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Width: ${inputs.roomWidth}m`, 25, 55);
      doc.text(`Length: ${inputs.roomLength}m`, 25, 69);
      doc.text(`Height: ${inputs.roomHeight}m`, 25, 76);
      
      // Insulation
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Insulation', 20, 92);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Type: ${inputs.insulationType}`, 25, 102);
      doc.text(`Thickness: ${inputs.insulationThickness}mm`, 25, 109);
      
      // Operating Conditions
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Operating Conditions', 20, 125);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ambient Temperature: ${inputs.ambientTemp}°C`, 25, 135);
      doc.text(`Target Temperature: ${inputs.targetTemp}°C`, 25, 142);
      doc.text(`Product Temperature: ${inputs.productTemp}°C`, 25, 149);
      doc.text(`Product Mass: ${inputs.productMass}kg`, 25, 156);
      doc.text(`Pull-down Time: ${inputs.loadingTimeHours} hours`, 25, 163);
      
      // Calculated Results
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Calculated Results', 20, 172);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Load: ${results.total.toFixed(2)} kW`, 25, 182);
      doc.text(`Transmission Load: ${results.transmission.toFixed(2)} kW`, 25, 189);
      doc.text(`Product Load: ${results.product.toFixed(2)} kW`, 25, 196);
      doc.text(`Infiltration Load: ${results.infiltration.toFixed(2)} kW`, 25, 203);
      doc.text(`Safety Margin (${inputs.jobType === 'C90_FREEZER' ? '25' : inputs.jobType === 'C60_FREEZER' ? '20' : '15'}%): ${(results.total * (inputs.jobType === 'C90_FREEZER' ? 0.25 : inputs.jobType === 'C60_FREEZER' ? 0.20 : 0.15)).toFixed(2)} kW`, 25, 210);
      
      // Refrigerants
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommended Refrigerants', 20, 220);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('• R-744 (CO2) - Low GWP', 25, 230);
      doc.text('• R-290 (Propane) - Low GWP', 25, 237);
      
      // AI Advice if available
      if (aiAdvice) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('AI Technical Advice', 20, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const splitText = doc.splitTextToSize(aiAdvice, 170);
        doc.text(splitText, 20, 35);
      }
      
      // Footer with Sources
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text('Generated by HEVACRAZ Digital Toolkit', 20, 280);
      
      // Sources Section
      doc.setTextColor(100);
      doc.text('References & Sources:', 20, 250);
      doc.setFontSize(9);
      doc.text('1. SANS 5001-1 - South African National Standard for Refrigeration', 20, 258);
      doc.text('2. ASHRAE Fundamentals - American Society of Heating, Refrigerating and Air-Conditioning Engineers', 20, 265);
      doc.text('3. Manufacturer Equipment Data - Specific unit specifications', 20, 272);
      doc.text('4. SANS 10142-1 - Wiring of Premises (Electrical Requirements)', 20, 278);
      
      // Save
      doc.save(`HEVACRAZ_Sizing_Report_${Date.now()}.pdf`);
    });
  };

  const results = useMemo(() => {
    const area = 2 * (inputs.roomWidth * inputs.roomHeight + inputs.roomLength * inputs.roomHeight) + (inputs.roomWidth * inputs.roomLength);
    const uValue = (INSULATION_U_VALUES[inputs.insulationType as keyof typeof INSULATION_U_VALUES] || 0.022) / (inputs.insulationThickness / 1000);
    const tempDiff = inputs.ambientTemp - inputs.targetTemp;
    const productTempDiff = inputs.productTemp - inputs.targetTemp;
    
    // Job type specific multipliers
    const jobTypeMultipliers: Record<JobType, { infiltration: number; product: number; safety: number }> = {
      C40_FREEZER: { infiltration: 1.2, product: 1.1, safety: 1.15 },
      C60_FREEZER: { infiltration: 1.3, product: 1.15, safety: 1.20 },
      C90_FREEZER: { infiltration: 1.5, product: 1.2, safety: 1.25 },
      COLD_ROOM: { infiltration: 1.0, product: 1.0, safety: 1.15 },
      FREEZER_ROOM: { infiltration: 1.1, product: 1.05, safety: 1.15 }
    };
    
    const multipliers = jobTypeMultipliers[inputs.jobType as JobType] || jobTypeMultipliers.COLD_ROOM;
    
    const transmissionLoad = area * uValue * tempDiff;
    const productLoad = (inputs.productMass * inputs.productCp * productTempDiff) / (inputs.loadingTimeHours * 3600);
    const volume = inputs.roomWidth * inputs.roomLength * inputs.roomHeight;
    const infiltrationLoad = (volume * 10 * multipliers.infiltration * tempDiff) / 3600;
    const totalLoad = (transmissionLoad + (productLoad * multipliers.product * 1000) + infiltrationLoad) * multipliers.safety;
    
    return {
      transmission: transmissionLoad / 1000,
      product: productLoad,
      infiltration: infiltrationLoad,
      total: totalLoad / 1000,
      jobType: inputs.jobType
    };
  }, [inputs]);

  const handleAiConsult = async () => {
    setIsLoadingAi(true);
    const prompt = `Review this commercial refrigeration sizing design for a ${JobTypeLabels[inputs.jobType as JobType] || 'Cold Room'}:
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

  const steps = [
    { num: 1, label: 'Dimensions' },
    { num: 2, label: 'Conditions' },
    { num: 3, label: 'Summary' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-blue-600' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-colors ${
                  step >= s.num ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}>
                  {s.num}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Snowflake className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Job Type & Dimensions</h3>
                </div>
                
                {/* Job Type Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-700">Select Job Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(JobTypeLabels) as JobType[]).map((type) => (
                      <button 
                        key={type}
                        onClick={() => {
                          const defaults = JobTypeDefaults[type];
                          setInputs({
                            ...inputs, 
                            jobType: type,
                            targetTemp: defaults.targetTemp,
                            loadingTimeHours: defaults.defaultLoadingTime
                          });
                        }}
                        className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          inputs.jobType === type 
                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src={JobTypeImages[type]} 
                            alt={JobTypeLabels[type]} 
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <div className="text-center w-full">
                            <div className="flex items-center justify-center gap-1 font-semibold">
                              {JobTypeLabels[type]}
                            </div>
                            <p className="text-xs mt-1 opacity-70">{JobTypeDescriptions[type]}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <InputGroup label="Width (m)" value={inputs.roomWidth} onChange={(v: number) => setInputs({...inputs, roomWidth: v})} />
                  <InputGroup label="Length (m)" value={inputs.roomLength} onChange={(v: number) => setInputs({...inputs, roomLength: v})} />
                  <InputGroup label="Height (m)" value={inputs.roomHeight} onChange={(v: number) => setInputs({...inputs, roomHeight: v})} />
                </div>
                
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <label className="text-sm font-semibold text-gray-700">Insulation System</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Polyurethane', 'Polystyrene'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setInputs({...inputs, insulationType: type as any})}
                        className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          inputs.insulationType === type 
                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="pt-4">
                    <input 
                      type="range" min="50" max="300" step="10" 
                      value={inputs.insulationThickness} 
                      onChange={e => setInputs({...inputs, insulationThickness: Number(e.target.value)})}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>50mm</span>
                      <span className="font-semibold text-blue-600">{inputs.insulationThickness}mm Thickness</span>
                      <span>300mm</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Thermometer className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Operating Conditions</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Ambient Temp (°C)" value={inputs.ambientTemp} onChange={(v: number) => setInputs({...inputs, ambientTemp: v})} />
                  <InputGroup label="Target Temp (°C)" value={inputs.targetTemp} onChange={(v: number) => setInputs({...inputs, targetTemp: v})} />
                  <InputGroup label="Product Temp (°C)" value={inputs.productTemp} onChange={(v: number) => setInputs({...inputs, productTemp: v})} />
                  <InputGroup label="Pull-down Time (hrs)" value={inputs.loadingTimeHours} onChange={(v: number) => setInputs({...inputs, loadingTimeHours: v})} />
                  <InputGroup label="Product Mass (kg)" value={inputs.productMass} onChange={(v: number) => setInputs({...inputs, productMass: v})} />
                  <InputGroup label="Product Cp (kJ/kg·K)" value={inputs.productCp} onChange={(v: number) => setInputs({...inputs, productCp: v})} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {/* Results Card */}
                <div className="flex items-center gap-6 p-6 bg-gray-900 rounded-2xl text-white">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400 mb-1">{JobTypeLabels[inputs.jobType as JobType] || 'Cold Room'} - Total System Load</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-bold text-blue-400">{results.total.toFixed(2)}</span>
                      <span className="text-lg font-medium text-gray-400">kW</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center border border-gray-700">
                    <Thermometer className="h-7 w-7 text-blue-400" />
                  </div>
                </div>
                
                {/* Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Heat Gain Breakdown</p>
                    <div className="space-y-2">
                      <BreakdownLine label="Transmission" value={results.transmission} />
                      <BreakdownLine label="Product Load" value={results.product} />
                      <BreakdownLine label="Infiltration" value={results.infiltration} />
                      <BreakdownLine label={`Safety Margin (${inputs.jobType === 'C90_FREEZER' ? '25' : inputs.jobType === 'C60_FREEZER' ? '20' : '15'}%)`} value={results.total * (inputs.jobType === 'C90_FREEZER' ? 0.25 : inputs.jobType === 'C60_FREEZER' ? 0.20 : 0.15)} />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Recommended Refrigerants</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">R-744 (CO₂)</span>
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">R-290 (Propane)</span>
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">R-32</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">SI 49 of 2023 Compliant</p>
                  </div>
                </div>
                
                {/* Calculation Formula */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-semibold text-blue-900 mb-3">Calculation Formula</p>
                  <div className="space-y-2 text-xs font-mono text-blue-800">
                    <p><strong>1. Transmission Load:</strong> Q = A × U × ΔT</p>
                    <p className="pl-4">Where: A = Surface Area (m²), U = U-value (W/m²·K), ΔT = Temperature difference (°C)</p>
                    <p className="pl-4">A = 2(W×H + L×H) + (W×L) = {inputs.roomWidth}m × {inputs.roomHeight}m, etc.</p>
                    <p className="pl-4">U = {INSULATION_U_VALUES[inputs.insulationType as keyof typeof INSULATION_U_VALUES] || 0.022} / {inputs.insulationThickness/1000}m = {(INSULATION_U_VALUES[inputs.insulationType as keyof typeof INSULATION_U_VALUES] || 0.022) / (inputs.insulationThickness/1000)} W/m²·K</p>
                    <p className="pl-4">ΔT = {inputs.ambientTemp}°C - ({inputs.targetTemp}°C) = {inputs.ambientTemp - inputs.targetTemp}°C</p>
                    <p className="pl-4"><strong>Result:</strong> {results.transmission.toFixed(2)} kW</p>
                    
                    <p className="mt-3"><strong>2. Product Load:</strong> Q = (m × Cp × ΔT) / t</p>
                    <p className="pl-4">Where: m = Mass (kg), Cp = Specific heat (kJ/kg·K), ΔT = Temp difference, t = Time (s)</p>
                    <p className="pl-4">Q = ({inputs.productMass}kg × {inputs.productCp}kJ × {inputs.productTemp - inputs.targetTemp}°C) / ({inputs.loadingTimeHours}h × 3600s)</p>
                    <p className="pl-4"><strong>Result:</strong> {results.product.toFixed(2)} kW</p>
                    
                    <p className="mt-3"><strong>3. Infiltration Load:</strong> Q = V × ACH × ΔT / 3600</p>
                    <p className="pl-4">Where: V = Volume (m³), ACH = Air changes/hr, ΔT = Temp difference</p>
                    <p className="pl-4">V = {inputs.roomWidth}m × {inputs.roomLength}m × {inputs.roomHeight}m = {(inputs.roomWidth * inputs.roomLength * inputs.roomHeight).toFixed(1)} m³</p>
                    <p className="pl-4"><strong>Result:</strong> {results.infiltration.toFixed(2)} kW</p>
                    
                    <p className="mt-3"><strong>4. Total Load:</strong> Q_total = (Q_trans + Q_prod + Q_inf) × Safety Factor</p>
                    <p className="pl-4">Safety Factor: {inputs.jobType === 'C90_FREEZER' ? '25%' : inputs.jobType === 'C60_FREEZER' ? '20%' : '15%'}</p>
                    <p className="pl-4 font-bold">Final Total: {results.total.toFixed(2)} kW</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button 
                onClick={() => setStep(s => Math.max(1, s-1))}
                className={`flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors ${step === 1 ? 'invisible' : ''}`}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              {step < 3 ? (
                <button 
                  onClick={() => setStep(s => Math.min(3, s+1))}
                  className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  onClick={handleAiConsult}
                  disabled={isLoadingAi}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoadingAi ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate Engineering Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AI Advice Panel */}
        <div className="space-y-4">
          {aiAdvice ? (
            <div className="bg-gray-900 text-gray-50 p-6 rounded-2xl shadow-lg">
              <h4 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <div className="p-1.5 rounded-lg bg-blue-500">
                  <Shield className="h-4 w-4" />
                </div>
                Expert Verification
              </h4>
              <div className="text-sm leading-relaxed space-y-3 opacity-90">
                {aiAdvice.split('\n').map((line, i) => (
                  line.trim() && <p key={i}>{line}</p>
                ))}
              </div>
              <button 
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 w-full mt-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Technical Sheet
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 mb-4">
                <Shield className="h-7 w-7" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Awaiting Sizing Completion</p>
              <p className="text-xs text-gray-400 mt-2 px-4">
                Complete the sizing wizard to unlock AI-powered engineering verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Technical Sources Section */}
      <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-bold text-gray-900">Technical References</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SIZING_SOURCES.map((source, index) => (
            <div key={index} className="flex items-start gap-3 bg-white/60 p-3 rounded-xl">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-amber-700">{index + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{source.name}</p>
                <p className="text-xs text-gray-600">{source.description}</p>
                {source.url && (
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-1"
                  >
                    View Standard <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <input 
      type="number" 
      value={value} 
      onChange={e => onChange(Number(e.target.value))}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
    />
  </div>
);

const BreakdownLine = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className="text-xs font-semibold text-gray-900">{value.toFixed(2)} kW</span>
  </div>
);

export default SizingTool;
