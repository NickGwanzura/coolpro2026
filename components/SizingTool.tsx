
import React, { useState, useMemo, useEffect } from 'react';
import { SizingInputs, JobType, JobTypeLabels, JobTypeDefaults, JobTypeImages, JobTypeDescriptions, ProcessingMode, ProcessingModeLabels, ProcessingModeDescriptions } from '../types';
import { INSULATION_U_VALUES, Icons, REFRIGERANTS } from '../constants';
import { ChevronRight, ChevronLeft, Calculator, Thermometer, Shield, Sparkles, Download, Snowflake, ExternalLink, Gauge, ArrowUpDown, Droplets } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { REFRIGERANT_REFERENCE } from '@/constants/refrigerants';

// Technical References/Sources
const SIZING_SOURCES = [
  { name: 'SANS 5001-1', description: 'South African National Standard for Refrigeration', url: 'https://www.sabs.co.za' },
  { name: 'ASHRAE Fundamentals', description: 'American Society of Heating, Refrigerating and Air-Conditioning Engineers', url: 'https://www.ashrae.org' },
  { name: 'Manufacturer Data', description: 'Equipment specifications and performance data', url: null },
  { name: 'SANS 10142-1', description: 'Wiring of Premises (Electrical)', url: 'https://www.sabs.co.za' },
];

type CalculatorTab = 'wizard' | 'superheat' | 'pt-chart' | 'leak-rate' | 'converter';
type RefrigerantCode = 'R-290' | 'R-32' | 'R-744' | 'R-22';
type ConverterType = 'temperature' | 'pressure' | 'mass' | 'airflow' | 'energy';

const PT_CURVES: Record<RefrigerantCode, { temp: number; pressure: number }[]> = {
  'R-290': [
    { temp: -20, pressure: 1.8 },
    { temp: -10, pressure: 2.4 },
    { temp: 0, pressure: 3.2 },
    { temp: 10, pressure: 4.3 },
    { temp: 20, pressure: 5.8 },
    { temp: 30, pressure: 7.7 },
    { temp: 40, pressure: 10.1 },
  ],
  'R-32': [
    { temp: -20, pressure: 4.8 },
    { temp: -10, pressure: 6.2 },
    { temp: 0, pressure: 7.9 },
    { temp: 10, pressure: 10.0 },
    { temp: 20, pressure: 12.5 },
    { temp: 30, pressure: 15.5 },
    { temp: 40, pressure: 19.2 },
  ],
  'R-744': [
    { temp: -20, pressure: 17.0 },
    { temp: -10, pressure: 22.0 },
    { temp: 0, pressure: 27.5 },
    { temp: 10, pressure: 34.5 },
    { temp: 20, pressure: 42.5 },
    { temp: 30, pressure: 52.0 },
    { temp: 40, pressure: 64.0 },
  ],
  'R-22': [
    { temp: -20, pressure: 2.4 },
    { temp: -10, pressure: 3.3 },
    { temp: 0, pressure: 4.6 },
    { temp: 10, pressure: 6.1 },
    { temp: 20, pressure: 8.1 },
    { temp: 30, pressure: 10.6 },
    { temp: 40, pressure: 13.6 },
  ],
};

const MAX_OPERATING_PRESSURE: Record<RefrigerantCode, number> = {
  'R-290': 10,
  'R-32': 16,
  'R-744': 60,
  'R-22': 13,
};

const CONVERTER_OPTIONS: Record<ConverterType, { units: string[] }> = {
  temperature: { units: ['C', 'F', 'K'] },
  pressure: { units: ['bar', 'psi', 'Pa'] },
  mass: { units: ['kg', 'lb'] },
  airflow: { units: ['m3/h', 'CFM'] },
  energy: { units: ['kW', 'BTU/h'] },
};

const interpolateTempFromPressure = (curve: { temp: number; pressure: number }[], pressure: number) => {
  const sorted = [...curve].sort((a, b) => a.pressure - b.pressure);
  if (pressure <= sorted[0].pressure) return sorted[0].temp;
  if (pressure >= sorted[sorted.length - 1].pressure) return sorted[sorted.length - 1].temp;

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (pressure >= current.pressure && pressure <= next.pressure) {
      const ratio = (pressure - current.pressure) / (next.pressure - current.pressure);
      return current.temp + ratio * (next.temp - current.temp);
    }
  }

  return sorted[0].temp;
};

const convertValue = (value: number, type: ConverterType, from: string, to: string) => {
  if (from === to) return value;

  if (type === 'temperature') {
    const celsius =
      from === 'C' ? value :
      from === 'F' ? ((value - 32) * 5) / 9 :
      value - 273.15;

    return to === 'C' ? celsius : to === 'F' ? (celsius * 9) / 5 + 32 : celsius + 273.15;
  }

  if (type === 'pressure') {
    const bar = from === 'bar' ? value : from === 'psi' ? value / 14.5038 : value / 100000;
    return to === 'bar' ? bar : to === 'psi' ? bar * 14.5038 : bar * 100000;
  }

  if (type === 'mass') {
    const kg = from === 'kg' ? value : value / 2.20462;
    return to === 'kg' ? kg : kg * 2.20462;
  }

  if (type === 'airflow') {
    const metric = from === 'm3/h' ? value : value * 1.699;
    return to === 'm3/h' ? metric : metric / 1.699;
  }

  const kw = from === 'kW' ? value : value / 3412.142;
  return to === 'kW' ? kw : kw * 3412.142;
};

