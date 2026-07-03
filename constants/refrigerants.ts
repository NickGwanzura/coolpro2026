import { RefrigerantDefinition } from '@/types/index';

// Curated P-T chart / leak-rate reference data for the Sizing Tool. Real published ASHRAE
// safety class, GWP, and ODP values — not placeholder/mock data — just hardcoded because
// the underlying pressure-temperature curves are physical constants, not something an API
// provides. Limited to the common refrigerants this tool has curves for.
export const REFRIGERANT_REFERENCE: Record<string, RefrigerantDefinition> = {
  'R-290': {
    code: 'R-290',
    name: 'Propane',
    ashraeSafetyClass: 'A3',
    alertLevel: 'red',
    odp: 0,
    gwp: 3,
    nouApproved: true,
    ppeRequired: ['gloves', 'goggles', 'anti-static footwear'],
    handlingPrecautions: ['Ensure spark-free environment', 'Confirm ventilation before proceeding'],
  },
  'R-32': {
    code: 'R-32',
    name: 'Difluoromethane',
    ashraeSafetyClass: 'A2L',
    alertLevel: 'orange',
    odp: 0,
    gwp: 675,
    nouApproved: true,
    ppeRequired: ['gloves', 'goggles'],
    handlingPrecautions: ['Avoid ignition sources', 'Monitor concentration levels'],
  },
  'R-744': {
    code: 'R-744',
    name: 'Carbon Dioxide',
    ashraeSafetyClass: 'A1',
    alertLevel: 'green',
    odp: 0,
    gwp: 1,
    nouApproved: true,
    ppeRequired: ['gloves'],
    handlingPrecautions: ['Check confined space ventilation'],
  },
  'R-22': {
    code: 'R-22',
    name: 'Chlorodifluoromethane',
    ashraeSafetyClass: 'A1',
    alertLevel: 'green',
    odp: 0.055,
    gwp: 1810,
    nouApproved: false,
    ppeRequired: ['gloves', 'goggles'],
    handlingPrecautions: ['Controlled substance - NOU authorisation required'],
  },
};
