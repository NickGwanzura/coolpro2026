// Indicative equipment and line sizing from a cooling load.
//
// Properties are estimated from critical constants (Lee-Kesler vapour pressure, Pitzer virial
// compressibility, Watson latent heat), not tabulated refrigerant data. Results are good for
// choosing a size class and for first-pass line sizes. They are not a substitute for a
// manufacturer's selection at the real operating conditions.

export type SelectableRefrigerant = 'R-22' | 'R-134a' | 'R-404A' | 'R-290' | 'R-32';

interface FluidModel {
  molarMass: number; // kg/kmol
  tc: number; // K
  pc: number; // bar
  omega: number; // acentric factor
  hfgRef: number; // latent heat at the normal boiling point, kJ/kg
  tbRef: number; // normal boiling point, K
  cpLiquid: number; // kJ/kg.K, mean liquid
  rhoLiquid30: number; // kg/m3 at 30 C
  liquidSlope: number; // fractional density loss per K
  isentropicK: number;
}

const FLUIDS: Record<SelectableRefrigerant, FluidModel> = {
  'R-22': { molarMass: 86.47, tc: 369.3, pc: 49.9, omega: 0.221, hfgRef: 233.8, tbRef: 232.4, cpLiquid: 1.3, rhoLiquid30: 1170, liquidSlope: 0.0032, isentropicK: 1.18 },
  'R-134a': { molarMass: 102.03, tc: 374.2, pc: 40.59, omega: 0.327, hfgRef: 217.2, tbRef: 247.0, cpLiquid: 1.45, rhoLiquid30: 1187, liquidSlope: 0.0033, isentropicK: 1.12 },
  'R-404A': { molarMass: 97.6, tc: 345.3, pc: 37.35, omega: 0.29, hfgRef: 200, tbRef: 226.9, cpLiquid: 1.6, rhoLiquid30: 1045, liquidSlope: 0.0042, isentropicK: 1.14 },
  'R-290': { molarMass: 44.1, tc: 369.8, pc: 42.48, omega: 0.152, hfgRef: 428, tbRef: 231.1, cpLiquid: 2.75, rhoLiquid30: 489, liquidSlope: 0.0038, isentropicK: 1.14 },
  'R-32': { molarMass: 52.02, tc: 351.3, pc: 57.8, omega: 0.277, hfgRef: 381.5, tbRef: 221.5, cpLiquid: 1.95, rhoLiquid30: 930, liquidSlope: 0.0045, isentropicK: 1.17 },
};

export const SELECTABLE_REFRIGERANTS = Object.keys(FLUIDS) as SelectableRefrigerant[];

const R_KJ = 8.314; // kJ/kmol.K

const kelvin = (c: number) => c + 273.15;

/** Saturation pressure in bar (Lee-Kesler). */
export function saturationPressureBar(fluid: SelectableRefrigerant, tempC: number): number {
  const f = FLUIDS[fluid];
  const tr = kelvin(tempC) / f.tc;
  const f0 = 5.92714 - 6.09648 / tr - 1.28862 * Math.log(tr) + 0.169347 * tr ** 6;
  const f1 = 15.2518 - 15.6875 / tr - 13.4721 * Math.log(tr) + 0.43577 * tr ** 6;
  return f.pc * Math.exp(f0 + f.omega * f1);
}

function vapourDensity(fluid: SelectableRefrigerant, pressureBar: number, tempK: number): number {
  const f = FLUIDS[fluid];
  const tr = tempK / f.tc;
  const pr = pressureBar / f.pc;
  const b0 = 0.083 - 0.422 / tr ** 1.6;
  const b1 = 0.139 - 0.172 / tr ** 4.2;
  const z = Math.max(0.6, 1 + (b0 + f.omega * b1) * (pr / tr));
  return (pressureBar * 100 * f.molarMass) / (z * R_KJ * tempK); // kPa -> kg/m3
}

function latentHeat(fluid: SelectableRefrigerant, tempC: number): number {
  const f = FLUIDS[fluid];
  const t = kelvin(tempC);
  return f.hfgRef * ((f.tc - t) / (f.tc - f.tbRef)) ** 0.38;
}

function liquidDensity(fluid: SelectableRefrigerant, tempC: number): number {
  const f = FLUIDS[fluid];
  return f.rhoLiquid30 * (1 - f.liquidSlope * (tempC - 30));
}

// Common ACR copper tube, outside diameter in mm with typical inch label.
const COPPER_OD: { label: string; od: number }[] = [
  { label: '3/8"', od: 9.52 }, { label: '1/2"', od: 12.7 }, { label: '5/8"', od: 15.88 },
  { label: '3/4"', od: 19.05 }, { label: '7/8"', od: 22.22 }, { label: '1-1/8"', od: 28.58 },
  { label: '1-3/8"', od: 34.92 }, { label: '1-5/8"', od: 41.28 }, { label: '2-1/8"', od: 53.98 },
  { label: '2-5/8"', od: 66.68 }, { label: '3-1/8"', od: 79.38 }, { label: '3-5/8"', od: 92.08 },
  { label: '4-1/8"', od: 104.78 },
];