const SizingTool: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<SizingInputs>({
    step: 1,
    facilityType: 'SUPERMARKET',
    jobType: 'COLD_ROOM',
    processingMode: 'FREEZING',
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
    loadingTimeHours: 24,
    blastAirTemp: -35,
    blastAirVelocity: 4.5,
    blastCycleDurationMinutes: 240,
    blastPharmaMode: false,
    holdTargetTemp: 2,
    holdRHPreset: 'general',
    holdRH: 65,
    holdDefrostCyclesPerDay: 4,
    holdDefrostDurationMin: 15,
    holdAirVelocity: 0.2,
    holdRecoveryTimeSec: 75,
    holdFloorClearanceCm: 15,
    holdAirflowClearanceCm: 7,
    freezeStorageTemp: -20,
    freezeRateCHour: 15,
    freezeAirVelocity: 3.0,
    freezeProductThicknessMm: 100,
    freezeBioStorage: false,
  });

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [activeCalculator, setActiveCalculator] = useState<CalculatorTab>('wizard');
  const [selectedRefrigerant, setSelectedRefrigerant] = useState<RefrigerantCode>('R-290');
  const [superheatInputs, setSuperheatInputs] = useState({
    suctionPressure: 3.2,
    suctionTemp: 8,
    liquidTemp: 28,
    liquidPressure: 7.7
  });
  const [leakInputs, setLeakInputs] = useState({
    leakRate: 12,
    refrigerantCode: 'R-32' as RefrigerantCode
  });
  const [converterType, setConverterType] = useState<ConverterType>('temperature');
  const [converterValue, setConverterValue] = useState(25);
  const [converterFrom, setConverterFrom] = useState('C');
  const [converterTo, setConverterTo] = useState('F');

  useEffect(() => {
    const [defaultFrom, defaultTo] = CONVERTER_OPTIONS[converterType].units;
    setConverterFrom(defaultFrom);
    setConverterTo(defaultTo ?? defaultFrom);
  }, [converterType]);

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
      
      // Job Type & Processing Mode
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Job Configuration', 20, 62);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Type: ${JobTypeLabels[inputs.jobType as JobType] || 'Cold Room'}`, 25, 72);
      doc.text(`Mode: ${ProcessingModeLabels[inputs.processingMode]}`, 25, 81);

      // Processing mode details
      let modeLines = 0;
      if (inputs.processingMode === 'BLASTING') {
        doc.text(`Air Temp: ${inputs.blastAirTemp}°C`, 25, 91);
        doc.text(`Air Velocity: ${inputs.blastAirVelocity.toFixed(1)} m/s`, 25, 100);
        doc.text(`Core Target: -18°C`, 25, 109);
        doc.text(`Cycle Duration: ${inputs.blastCycleDurationMinutes} min`, 25, 118);
        modeLines = 4;
        if (inputs.blastPharmaMode) {
          doc.text(`Pharmaceutical Mode: Active`, 25, 127);
          modeLines = 5;
        }
      } else if (inputs.processingMode === 'HOLDING') {
        doc.text(`Target Temp: ${inputs.holdTargetTemp}°C`, 25, 91);
        doc.text(`Relative Humidity: ${inputs.holdRH}%`, 25, 100);
        doc.text(`Defrost: ${inputs.holdDefrostCyclesPerDay}x/day, ${inputs.holdDefrostDurationMin} min`, 25, 109);
        doc.text(`Air Velocity: ${inputs.holdAirVelocity.toFixed(2)} m/s`, 25, 118);
        doc.text(`Recovery Time: ${inputs.holdRecoveryTimeSec}s`, 25, 127);
        doc.text(`Floor Clearance: ${inputs.holdFloorClearanceCm}cm · Wall Clearance: ${inputs.holdAirflowClearanceCm}cm`, 25, 136);
        modeLines = 6;
      } else if (inputs.processingMode === 'FREEZING') {
        doc.text(`Storage Temp: ${inputs.freezeStorageTemp}°C`, 25, 91);
        doc.text(`Freezing Rate: ${inputs.freezeRateCHour}°C/hr`, 25, 100);
        doc.text(`Air Velocity: ${inputs.freezeAirVelocity.toFixed(1)} m/s`, 25, 109);
        doc.text(`Product Thickness: ${inputs.freezeProductThicknessMm} mm`, 25, 118);
        doc.text(`Target Core Temp: -18°C`, 25, 127);
        modeLines = 5;
        if (inputs.freezeBioStorage) {
          doc.text(`Biological Storage: Active (down to -80°C)`, 25, 136);
          modeLines = 6;
        }
      }

      // Calculate where Room Dimensions starts based on mode lines
      const roomDimHeader = inputs.processingMode !== 'FREEZING' && inputs.processingMode !== 'HOLDING' && inputs.processingMode !== 'BLASTING'
        ? 92
        : 91 + modeLines * 9 + 10;

      // Room Dimensions
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Room Dimensions', 20, roomDimHeader);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Width: ${inputs.roomWidth}m`, 25, roomDimHeader + 10);
      doc.text(`Length: ${inputs.roomLength}m`, 25, roomDimHeader + 19);
      doc.text(`Height: ${inputs.roomHeight}m`, 25, roomDimHeader + 28);

      const roomDimEnd = roomDimHeader + 28;
      
      // Calculate dynamic y-offset for sections after room dimensions
      const blastOffset = roomDimEnd;
      const insY = blastOffset + 15;
      const opsY = insY + 25;
      const calcY = opsY + 45;
      // Holding mode has more calculated result lines (7 vs 5)
      // Freezing mode adds 2 extra lines (freezing time, critical zone)
      const calcLines = results.isHolding ? 7 : results.isFreezing ? 7 : 5;
      const refrigY = calcY + 20 + calcLines * 9;
      
      // Insulation
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Insulation', 20, insY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Type: ${inputs.insulationType}`, 25, insY + 10);
      doc.text(`Thickness: ${inputs.insulationThickness}mm`, 25, insY + 19);
      
      // Operating Conditions
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Operating Conditions', 20, opsY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ambient Temperature: ${inputs.ambientTemp}°C`, 25, opsY + 10);
      doc.text(`Target Temperature: ${inputs.targetTemp}°C`, 25, opsY + 19);
      doc.text(`Product Temperature: ${inputs.productTemp}°C`, 25, opsY + 28);
      doc.text(`Product Mass: ${inputs.productMass}kg`, 25, opsY + 37);
      doc.text(`Pull-down Time: ${inputs.loadingTimeHours} hours`, 25, opsY + 46);
      
      // Calculated Results
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Calculated Results', 20, calcY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const safetyPct = inputs.jobType === 'C90_FREEZER' ? 25 : inputs.jobType === 'C60_FREEZER' ? 20 : 15;
      if (results.isHolding) {
        doc.text(`Total Load: ${results.total.toFixed(2)} kW`, 25, calcY + 10);
        doc.text(`Transmission: ${results.transmission.toFixed(2)} kW`, 25, calcY + 19);
        doc.text(`Product: ${results.product.toFixed(2)} kW`, 25, calcY + 28);
        doc.text(`Infiltration: ${results.infiltration.toFixed(2)} kW (RH×Recovery adj.)`, 25, calcY + 37);
        doc.text(`Defrost (${inputs.holdDefrostCyclesPerDay}x${inputs.holdDefrostDurationMin}min): ${results.defrost.toFixed(2)} kW`, 25, calcY + 46);
        doc.text(`Internal Load: ${results.internal.toFixed(2)} kW`, 25, calcY + 55);
        doc.text(`Safety Margin (${safetyPct}%): ${(results.total * safetyPct / 100).toFixed(2)} kW`, 25, calcY + 64);
      } else if (results.isFreezing) {
        doc.text(`Total Load: ${results.total.toFixed(2)} kW`, 25, calcY + 10);
        doc.text(`Transmission Load: ${results.transmission.toFixed(2)} kW`, 25, calcY + 19);
        doc.text(`Product Load: ${results.product.toFixed(2)} kW`, 25, calcY + 28);
        doc.text(`Infiltration Load: ${results.infiltration.toFixed(2)} kW`, 25, calcY + 37);
        doc.text(`Core Freezing Time: ${results.freezingTimeHours.toFixed(1)} hrs`, 25, calcY + 46);
        doc.text(`Critical Zone Transit: ${results.criticalZoneHours.toFixed(2)} hrs`, 25, calcY + 55);
        doc.text(`Safety Margin (${safetyPct}%): ${(results.total * safetyPct / 100).toFixed(2)} kW`, 25, calcY + 64);
      } else {
        doc.text(`Total Load: ${results.total.toFixed(2)} kW`, 25, calcY + 10);
        doc.text(`Transmission Load: ${results.transmission.toFixed(2)} kW`, 25, calcY + 19);
        doc.text(`Product Load: ${results.product.toFixed(2)} kW`, 25, calcY + 28);
        doc.text(`Infiltration Load: ${results.infiltration.toFixed(2)} kW`, 25, calcY + 37);
        doc.text(`Safety Margin (${safetyPct}%): ${(results.total * safetyPct / 100).toFixed(2)} kW`, 25, calcY + 46);
      }
      
      // Refrigerants
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommended Refrigerants', 20, refrigY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('• R-744 (CO2) - Low GWP', 25, refrigY + 10);
      doc.text('• R-290 (Propane) - Low GWP', 25, refrigY + 19);
      
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
      
      // Equipment Sizing (Right Column)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Equipment Sizing', 105, 172);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Compressor: ${equipmentSpecs.compressorSize}`, 110, 182);
      doc.text(`Evaporator: ${equipmentSpecs.evaporatorSize}`, 110, 189);
      doc.text(`Expansion: ${equipmentSpecs.valveType}`, 110, 196);
      doc.text(`Size: ${equipmentSpecs.txvSize}`, 110, 203);
      doc.text(`Liquid Line: ${equipmentSpecs.liquidLine}`, 110, 210);
      doc.text(`Suction Line: ${equipmentSpecs.suctionLine}`, 110, 217);
      doc.text(`Est. Pipe Length: ${equipmentSpecs.estimatedPipeLength}m`, 110, 224);
      
      // Save
      doc.save(`HEVACRAZ_Sizing_Report_${Date.now()}.pdf`);
    });
  };

  const results = useMemo(() => {
    const isHolding = inputs.processingMode === 'HOLDING';
    const area = 2 * (inputs.roomWidth * inputs.roomHeight + inputs.roomLength * inputs.roomHeight) + (inputs.roomWidth * inputs.roomLength);
    const floorArea = inputs.roomWidth * inputs.roomLength;
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
    
    // Base infiltration (W)
    const baseInfiltration = (volume * 10 * multipliers.infiltration * tempDiff) / 3600;
    
    // Holding-mode adjustments
    let infiltrationLoad = baseInfiltration;
    let defrostLoad = 0;
    let internalLoad = 0;
    let rhInfiltrationMultiplier = 1;
    let recoveryInfiltrationMultiplier = 1;
    
    if (isHolding) {
      // RH latent load adjustment: higher RH = more moisture infiltration = more latent heat
      // Baseline at 65% RH = no adjustment
      rhInfiltrationMultiplier = 1 + (Math.min(inputs.holdRH, 95) - 65) * 0.005;
      
      // Recovery time: faster recovery = better door seal = less infiltration
      // Baseline at 75s = 1.0, 30s = 0.85, 180s = 1.3
      recoveryInfiltrationMultiplier = 0.85 + (Math.max(inputs.holdRecoveryTimeSec, 30) - 30) * (1.3 - 0.85) / (180 - 30);
      
      // Apply infiltration modifiers
      infiltrationLoad = baseInfiltration * rhInfiltrationMultiplier * recoveryInfiltrationMultiplier;
      
      // Defrost heat load: electric defrost heaters at ~40 W/m² floor area
      // Q = (P_defrost × duration_min × 60 × cycles_per_day) / (24h × 3600s/h)
      const defrostPowerW = floorArea * 40; // 40 W/m² electric heater density
      defrostLoad = (defrostPowerW * inputs.holdDefrostDurationMin * 60 * inputs.holdDefrostCyclesPerDay) / (24 * 3600);
      
      // Internal load: lights (~10 W/m² LED), fans (~5 W/m²), occupancy (~100 W for 1hr/day)
      const lightingW = floorArea * 10;
      const fanW = floorArea * 5;
      const occupancyW = 100 / 24; // 1 person 100W averaged over 24h
      internalLoad = lightingW + fanW + occupancyW;
    }
    
    // Freezing time estimate (FREEZING mode)
    // Core freezing time = (Product Temp - Target Core) / Freezing Rate × Thickness Factor
    // Thickness factor: baseline at 50mm = 1.0, each additional 100mm adds 20% more time
    const isFreezing = inputs.processingMode === 'FREEZING';
    const freezeTargetCore = -18; // Universal standard for safe long-term preservation
    const freezeThicknessFactor = 1 + 0.2 * Math.max(0, (inputs.freezeProductThicknessMm - 50) / 100);
    const freezingTimeHours = isFreezing
      ? Math.max(0, (inputs.productTemp - freezeTargetCore) / inputs.freezeRateCHour) * freezeThicknessFactor
      : 0;
    const criticalZoneHours = isFreezing
      ? (4 / inputs.freezeRateCHour) * freezeThicknessFactor
      : 0;

    const totalLoad = (transmissionLoad + (productLoad * multipliers.product * 1000) + infiltrationLoad + defrostLoad + internalLoad) * multipliers.safety;
    
    return {
      transmission: transmissionLoad / 1000,
      product: productLoad,
      infiltration: infiltrationLoad / 1000,
      defrost: defrostLoad / 1000,
      internal: internalLoad / 1000,
      total: totalLoad / 1000,
      rhInfiltrationMultiplier,
      recoveryInfiltrationMultiplier,
      isHolding,
      isFreezing,
      freezingTimeHours,
      criticalZoneHours,
      freezeTargetCore,
      freezeThicknessFactor,
      jobType: inputs.jobType
    };
  }, [inputs]);

  const equipmentSpecs = useMemo(() => {
    const capacityKw = results.total;
    const capacityHp = capacityKw / 0.746;
    const capacityTons = capacityKw / 3.517;

    const compressorSize = `${Math.ceil(capacityHp * 1.2)} HP (${(capacityKw * 1.2).toFixed(1)} kW Cooling Capacity)`;
    const evaporatorSize = `${(capacityKw * 1.2).toFixed(1)} kW`;
    
    const isCapTube = capacityTons < 0.5;
    const valveType = isCapTube ? 'Capillary Tube' : 'Thermostatic Expansion Valve (TXV)';
    const txvSize = isCapTube 
      ? '0.042" to 0.054" ID, Length: 1.5m - 3m' 
      : capacityTons < 1.0 ? 'Orifice #0 or #1' 
      : capacityTons < 2.0 ? 'Orifice #2' 
      : capacityTons < 3.0 ? 'Orifice #3' 
      : capacityTons < 5.0 ? 'Orifice #4' 
      : 'Orifice #5 or #6';
                   
    let liquidLine = '1/4"';
    let suctionLine = '3/8"';
    if (capacityTons >= 0.5 && capacityTons < 1.5) { liquidLine = '3/8"'; suctionLine = '1/2"'; } 
    else if (capacityTons >= 1.5 && capacityTons < 3.0) { liquidLine = '3/8"'; suctionLine = '5/8"'; } 
    else if (capacityTons >= 3.0 && capacityTons < 5.0) { liquidLine = '1/2"'; suctionLine = '7/8"'; } 
    else if (capacityTons >= 5.0 && capacityTons < 7.5) { liquidLine = '1/2"'; suctionLine = '1-1/8"'; } 
    else if (capacityTons >= 7.5) { liquidLine = '5/8"'; suctionLine = '1-3/8"'; }

    const estimatedPipeLength = Math.ceil((inputs.roomWidth + inputs.roomLength + inputs.roomHeight) * 1.5);

    return { compressorSize, evaporatorSize, valveType, txvSize, liquidLine, suctionLine, estimatedPipeLength };
  }, [results.total, inputs.roomWidth, inputs.roomLength, inputs.roomHeight]);

  const handleAiConsult = async () => {
    setIsLoadingAi(true);
    const prompt = `Review this commercial refrigeration sizing design for a ${JobTypeLabels[inputs.jobType as JobType] || 'Cold Room'}:
    Room: ${inputs.roomWidth}x${inputs.roomLength}x${inputs.roomHeight}m
    Insulation: ${inputs.insulationThickness}mm ${inputs.insulationType}
    Product: ${inputs.productMass}kg meat/produce
    Ambient: ${inputs.ambientTemp}C, Target: ${inputs.targetTemp}C
    Total Calc Load: ${results.total.toFixed(2)}kW.
    Preliminary Component Sizing:
    - Compressor: ${equipmentSpecs.compressorSize}
    - Evaporator: ${equipmentSpecs.evaporatorSize}
    - Expansion Device: ${equipmentSpecs.valveType} (${equipmentSpecs.txvSize})
    - Pipe Sizes: Liquid ${equipmentSpecs.liquidLine}, Suction ${equipmentSpecs.suctionLine}
    Please provide:
    1. Verification of the preliminary component sizing.
    2. Specific low-GWP natural refrigerant alternatives suitable for this load.
    3. Any additional field recommendations for this specific setup.`;
    
    try {
      const res = await fetch('/api/sizing-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      setAiAdvice(res.ok ? (data.advice ?? '') : (data.error ?? 'Technical assistant unavailable.'));
    } catch {
      setAiAdvice('Technical assistant unavailable. Please check your network connection.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const steps = [
    { num: 1, label: 'Dimensions' },
    { num: 2, label: 'Conditions' },
    { num: 3, label: 'Summary' }
  ];

  const saturationTempLow = useMemo(
    () => interpolateTempFromPressure(PT_CURVES[selectedRefrigerant], superheatInputs.suctionPressure),
    [selectedRefrigerant, superheatInputs.suctionPressure]
  );

  const saturationTempHigh = useMemo(
    () => interpolateTempFromPressure(PT_CURVES[selectedRefrigerant], superheatInputs.liquidPressure),
    [selectedRefrigerant, superheatInputs.liquidPressure]
  );

  const superheatValue = Number((superheatInputs.suctionTemp - saturationTempLow).toFixed(1));
  const subcoolingValue = Number((saturationTempHigh - superheatInputs.liquidTemp).toFixed(1));

  const superheatStatus =
    superheatValue < 5 ? 'Low' : superheatValue > 12 ? 'High' : 'Optimal';
  const subcoolingStatus =
    subcoolingValue < 3 ? 'Low' : subcoolingValue > 10 ? 'High' : 'Optimal';

  const leakEquivalent = useMemo(() => {
    const refrigerant = REFRIGERANT_REFERENCE[leakInputs.refrigerantCode];
    const co2eq = (leakInputs.leakRate * refrigerant.gwp) / 1000;
    const carJourneys = Math.round(co2eq * 245);
    return {
      co2eq: Number(co2eq.toFixed(2)),
      carJourneys,
      refrigerant
    };
  }, [leakInputs]);

  const convertedValue = useMemo(
    () => convertValue(converterValue, converterType, converterFrom, converterTo),
    [converterFrom, converterTo, converterType, converterValue]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { id: 'wizard', label: 'Cooling Load Wizard', icon: Calculator },
            { id: 'superheat', label: 'Superheat & Subcooling', icon: Thermometer },
            { id: 'pt-chart', label: 'P-T Chart', icon: Gauge },
            { id: 'leak-rate', label: 'Leak Rate & CO2-eq', icon: Droplets },
            { id: 'converter', label: 'Unit Converter', icon: ArrowUpDown },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCalculator === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCalculator(tab.id as CalculatorTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeCalculator === 'wizard' ? (
        <>
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
          <div className="bg-white p-6 sm:p-8 border border-gray-200 shadow-sm">
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100">
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
                        className={`p-4 border-2 text-sm font-semibold transition-all ${
                          inputs.jobType === type 
                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src={JobTypeImages[type]} 
                            alt={JobTypeLabels[type]} 
                            className="w-full h-24 object-cover "
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

                {/* Processing Mode Selection */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <label className="text-sm font-semibold text-gray-700">
                    Processing Mode
                    <span className="ml-2 text-xs font-normal text-gray-400">Freezing · Blast Freezing · Holding</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(ProcessingModeLabels) as ProcessingMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setInputs({
                            ...inputs,
                            processingMode: mode,
                            // Auto-set target temp and loading time per mode
                            targetTemp: mode === 'BLASTING' ? -18 : mode === 'FREEZING' ? -18 : mode === 'HOLDING' ? 2 : inputs.targetTemp,
                            loadingTimeHours: mode === 'BLASTING' ? 4 : mode === 'FREEZING' ? 12 : mode === 'HOLDING' ? 24 : inputs.loadingTimeHours,
                          });
                        }}
                        className={`p-4 border-2 text-sm font-semibold transition-all ${
                          inputs.processingMode === mode
                            ? mode === 'BLASTING'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : mode === 'FREEZING'
                                ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                                : 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg">
                            {mode === 'BLASTING' ? '❄️' : mode === 'FREEZING' ? '🧊' : '📦'}
                          </span>
                          <span className="font-semibold">{ProcessingModeLabels[mode]}</span>
                          <span className="text-[10px] opacity-70 leading-tight mt-0.5">{ProcessingModeDescriptions[mode]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blasting Parameter Panel */}
                {inputs.processingMode === 'BLASTING' && (
                  <div className="p-5 border-2 border-blue-200 bg-blue-50/50 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">❄️</span>
                      <h4 className="text-sm font-bold text-blue-900">Blast Freezing Parameters</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                          Air Temperature
                          <span className="ml-1 font-normal normal-case text-blue-600">(industrial: -30°C to -40°C)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={inputs.blastPharmaMode ? -120 : -65}
                            max="-25"
                            step="1"
                            value={inputs.blastAirTemp}
                            onChange={(e) => setInputs({ ...inputs, blastAirTemp: Number(e.target.value) })}
                            className="flex-1 accent-blue-600"
                          />
                          <span className="text-sm font-bold text-blue-800 w-16 text-right">{inputs.blastAirTemp}°C</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-blue-500">
                          <span>{inputs.blastPharmaMode ? '-120°C' : '-65°C'}</span>
                          <span>{inputs.blastPharmaMode ? '(pharma range)' : '(industrial)'}</span>
                          <span>-25°C</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                          Air Velocity
                          <span className="ml-1 font-normal normal-case text-blue-600">(3.0 - 6.0 m/s)</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          step="0.5"
                          value={inputs.blastAirVelocity}
                          onChange={(e) => setInputs({ ...inputs, blastAirVelocity: Number(e.target.value) })}
                          className="w-full border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                          Cycle Duration
                          <span className="ml-1 font-normal normal-case text-blue-600">(max 240 min)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="30"
                            max="240"
                            step="5"
                            value={inputs.blastCycleDurationMinutes}
                            onChange={(e) => {
                              const minutes = Number(e.target.value);
                              setInputs({ ...inputs, blastCycleDurationMinutes: minutes, loadingTimeHours: minutes / 60 });
                            }}
                            className="flex-1 accent-blue-600" />
                          <span className="text-sm font-bold text-blue-800 w-16 text-right">{inputs.blastCycleDurationMinutes} min</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-blue-500">
                          <span>30 min</span>
                          <span>240 min</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                          Target Core Temperature
                        </label>
                        <div className="h-[42px] flex items-center px-3 border border-blue-200 bg-white">
                          <span className="text-sm font-bold text-blue-900">-18°C</span>
                          <span className="ml-2 text-xs text-blue-500">(mandatory food safety standard)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inputs.blastPharmaMode}
                          onChange={(e) => {
                            setInputs({
                              ...inputs,
                              blastPharmaMode: e.target.checked,
                              blastAirTemp: e.target.checked ? -80 : -35,
                            });
                          }}
                          className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-semibold text-blue-800">
                          Pharmaceutical mode
                          <span className="ml-1 font-normal text-blue-500">(-65°C to -120°C)</span>
                        </span>
                      </label>
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1">
                        <span>⚠️</span>
                        <span>From +70°C → -18°C in under 4 hrs mandatory</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Holding Parameter Panel */}
                {inputs.processingMode === 'HOLDING' && (
                  <div className="p-5 border-2 border-emerald-200 bg-emerald-50/50 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📦</span>
                      <h4 className="text-sm font-bold text-emerald-900">Holding / Storage Parameters</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                          Target Air Temperature
                          <span className="ml-1 font-normal normal-case text-emerald-600">(1°C to 3.3°C)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="8"
                          step="0.1"
                          value={inputs.holdTargetTemp}
                          onChange={(e) => setInputs({ ...inputs, holdTargetTemp: Number(e.target.value) })}
                          className="w-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1">
                          ⚠️ Max allowable: 4°C — above this enters the Danger Zone
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                          Relative Humidity
                          <span className="ml-1 font-normal normal-case text-emerald-600">(60-75% general / 85-90% meat-produce)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="40"
                            max="95"
                            step="1"
                            value={inputs.holdRH}
                            onChange={(e) => setInputs({ ...inputs, holdRH: Number(e.target.value) })}
                            className="flex-1 accent-emerald-600"
                          />
                          <span className="text-sm font-bold text-emerald-800 w-12 text-right">{inputs.holdRH}%</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setInputs({ ...inputs, holdRH: 65, holdRHPreset: 'general' })}
                            className={`px-2 py-1 text-[10px] font-semibold border transition-all ${
                              inputs.holdRHPreset === 'general'
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            General (65%)
                          </button>
                          <button
                            onClick={() => setInputs({ ...inputs, holdRH: 88, holdRHPreset: 'meat-produce' })}
                            className={`px-2 py-1 text-[10px] font-semibold border transition-all ${
                              inputs.holdRHPreset === 'meat-produce'
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            Meat/Produce (88%)
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                          Defrost Cycles
                          <span className="ml-1 font-normal normal-case text-emerald-600">(4-6x/day, 15-20 min)</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-emerald-600 block">Cycles per day</span>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              step="1"
                              value={inputs.holdDefrostCyclesPerDay}
                              onChange={(e) => setInputs({ ...inputs, holdDefrostCyclesPerDay: Number(e.target.value) })}
                              className="w-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-600 block">Duration (min)</span>
                            <input
                              type="number"
                              min="5"
                              max="45"
                              step="5"
                              value={inputs.holdDefrostDurationMin}
                              onChange={(e) => setInputs({ ...inputs, holdDefrostDurationMin: Number(e.target.value) })}
                              className="w-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                          Air Velocity
                          <span className="ml-1 font-normal normal-case text-emerald-600">(0.1 - 0.3 m/s)</span>
                        </label>
                        <input
                          type="number"
                          min="0.05"
                          max="1.0"
                          step="0.05"
                          value={inputs.holdAirVelocity}
                          onChange={(e) => setInputs({ ...inputs, holdAirVelocity: Number(e.target.value) })}
                          className="w-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="text-[10px] text-emerald-600">High airflow dries out uncovered products</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                          Recovery Time
                          <span className="ml-1 font-normal normal-case text-emerald-600">(60-90 sec after door opening)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="30"
                            max="180"
                            step="5"
                            value={inputs.holdRecoveryTimeSec}
                            onChange={(e) => setInputs({ ...inputs, holdRecoveryTimeSec: Number(e.target.value) })}
                            className="flex-1 accent-emerald-600"
                          />
                          <span className="text-sm font-bold text-emerald-800 w-16 text-right">{inputs.holdRecoveryTimeSec}s</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-emerald-500">
                          <span>30s</span>
                          <span>90s (standard)</span>
                          <span>180s</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                          Airflow Clearance Rules
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-3 py-2 bg-white border border-emerald-200">
                            <span className="text-xs text-emerald-700">Floor clearance</span>
                            <span className="text-sm font-bold text-emerald-900">{inputs.holdFloorClearanceCm} cm</span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2 bg-white border border-emerald-200">
                            <span className="text-xs text-emerald-700">Wall/fan clearance</span>
                            <span className="text-sm font-bold text-emerald-900">{inputs.holdAirflowClearanceCm} cm</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 px-1">
                            15 cm min from floor · 5-10 cm from back wall
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-100/50 px-3 py-2">
                      <span>ℹ️</span>
                      <span>Holding fridges maintain already-cold inventory — not designed to cool hot food down</span>
                    </div>
                  </div>
                )}

                {/* Freezing Parameter Panel */}
                {inputs.processingMode === 'FREEZING' && (
                  <div className="p-5 border-2 border-cyan-200 bg-cyan-50/50 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🧊</span>
                      <h4 className="text-sm font-bold text-cyan-900">Freezing Parameters</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-cyan-800 uppercase tracking-wide">
                          Storage Temperature
                          <span className="ml-1 font-normal normal-case text-cyan-600">(-18°C to -25°C)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={inputs.freezeBioStorage ? -80 : -30}
                            max="-15"
                            step="1"
                            value={inputs.freezeStorageTemp}
                            onChange={(e) => setInputs({ ...inputs, freezeStorageTemp: Number(e.target.value) })}
                            className="flex-1 accent-cyan-600"
                          />
                          <span className="text-sm font-bold text-cyan-800 w-16 text-right">{inputs.freezeStorageTemp}°C</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-cyan-500">
                          <span>{inputs.freezeBioStorage ? '-80°C' : '-30°C'}</span>
                          <span>{inputs.freezeBioStorage ? '(biological storage)' : '(standard)'}</span>
                          <span>-15°C</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={inputs.freezeBioStorage}
                            onChange={(e) => {
                              setInputs({
                                ...inputs,
                                freezeBioStorage: e.target.checked,
                                freezeStorageTemp: e.target.checked ? -60 : -20,
                              });
                            }}
                            className="w-4 h-4 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className="text-[10px] font-semibold text-cyan-800">
                            Biological / medical storage
                            <span className="ml-1 font-normal text-cyan-500">(down to -80°C)</span>
                          </span>
                        </label>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-cyan-800 uppercase tracking-wide">
                          Freezing Rate
                          <span className="ml-1 font-normal normal-case text-cyan-600">(blast: 5-30°C/hr)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={inputs.freezeRateCHour}
                            onChange={(e) => setInputs({ ...inputs, freezeRateCHour: Number(e.target.value) })}
                            className="flex-1 accent-cyan-600"
                          />
                          <span className="text-sm font-bold text-cyan-800 w-16 text-right">{inputs.freezeRateCHour}°C/hr</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-cyan-500">
                          <span>1°C/hr (slow)</span>
                          <span>5-30°C/hr (blast)</span>
                          <span>30°C/hr</span>
                        </div>
                        <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 mt-1">
                          ⚠️ Critical zone (-1°C to -5°C): pass through as fast as possible to prevent large ice crystals
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-cyan-800 uppercase tracking-wide">
                          Air Velocity
                          <span className="ml-1 font-normal normal-case text-cyan-600">(1.5 - 6.0 m/s)</span>
                        </label>
                        <input
                          type="number"
                          min="0.5"
                          max="10"
                          step="0.5"
                          value={inputs.freezeAirVelocity}
                          onChange={(e) => setInputs({ ...inputs, freezeAirVelocity: Number(e.target.value) })}
                          className="w-full border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-900 outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-cyan-800 uppercase tracking-wide">
                          Product Thickness
                          <span className="ml-1 font-normal normal-case text-cyan-600">(max 150 mm)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="10"
                            max="250"
                            step="5"
                            value={inputs.freezeProductThicknessMm}
                            onChange={(e) => setInputs({ ...inputs, freezeProductThicknessMm: Number(e.target.value) })}
                            className="flex-1 accent-cyan-600"
                          />
                          <span className="text-sm font-bold text-cyan-800 w-16 text-right">{inputs.freezeProductThicknessMm} mm</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-cyan-500">
                          <span>10 mm</span>
                          <span>150 mm (max block)</span>
                          <span>250 mm</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="flex items-center gap-2 text-xs text-cyan-700 bg-cyan-100/50 px-3 py-2">
                        <span>ℹ️</span>
                        <span>Thicker items need lower freezing rate to avoid core freeze delay</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-cyan-700 bg-cyan-100/50 px-3 py-2">
                        <span>ℹ️</span>
                        <span>Target core temp: -18°C (universal standard for safe long-term preservation)</span>
                      </div>
                    </div>
                  </div>
                )}

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
                        onClick={() => setInputs({...inputs, insulationType: type as SizingInputs['insulationType']})}
                        className={`p-3 border-2 text-sm font-semibold transition-all ${
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
                  <div className="p-2 bg-blue-100">
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
                <div className="flex items-center gap-6 p-6 bg-gray-900 text-white">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400 mb-1">{JobTypeLabels[inputs.jobType as JobType] || 'Cold Room'} - Total System Load</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-bold text-blue-400">{results.total.toFixed(2)}</span>
                      <span className="text-lg font-medium text-gray-400">kW</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-gray-800 flex items-center justify-center border border-gray-700">
                    <Thermometer className="h-7 w-7 text-blue-400" />
                  </div>
                </div>
                
                {/* Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Heat Gain Breakdown</p>
                    <div className="space-y-2">
                      <BreakdownLine label="Transmission" value={results.transmission} />
                      <BreakdownLine label="Product Load" value={results.product} />
                      <BreakdownLine label="Infiltration" value={results.infiltration} />
                      {results.isHolding && (
                        <>
                          <BreakdownLine label={`Defrost (${inputs.holdDefrostCyclesPerDay}x${inputs.holdDefrostDurationMin}min)`} value={results.defrost} />
                          <BreakdownLine label="Internal (lights/fans/occ.)" value={results.internal} />
                        </>
                      )}
                      <BreakdownLine label={`Safety Margin (${inputs.jobType === 'C90_FREEZER' ? '25' : inputs.jobType === 'C60_FREEZER' ? '20' : '15'}%)`} value={results.total * (inputs.jobType === 'C90_FREEZER' ? 0.25 : inputs.jobType === 'C60_FREEZER' ? 0.20 : 0.15)} />
                    </div>
                  </div>
                  {results.isFreezing ? (
                    <div className="p-4 bg-cyan-50 border border-cyan-100 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-cyan-900 mb-3">Core Freezing Time Estimate</p>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-cyan-700 font-medium block">Time to reach -18°C at core</span>
                          <span className="text-2xl font-bold text-cyan-800">{results.freezingTimeHours.toFixed(1)} hrs</span>
                          <span className="ml-1 text-sm text-cyan-600">({Math.floor(results.freezingTimeHours)}h {Math.round((results.freezingTimeHours % 1) * 60)}min)</span>
                        </div>
                        <div className="border-t border-cyan-200 pt-2">
                          <span className="text-xs text-cyan-700 font-medium block">Critical Zone (-1°C to -5°C) transit</span>
                          <span className="text-base font-bold text-amber-600">{results.criticalZoneHours.toFixed(2)} hrs</span>
                          <span className="ml-1 text-xs text-cyan-600">({Math.round(results.criticalZoneHours * 60)} min)</span>
                          <p className="text-[10px] text-cyan-600 mt-1">Pass through this zone as fast as possible to prevent large ice crystals</p>
                        </div>
                        <div className="border-t border-cyan-200 pt-2 text-xs text-cyan-700">
                          <span>Freezing rate: {inputs.freezeRateCHour}°C/hr · </span>
                          <span>Thickness factor: {results.freezeThicknessFactor.toFixed(2)}×</span>
                        </div>
                        <div className="border-t border-cyan-200 pt-2">
                          <span className="text-xs text-cyan-700 font-medium block mb-1">Recommended Refrigerants</span>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold">R-744 (CO₂)</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold">R-290 (Propane)</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold">R-32</span>
                          </div>
                          <p className="text-[10px] text-cyan-500 mt-1">SI 49 of 2023 Compliant</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-100 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Recommended Refrigerants</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold">R-744 (CO₂)</span>
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold">R-290 (Propane)</span>
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold">R-32</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">SI 49 of 2023 Compliant</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-emerald-50 border border-emerald-100">
                  <p className="text-sm font-semibold text-emerald-900 mb-3">Equipment Selection</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-emerald-700 font-medium block">Compressor Size</span>
                        <span className="text-sm font-semibold text-emerald-950">{equipmentSpecs.compressorSize}</span>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-700 font-medium block">Evaporator Size</span>
                        <span className="text-sm font-semibold text-emerald-950">{equipmentSpecs.evaporatorSize}</span>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-700 font-medium block">Expansion Device</span>
                        <span className="text-sm font-semibold text-emerald-950">{equipmentSpecs.valveType} - {equipmentSpecs.txvSize}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-emerald-700 font-medium block">Liquid Line Size</span>
                        <span className="text-sm font-semibold text-emerald-950">{equipmentSpecs.liquidLine}</span>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-700 font-medium block">Suction Line Size</span>
                        <span className="text-sm font-semibold text-emerald-950">{equipmentSpecs.suctionLine}</span>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-700 font-medium block">Estimated Total Pipe Length</span>
                        <span className="text-sm font-semibold text-emerald-950">{equipmentSpecs.estimatedPipeLength} meters</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Calculation Formula */}
                <div className="p-4 bg-blue-50 border border-blue-100">
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
                    {results.isHolding ? (
                      <>
                        <p className="pl-4">Base: {((inputs.roomWidth * inputs.roomLength * inputs.roomHeight) * 10 * (() => { const m = { C40_FREEZER: 1.2, C60_FREEZER: 1.3, C90_FREEZER: 1.5, COLD_ROOM: 1.0, FREEZER_ROOM: 1.1 }[inputs.jobType as JobType] || 1.0; return m; })() * (inputs.ambientTemp - inputs.targetTemp) / 3600).toFixed(2)} kW</p>
                        <p className="pl-4">RH multiplier: {results.rhInfiltrationMultiplier.toFixed(2)} × Recovery multiplier: {results.recoveryInfiltrationMultiplier.toFixed(2)}</p>
                        <p className="pl-4"><strong>Adjusted Result:</strong> {results.infiltration.toFixed(2)} kW</p>
                      </>
                    ) : (
                      <p className="pl-4"><strong>Result:</strong> {results.infiltration.toFixed(2)} kW</p>
                    )}

                    {results.isHolding && (
                      <>
                        <p className="mt-3"><strong>3b. Defrost Load:</strong> Q = (P_d × t × N) / (24 × 3600)</p>
                        <p className="pl-4">P_d = Floor Area × 40 W/m² = {((inputs.roomWidth * inputs.roomLength).toFixed(1))}m² × 40 = {((inputs.roomWidth * inputs.roomLength) * 40).toFixed(0)} W</p>
                        <p className="pl-4">Q = ({((inputs.roomWidth * inputs.roomLength) * 40).toFixed(0)}W × {inputs.holdDefrostDurationMin}min × 60 × {inputs.holdDefrostCyclesPerDay}) / (24 × 3600)</p>
                        <p className="pl-4"><strong>Result:</strong> {results.defrost.toFixed(2)} kW</p>
                        
                        <p className="mt-3"><strong>3c. Internal Load:</strong> Q = Q_light + Q_fan + Q_occ</p>
                        <p className="pl-4">Lighting: {((inputs.roomWidth * inputs.roomLength) * 10 / 1000).toFixed(3)} kW + Fans: {((inputs.roomWidth * inputs.roomLength) * 5 / 1000).toFixed(3)} kW + Occupancy: {(100 / 24 / 1000).toFixed(3)} kW</p>
                        <p className="pl-4"><strong>Result:</strong> {results.internal.toFixed(2)} kW</p>
                      </>
                    )}
                    
                    {results.isFreezing && (
                      <>
                        <p className="mt-3"><strong>3c. Core Freezing Time:</strong> t = (T_start − T_core) / R × F_thickness</p>
                        <p className="pl-4">Where: T_start = Product temp ({inputs.productTemp}°C), T_core = Target ({results.freezeTargetCore}°C), R = Freezing rate, F = Thickness factor</p>
                        <p className="pl-4">Thickness factor = 1 + 0.2 × ((T − 50) / 100)</p>
                        <p className="pl-4">T = {inputs.freezeProductThicknessMm}mm → Factor = 1 + 0.2 × ({Math.max(0, inputs.freezeProductThicknessMm - 50)} / 100) = {results.freezeThicknessFactor.toFixed(2)}×</p>
                        <p className="pl-4">t = ({inputs.productTemp}°C − ({results.freezeTargetCore}°C)) / {inputs.freezeRateCHour}°C/hr × {results.freezeThicknessFactor.toFixed(2)}</p>
                        <p className="pl-4"><strong>Core Freezing Time:</strong> {results.freezingTimeHours.toFixed(1)} hours ({Math.floor(results.freezingTimeHours)}h {Math.round((results.freezingTimeHours % 1) * 60)}min)</p>
                        
                        <p className="mt-2"><strong>Critical Zone Transit:</strong> t_cz = 4°C / R × F_thickness</p>
                        <p className="pl-4">Critical zone = -1°C to -5°C (4°C wide) — must pass through as fast as possible</p>
                        <p className="pl-4">t_cz = 4°C / {inputs.freezeRateCHour}°C/hr × {results.freezeThicknessFactor.toFixed(2)}</p>
                        <p className="pl-4"><strong>Result:</strong> {results.criticalZoneHours.toFixed(2)} hours ({Math.round(results.criticalZoneHours * 60)} min) in the critical zone</p>
                        {results.criticalZoneHours > 0.5 && (
                          <p className="pl-4 text-amber-700">⚠️ Warning: &gt;30 min in critical zone risks large ice crystal formation</p>
                        )}
                      </>
                    )}

                    <p className="mt-3"><strong>{results.isHolding ? '4' : results.isFreezing ? '4' : '3b'}. Total with Safety:</strong> Q_total = ΣQ × Safety Factor</p>
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
                  className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 font-semibold hover:bg-gray-800 transition-colors"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  onClick={handleAiConsult}
                  disabled={isLoadingAi}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
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
            <div className="bg-gray-900 text-gray-50 p-6 shadow-lg">
              <h4 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <div className="p-1.5 bg-blue-500">
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
                className="flex items-center justify-center gap-2 w-full mt-6 py-2.5 bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Technical Sheet
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="w-14 h-14 bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
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
      <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 p-6 border border-amber-100">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-bold text-gray-900">Technical References</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SIZING_SOURCES.map((source, index) => (
            <div key={index} className="flex items-start gap-3 bg-white/60 p-3 ">
              <div className="w-8 h-8 bg-amber-100 flex items-center justify-center flex-shrink-0">
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
        </>
      ) : activeCalculator === 'superheat' ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="border border-gray-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Superheat & Subcooling Calculator</h3>
              <p className="mt-1 text-sm text-gray-500">
                Use suction and liquid pressures against the selected refrigerant curve to estimate field conditions.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Reference Refrigerant</label>
                <select
                  value={selectedRefrigerant}
                  onChange={(e) => setSelectedRefrigerant(e.target.value as RefrigerantCode)}
                  className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                >
                  {Object.keys(PT_CURVES).map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <InputGroup label="Suction Pressure (bar)" value={superheatInputs.suctionPressure} onChange={(v: number) => setSuperheatInputs({ ...superheatInputs, suctionPressure: v })} />
              <InputGroup label="Suction Temp (°C)" value={superheatInputs.suctionTemp} onChange={(v: number) => setSuperheatInputs({ ...superheatInputs, suctionTemp: v })} />
              <InputGroup label="Liquid Pressure (bar)" value={superheatInputs.liquidPressure} onChange={(v: number) => setSuperheatInputs({ ...superheatInputs, liquidPressure: v })} />
              <InputGroup label="Liquid Temp (°C)" value={superheatInputs.liquidTemp} onChange={(v: number) => setSuperheatInputs({ ...superheatInputs, liquidTemp: v })} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm font-semibold text-gray-500">Evaporator Saturation Temp</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{saturationTempLow.toFixed(1)}°C</p>
                <p className="mt-2 text-xs text-gray-500">Interpolated from suction pressure</p>
              </div>
              <div className="border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm font-semibold text-gray-500">Condensing Saturation Temp</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{saturationTempHigh.toFixed(1)}°C</p>
                <p className="mt-2 text-xs text-gray-500">Interpolated from liquid pressure</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 bg-gray-900 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-gray-300">Superheat</p>
              <p className="mt-3 text-4xl font-bold text-blue-400">{superheatValue.toFixed(1)}°C</p>
              <p className="mt-2 text-sm text-gray-300">Status: {superheatStatus}</p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Subcooling</p>
              <p className="mt-3 text-4xl font-bold text-gray-900">{subcoolingValue.toFixed(1)}°C</p>
              <p className="mt-2 text-sm text-gray-500">Status: {subcoolingStatus}</p>
            </div>
            <div className="border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-900">Field Guidance</p>
              <ul className="mt-3 space-y-2 text-sm text-amber-800">
                <li>Optimal superheat target: 5°C to 12°C</li>
                <li>Optimal subcooling target: 3°C to 10°C</li>
                <li>Always confirm pressure readings against refrigerant safety class before adjustment.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : activeCalculator === 'pt-chart' ? (
        <div className="border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pressure-Temperature Chart</h3>
              <p className="mt-1 text-sm text-gray-500">
                Review simplified reference curves and compare them to safe operating thresholds.
              </p>
            </div>
            <div className="w-full sm:w-60">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Highlight Refrigerant</label>
              <select
                value={selectedRefrigerant}
                onChange={(e) => setSelectedRefrigerant(e.target.value as RefrigerantCode)}
                className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
              >
                {Object.keys(PT_CURVES).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-gray-200 bg-slate-950 p-4">
            <svg viewBox="0 0 700 320" className="h-[320px] w-full">
              <rect x="0" y="0" width="700" height="320" fill="#020617" rx="20" />
              {Array.from({ length: 6 }).map((_, index) => (
                <line
                  key={`h-${index}`}
                  x1="70"
                  y1={40 + index * 40}
                  x2="660"
                  y2={40 + index * 40}
                  stroke="rgba(255,255,255,0.08)"
                />
              ))}
              {Array.from({ length: 7 }).map((_, index) => (
                <line
                  key={`v-${index}`}
                  x1={90 + index * 80}
                  y1="30"
                  x2={90 + index * 80}
                  y2="280"
                  stroke="rgba(255,255,255,0.08)"
                />
              ))}
              <rect
                x="70"
                y={30 + (1 - MAX_OPERATING_PRESSURE[selectedRefrigerant] / 64) * 230}
                width="590"
                height={280 - (30 + (1 - MAX_OPERATING_PRESSURE[selectedRefrigerant] / 64) * 230)}
                fill="rgba(239,68,68,0.12)"
              />
              {Object.entries(PT_CURVES).map(([code, curve]) => {
                const points = curve
                  .map((point) => {
                    const x = 90 + ((point.temp + 20) / 60) * 480;
                    const y = 260 - (point.pressure / 64) * 220;
                    return `${x},${y}`;
                  })
                  .join(' ');

                const color =
                  code === 'R-290' ? '#22c55e' :
                  code === 'R-32' ? '#38bdf8' :
                  code === 'R-744' ? '#f59e0b' :
                  '#cbd5e1';

                return (
                  <g key={code}>
                    <polyline
                      fill="none"
                      stroke={color}
                      strokeWidth={code === selectedRefrigerant ? 4 : 2}
                      opacity={code === selectedRefrigerant ? 1 : 0.5}
                      points={points}
                    />
                    <text x="600" y={60 + Object.keys(PT_CURVES).indexOf(code as RefrigerantCode) * 22} fill={color} fontSize="12" fontWeight="700">
                      {code}
                    </text>
                  </g>
                );
              })}
              <text x="320" y="305" fill="#cbd5e1" fontSize="12">Temperature (°C)</text>
              <text x="14" y="160" fill="#cbd5e1" fontSize="12" transform="rotate(-90 14 160)">Pressure (bar)</text>
            </svg>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-500">Selected Curve</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{selectedRefrigerant}</p>
            </div>
            <div className="border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-500">Safety Class</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{REFRIGERANT_REFERENCE[selectedRefrigerant].ashraeSafetyClass}</p>
            </div>
            <div className="border border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">Max Operating Pressure</p>
              <p className="mt-2 text-2xl font-bold text-red-900">{MAX_OPERATING_PRESSURE[selectedRefrigerant]} bar</p>
            </div>
          </div>
        </div>
      ) : activeCalculator === 'leak-rate' ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border border-gray-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Leak Rate & CO2-eq Calculator</h3>
              <p className="mt-1 text-sm text-gray-500">
                Translate annual refrigerant leakage into climate impact and explain it in field-ready terms.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputGroup label="Leak Rate (kg/year)" value={leakInputs.leakRate} onChange={(v: number) => setLeakInputs({ ...leakInputs, leakRate: v })} />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Refrigerant</label>
                <select
                  value={leakInputs.refrigerantCode}
                  onChange={(e) => setLeakInputs({ ...leakInputs, refrigerantCode: e.target.value as RefrigerantCode })}
                  className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                >
                  {Object.keys(REFRIGERANT_REFERENCE).map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-500">Handling Precautions</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {leakEquivalent.refrigerant.handlingPrecautions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 bg-gray-900 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold text-gray-300">CO2 Equivalent</p>
              <p className="mt-3 text-4xl font-bold text-emerald-400">{leakEquivalent.co2eq} tCO2-eq</p>
              <p className="mt-2 text-sm text-gray-300">Based on {leakEquivalent.refrigerant.gwp} GWP for {leakInputs.refrigerantCode}</p>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Equivalent Car Journeys</p>
              <p className="mt-3 text-4xl font-bold text-gray-900">{leakEquivalent.carJourneys}</p>
              <p className="mt-2 text-sm text-gray-500">Approximate one-way urban journeys for context.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border border-gray-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Unit Converter</h3>
              <p className="mt-1 text-sm text-gray-500">
                Convert temperature, pressure, mass, airflow, and energy values for field calculations.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <select
                  value={converterType}
                  onChange={(e) => setConverterType(e.target.value as ConverterType)}
                  className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                >
                  <option value="temperature">Temperature</option>
                  <option value="pressure">Pressure</option>
                  <option value="mass">Mass</option>
                  <option value="airflow">Airflow</option>
                  <option value="energy">Energy</option>
                </select>
              </div>
              <InputGroup label="Value" value={converterValue} onChange={(v: number) => setConverterValue(v)} />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">From</label>
                <select
                  value={converterFrom}
                  onChange={(e) => setConverterFrom(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                >
                  {CONVERTER_OPTIONS[converterType].units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">To</label>
                <select
                  value={converterTo}
                  onChange={(e) => setConverterTo(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                >
                  {CONVERTER_OPTIONS[converterType].units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 bg-gray-900 p-6 text-white shadow-lg">
            <p className="text-sm font-semibold text-gray-300">Converted Result</p>
            <p className="mt-4 text-4xl font-bold text-blue-400">{convertedValue.toFixed(2)}</p>
            <p className="mt-2 text-sm text-gray-300">
              {converterValue} {converterFrom} = {convertedValue.toFixed(2)} {converterTo}
            </p>
          </div>
        </div>
      )}
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
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
