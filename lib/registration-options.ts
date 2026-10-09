// Answer lists for the public registration forms. Client-safe: shared by the form and the server check.

export const CONTRACTOR_TRADES = [
  'Installation',
  'Ductwork Fabrication',
  'Electrical',
  'Piping / Brazing',
  'Insulation',
  'General Contracting',
  'Other',
] as const;
export const YEARS_IN_OPERATION = ['Under 1 year', '1-3 years', '4-10 years', '11-20 years', '20+ years'] as const;
export const TEAM_SIZES = ['Just me', '2-5', '6-20', '21-50', '50+'] as const;
export const SAFETY_CERTIFICATION_ANSWERS = ['Yes', 'No', 'In progress'] as const;
export const CONTRACTOR_SERVICES = [
  'New Installation',
  'Retrofit',
  'Maintenance & Servicing',
  'Emergency Repairs',
  'Refrigerant Recovery',
  'Ductwork',
  'Electrical',
  'Consulting',
] as const;

export const MIN_EXPERIENCE_LENGTH = 20;
