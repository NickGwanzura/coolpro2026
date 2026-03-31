import { RefrigerantDefinition } from '@/types/index';

export const MOCK_REFRIGERANTS: Record<string, RefrigerantDefinition> = {
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

export const MOCK_REFRIGERANT_LIST: RefrigerantDefinition[] = Object.values(MOCK_REFRIGERANTS);
