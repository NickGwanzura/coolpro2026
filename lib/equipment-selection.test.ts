import { describe, expect, it } from 'vitest';
import { saturationPressureBar, selectEquipment, defaultEvaporatorTd, type EquipmentInputs } from './equipment-selection';

const base: EquipmentInputs = {
  refrigerant: 'R-404A', loadKw: 10, roomTempC: -20, ambientTempC: 35,
  runtimeHoursPerDay: 18, evaporatorTdK: 7, condenserTdK: 12,
};

describe('saturationPressureBar', () => {
  it('is near published values', () => {
    expect(saturationPressureBar('R-22', 0)).toBeGreaterThan(4.6);
    expect(saturationPressureBar('R-22', 0)).toBeLessThan(5.2);
    expect(saturationPressureBar('R-134a', 0)).toBeGreaterThan(2.7);
    expect(saturationPressureBar('R-134a', 0)).toBeLessThan(3.1);
    expect(saturationPressureBar('R-290', 0)).toBeGreaterThan(4.3);
    expect(saturationPressureBar('R-290', 0)).toBeLessThan(5.0);
    expect(saturationPressureBar('R-404A', -30)).toBeGreaterThan(2.0);
    expect(saturationPressureBar('R-404A', -30)).toBeLessThan(2.4);
  });
});

describe('selectEquipment', () => {
  it('scales the design capacity for the allowed runtime', () => {
    expect(selectEquipment(base).designCapacityKw).toBeCloseTo((10 * 24) / 18, 5);
  });
  it('uses evaporating and condensing temperatures from the TDs', () => {
    const r = selectEquipment(base);
    expect(r.evaporatingC).toBe(-27);
    expect(r.condensingC).toBe(47);
  });
  it('gives a plausible COP and compressor size for a freezer', () => {
    const r = selectEquipment(base);
    expect(r.compressor.cop).toBeGreaterThan(0.7);
    expect(r.compressor.cop).toBeLessThan(3.0);
    expect(r.compressor.sweptVolumeM3h).toBeGreaterThan(10);
    expect(r.compressor.sweptVolumeM3h).toBeLessThan(120);
    expect(r.condenser.heatRejectionKw).toBeGreaterThan(r.designCapacityKw);
  });
  it('sizes lines larger for more load, suction larger than liquid', () => {
    const small = selectEquipment({ ...base, loadKw: 3 });
    const large = selectEquipment({ ...base, loadKw: 30 });
    expect(large.massFlowKgS).toBeGreaterThan(small.massFlowKgS);
    expect(large.lines.suction.velocityMs).toBeLessThanOrEqual(12.01);
    expect(large.lines.liquid.velocityMs).toBeLessThanOrEqual(1.21);
    const order = ['3/8"', '1/2"', '5/8"', '3/4"', '7/8"', '1-1/8"', '1-3/8"', '1-5/8"', '2-1/8"', '2-5/8"', '3-1/8"', '3-5/8"', '4-1/8"'];
    expect(order.indexOf(large.lines.suction.size)).toBeGreaterThan(order.indexOf(small.lines.suction.size));
    expect(order.indexOf(large.lines.suction.size)).toBeGreaterThanOrEqual(order.indexOf(large.lines.liquid.size));
  });
  it('warns about unsuitable refrigerant and conditions', () => {
    expect(selectEquipment({ ...base, refrigerant: 'R-134a' }).warnings.join(' ')).toMatch(/below atmospheric|-15/);
    expect(selectEquipment({ ...base, refrigerant: 'R-290' }).warnings.join(' ')).toMatch(/flammable/);
    expect(selectEquipment({ ...base, refrigerant: 'R-22' }).warnings.join(' ')).toMatch(/ozone/);
  });
  it('rounds the expansion valve class up with margin', () => {
    const r = selectEquipment({ ...base, loadKw: 7, roomTempC: 2, evaporatorTdK: 8, refrigerant: 'R-134a' });
    expect(r.expansion.nominalClassTr).toBeGreaterThanOrEqual(r.expansion.requiredTr * 1.25);
  });
  it('picks a smaller evaporator TD for colder rooms', () => {
    expect(defaultEvaporatorTd(4)).toBeGreaterThan(defaultEvaporatorTd(-30));
  });
});
