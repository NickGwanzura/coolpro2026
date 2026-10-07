export type CoolingLoadInputs = {
  roomWidth: number;
  roomLength: number;
  roomHeight: number;
  wallUValue: number;
  ceilingUValue: number;
  floorUValue: number;
  ambientTemp: number;
  ceilingBoundaryTempC: number;
  floorBoundaryTempC: number;
  roomTempC: number;
  ambientRH: number;
  roomRH: number;
  sitePressureKpa: number;
  infiltrationAirflowM3h: number;
  productMass: number;
  productTemp: number;
  productTargetTempC: number;
  productCp: number;
  productCpFrozen: number;
  productFreezingPointC: number;
  productWaterFraction: number;
  productLoadHours: number;
  internalLoadKw: number;
  defrostHeaterPowerKw: number;
  defrostDurationMin: number;
  defrostCyclesPerDay: number;
  designMarginPct: number;
};

export type CoolingLoadResults = {
  wallAreaM2: number;
  floorAreaM2: number;
  wallTransmissionKw: number;
  ceilingTransmissionKw: number;
  floorTransmissionKw: number;
  transmissionKw: number;
  productSensibleAboveFreezeKw: number;
  productLatentKw: number;
  productSensibleBelowFreezeKw: number;
  productKw: number;
  infiltrationKw: number;
  outdoorAirEnthalpyKjKg: number;
  roomAirEnthalpyKjKg: number;
  dryAirMassFlowKgS: number;
  internalKw: number;
  defrostKw: number;
  subtotalKw: number;
  designMarginKw: number;
  designMarginPct: number;
  totalKw: number;
  productEnergyKjKg: number;
  productLoadHours: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function moistAirState(tempC: number, relativeHumidityPct: number, pressureKpa: number) {
  // Buck saturation-pressure approximation (kPa), valid for common HVAC temperatures.
  const saturationPressureKpa = 0.61121 * Math.exp((18.678 - tempC / 234.5) * (tempC / (257.14 + tempC)));
  const vaporPressureKpa = Math.min(saturationPressureKpa * clamp(relativeHumidityPct, 0, 100) / 100, pressureKpa * 0.98);
  const humidityRatio = 0.621945 * vaporPressureKpa / (pressureKpa - vaporPressureKpa);
  const enthalpyKjKgDryAir = 1.006 * tempC + humidityRatio * (2501 + 1.86 * tempC);
  const specificVolumeM3KgDryAir = 0.287042 * (tempC + 273.15) * (1 + 1.607858 * humidityRatio) / pressureKpa;
  return { enthalpyKjKgDryAir, specificVolumeM3KgDryAir };
}

export function calculateCoolingLoads(input: CoolingLoadInputs): CoolingLoadResults {
  const wallAreaM2 = 2 * (input.roomWidth * input.roomHeight + input.roomLength * input.roomHeight);
  const floorAreaM2 = input.roomWidth * input.roomLength;
  const wallTransmissionKw = Math.max(0, wallAreaM2 * input.wallUValue * (input.ambientTemp - input.roomTempC) / 1000);
  const ceilingTransmissionKw = Math.max(0, floorAreaM2 * input.ceilingUValue * (input.ceilingBoundaryTempC - input.roomTempC) / 1000);
  const floorTransmissionKw = Math.max(0, floorAreaM2 * input.floorUValue * (input.floorBoundaryTempC - input.roomTempC) / 1000);
  const transmissionKw = wallTransmissionKw + ceilingTransmissionKw + floorTransmissionKw;

  const freezingPoint = input.productFreezingPointC;
  const sensibleAboveKjKg = Math.max(0, input.productTemp - Math.max(input.productTargetTempC, freezingPoint)) * input.productCp;
  const sensibleBelowKjKg = Math.max(0, Math.min(input.productTemp, freezingPoint) - input.productTargetTempC) * input.productCpFrozen;
  const crossesFreezingPoint = input.productTemp >= freezingPoint && input.productTargetTempC < freezingPoint;
  const latentKjKg = crossesFreezingPoint ? input.productWaterFraction * 333.55 : 0;
  const productEnergyKjKg = sensibleAboveKjKg + latentKjKg + sensibleBelowKjKg;
  const productLoadHours = input.productLoadHours;
  const productKw = input.productMass * productEnergyKjKg / (productLoadHours * 3600);
  const productSensibleAboveFreezeKw = input.productMass * sensibleAboveKjKg / (productLoadHours * 3600);
  const productLatentKw = input.productMass * latentKjKg / (productLoadHours * 3600);
  const productSensibleBelowFreezeKw = input.productMass * sensibleBelowKjKg / (productLoadHours * 3600);

  const outsideAir = moistAirState(input.ambientTemp, input.ambientRH, input.sitePressureKpa);
  const roomAir = moistAirState(input.roomTempC, input.roomRH, input.sitePressureKpa);
  const dryAirMassFlowKgS = input.infiltrationAirflowM3h / 3600 / outsideAir.specificVolumeM3KgDryAir;
  const infiltrationKw = Math.max(0, dryAirMassFlowKgS * (outsideAir.enthalpyKjKgDryAir - roomAir.enthalpyKjKgDryAir));

  // Daily-average heater load; assumes the full electrical input becomes a room refrigeration load.
  const defrostKw = input.defrostHeaterPowerKw * input.defrostDurationMin * input.defrostCyclesPerDay / 1440;
  const internalKw = input.internalLoadKw;
  const subtotalKw = transmissionKw + productKw + infiltrationKw + internalKw + defrostKw;
  const designMarginKw = subtotalKw * input.designMarginPct / 100;

  return {
    wallAreaM2,
    floorAreaM2,
    wallTransmissionKw,
    ceilingTransmissionKw,
    floorTransmissionKw,
    transmissionKw,
    productSensibleAboveFreezeKw,
    productLatentKw,
    productSensibleBelowFreezeKw,
    productKw,
    infiltrationKw,
    outdoorAirEnthalpyKjKg: outsideAir.enthalpyKjKgDryAir,
    roomAirEnthalpyKjKg: roomAir.enthalpyKjKgDryAir,
    dryAirMassFlowKgS,
    internalKw,
    defrostKw,
    subtotalKw,
    designMarginKw,
    designMarginPct: input.designMarginPct,
    totalKw: subtotalKw + designMarginKw,
    productEnergyKjKg,
    productLoadHours,
  };
}