const wallFor = (od: number) => (od <= 22.5 ? 0.89 : od <= 36 ? 1.0 : od <= 42 ? 1.1 : od <= 55 ? 1.4 : 1.7);
const innerDiameter = (od: number) => od - 2 * wallFor(od);

export interface LineSize {
  size: string;
  velocityMs: number;
  /** True when even the largest standard tube is above the velocity limit. */
  oversizedLoad: boolean;
}

function pickLine(volFlowM3s: number, maxVelocity: number): LineSize {
  for (const tube of COPPER_OD) {
    const id = innerDiameter(tube.od) / 1000;
    const velocity = volFlowM3s / (Math.PI * (id / 2) ** 2);
    if (velocity <= maxVelocity) return { size: tube.label, velocityMs: velocity, oversizedLoad: false };
  }
  const last = COPPER_OD[COPPER_OD.length - 1];
  const id = innerDiameter(last.od) / 1000;
  return { size: last.label, velocityMs: volFlowM3s / (Math.PI * (id / 2) ** 2), oversizedLoad: true };
}

const TXV_CLASSES_TR = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];

export interface EquipmentInputs {
  refrigerant: SelectableRefrigerant;
  /** Average cooling load in kW, already including any design margin. */
  loadKw: number;
  roomTempC: number;
  ambientTempC: number;
  /** Hours per day the compressor is allowed to run, 12 to 24. */
  runtimeHoursPerDay: number;
  /** Temperature difference between room air and evaporating refrigerant, K. */
  evaporatorTdK: number;
  /** Condensing temperature above ambient air, K. */
  condenserTdK: number;
}

export interface EquipmentSelection {
  evaporatingC: number;
  condensingC: number;
  evaporatingBar: number;
  condensingBar: number;
  pressureRatio: number;
  designCapacityKw: number;
  massFlowKgS: number;
  netRefrigeratingEffectKjKg: number;
  compressor: { type: string; capacityKw: number; sweptVolumeM3h: number; electricalKw: number; cop: number };
  condenser: { heatRejectionKw: number };
  evaporator: { capacityKw: number; airflowM3h: number; airDeltaTK: number };
  expansion: { requiredKw: number; requiredTr: number; nominalClassTr: number | null; type: string };
  lines: { suction: LineSize; discharge: LineSize; liquid: LineSize };
  warnings: string[];
}

function compressorType(kw: number): string {
  if (kw < 5) return 'Hermetic or rotary/scroll (condensing unit)';
  if (kw < 40) return 'Scroll or semi-hermetic reciprocating (condensing unit)';
  if (kw < 200) return 'Semi-hermetic reciprocating, or a multi-compressor pack';
  return 'Screw compressor or a multi-compressor rack';
}

/** First-pass equipment and copper line sizes. Returns warnings instead of throwing on poor inputs. */
export function selectEquipment(input: EquipmentInputs): EquipmentSelection {
  const f = FLUIDS[input.refrigerant];
  const warnings: string[] = [];
  const runtime = Math.min(24, Math.max(8, input.runtimeHoursPerDay));
  const designCapacityKw = (input.loadKw * 24) / runtime;

  const evaporatingC = input.roomTempC - input.evaporatorTdK;
  const condensingC = input.ambientTempC + input.condenserTdK;
  const pEvap = saturationPressureBar(input.refrigerant, evaporatingC);
  const pCond = saturationPressureBar(input.refrigerant, condensingC);
  const pressureRatio = pCond / pEvap;

  if (condensingC >= f.tc - 273.15 - 8) warnings.push(`Condensing temperature ${condensingC.toFixed(0)} °C is close to the critical point of ${input.refrigerant}. Lower the ambient or condenser TD, or use a water-cooled or oversized condenser.`);
  if (pEvap < 1.05) warnings.push(`${input.refrigerant} would evaporate below atmospheric pressure (${pEvap.toFixed(2)} bar) at ${evaporatingC.toFixed(0)} °C. Air can be drawn in on a leak. Choose a refrigerant suited to this evaporating temperature.`);
  if (pressureRatio > 10) warnings.push(`Pressure ratio is ${pressureRatio.toFixed(1)}. Single-stage compression is unlikely to be suitable, so consider two-stage or a booster system.`);
  else if (pressureRatio > 8) warnings.push(`Pressure ratio is ${pressureRatio.toFixed(1)}, which is high for one stage. Check the discharge temperature limit with the compressor maker.`);
  if (input.refrigerant === 'R-32' && evaporatingC < -25) warnings.push('R-32 runs very hot at low evaporating temperatures. Most compressor makers do not offer it for freezer duty.');
  if (input.refrigerant === 'R-134a' && evaporatingC < -15) warnings.push('R-134a is not normally used for evaporating temperatures below about -15 °C.');
  if (input.refrigerant === 'R-290') warnings.push('R-290 is flammable (A3). The refrigerant charge is limited by the room and system size, and flammable-refrigerant components and training are required.');
  if (input.refrigerant === 'R-32') warnings.push('R-32 is mildly flammable (A2L). Check charge limits and component approvals for the installation.');
  if (input.refrigerant === 'R-22') warnings.push('R-22 is an ozone-depleting substance being phased out. Use it only for servicing an existing system.');
  if (input.refrigerant === 'R-404A') warnings.push('R-404A has a high global warming potential (about 3900) and is being phased down. Consider a lower-GWP alternative for a new system.');

  // Latent heat plus 10 K useful superheat, less the liquid enthalpy carried to the expansion valve.
  const nre = latentHeat(input.refrigerant, evaporatingC) + 0.9 * 10 - f.cpLiquid * (condensingC - evaporatingC);
  const netRefrigeratingEffectKjKg = Math.max(nre, 20);
  if (nre < 20) warnings.push('The net refrigerating effect is very low at these conditions, so the results are not reliable. Revisit the temperatures.');
  const massFlowKgS = designCapacityKw / netRefrigeratingEffectKjKg;

  // Suction vapour at the compressor inlet, 10 K superheat.
  const suctionK = kelvin(evaporatingC) + 10;
  const suctionRho = vapourDensity(input.refrigerant, pEvap, suctionK);
  const suctionVol = massFlowKgS / suctionRho;
  const volumetricEff = Math.max(0.6, 0.96 - 0.04 * pressureRatio);
  const sweptVolumeM3h = (suctionVol / volumetricEff) * 3600;

  // Isentropic work with a total efficiency of 0.70.
  const k = f.isentropicK;
  const specificVolume = 1 / suctionRho;
  const workKjKg = (k / (k - 1)) * pEvap * 100 * specificVolume * (pressureRatio ** ((k - 1) / k) - 1);
  const electricalKw = (massFlowKgS * workKjKg) / 0.7;
  const cop = designCapacityKw / Math.max(electricalKw, 0.001);
  const heatRejectionKw = designCapacityKw + electricalKw;

  const dischargeRho = vapourDensity(input.refrigerant, pCond, kelvin(condensingC) + 35);
  const liquidRho = liquidDensity(input.refrigerant, condensingC);

  const suction = pickLine(suctionVol, 12);
  const discharge = pickLine(massFlowKgS / dischargeRho, 15);
  const liquid = pickLine(massFlowKgS / liquidRho, 1.2);
  if (suction.velocityMs < 4 && designCapacityKw > 0) warnings.push(`Suction velocity is only ${suction.velocityMs.toFixed(1)} m/s in the ${suction.size} line. Vertical risers need about 6 m/s or more to return oil, so use a smaller riser or a double riser for part-load operation.`);
  if (suction.oversizedLoad || discharge.oversizedLoad || liquid.oversizedLoad) warnings.push('The flow exceeds the largest standard copper tube. Use parallel lines or steel pipe, designed by an engineer.');

  const airDeltaTK = input.roomTempC < 0 ? 4 : 6;
  const airDensity = 101.3 / (0.287 * kelvin(input.roomTempC));
  const airflowM3h = (designCapacityKw / (airDensity * 1.005 * airDeltaTK)) * 3600;

  const expansionKw = designCapacityKw;
  const requiredTr = expansionKw / 3.517;
  const nominalClassTr = TXV_CLASSES_TR.find((c) => c >= requiredTr * 1.25) ?? null;
  const expansionType = designCapacityKw >= 30 || evaporatingC <= -30 ? 'Electronic expansion valve (EEV) recommended' : 'Thermostatic expansion valve (TXV) with external equaliser';

  return {
    evaporatingC,
    condensingC,
    evaporatingBar: pEvap,
    condensingBar: pCond,
    pressureRatio,
    designCapacityKw,
    massFlowKgS,
    netRefrigeratingEffectKjKg,
    compressor: { type: compressorType(designCapacityKw), capacityKw: designCapacityKw, sweptVolumeM3h, electricalKw, cop },
    condenser: { heatRejectionKw },
    evaporator: { capacityKw: designCapacityKw, airflowM3h, airDeltaTK },
    expansion: { requiredKw: expansionKw, requiredTr, nominalClassTr, type: expansionType },
    lines: { suction, discharge, liquid },
    warnings,
  };
}

export function defaultEvaporatorTd(roomTempC: number): number {
  return roomTempC >= 0 ? 8 : roomTempC > -25 ? 7 : 6;
}

/** Default refrigerant that suits the evaporating range, as a starting point only. */
export function suggestRefrigerant(roomTempC: number): SelectableRefrigerant {
  return roomTempC >= 0 ? 'R-134a' : 'R-404A';
}
