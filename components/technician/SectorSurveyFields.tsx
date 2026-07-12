import type { TechnicianSurveyData } from '@/types/index';

const ACCENT = '#1E40AF';
const ACCENT_TINT = 'rgba(30,64,175,0.10)';
const BORDER = '#E5E0DB';

const GENDER_OPTIONS: { value: NonNullable<TechnicianSurveyData['gender']>; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const AGE_GROUP_OPTIONS: { value: NonNullable<TechnicianSurveyData['ageGroup']>; label: string }[] = [
  { value: 'under_25', label: 'Under 25' },
  { value: '25_34', label: '25–34' },
  { value: '35_44', label: '35–44' },
  { value: '45_54', label: '45–54' },
  { value: '55_64', label: '55–64' },
  { value: '65_plus', label: '65+' },
];

const EDUCATION_LEVEL_OPTIONS: { value: NonNullable<TechnicianSurveyData['educationLevel']>; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'primary', label: 'Primary' },
  { value: 'o_level', label: 'O-Level' },
  { value: 'a_level', label: 'A-Level' },
  { value: 'vocational', label: 'Vocational' },
  { value: 'national_certificate', label: 'National Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'degree', label: 'Degree' },
  { value: 'postgraduate', label: 'Postgraduate' },
];

const HAS_CERTIFICATION_OPTIONS: { value: NonNullable<TechnicianSurveyData['hasCertification']>; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'studying', label: 'Currently studying' },
];

const LOAD_SHEDDING_OPTIONS: { value: NonNullable<TechnicianSurveyData['loadSheddingFrequency']>; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'frequently', label: 'Frequently' },
  { value: 'daily', label: 'Daily' },
];

const RECOVERY_EQUIPMENT_OPTIONS: { value: NonNullable<TechnicianSurveyData['refrigerantRecoveryEquipmentUse']>; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'never', label: 'Never' },
  { value: 'no_access', label: 'No access to equipment' },
];

const PPE_ACCESS_OPTIONS: { value: NonNullable<TechnicianSurveyData['ppeAccess']>; label: string }[] = [
  { value: 'full_provided', label: 'Fully provided by employer' },
  { value: 'partial_provided', label: 'Partially provided' },
  { value: 'self_provided', label: 'I provide my own' },
  { value: 'none', label: 'No PPE access' },
];

const ENERGY_EFFICIENT_OPTIONS: { value: NonNullable<TechnicianSurveyData['installsEnergyEfficient']>; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'on_request', label: 'On request' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'never', label: 'Never' },
];

const LANGUAGE_OPTIONS: { value: NonNullable<TechnicianSurveyData['preferredLanguage']>; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'shona', label: 'Shona' },
  { value: 'ndebele', label: 'Ndebele' },
];

/** Every key the sector survey can capture — used to check completeness when the survey is required. */
export const SECTOR_SURVEY_KEYS: (keyof TechnicianSurveyData)[] = [
  'gender', 'ageGroup', 'educationLevel', 'hasCertification', 'preferredLanguage',
  'biggestDailyChallenge', 'loadSheddingFrequency', 'refrigerantRecoveryEquipmentUse',
  'ppeAccess', 'installsEnergyEfficient', 'confidenceTraditionalRefrigerants',
  'confidenceLowGwpRefrigerants', 'accessToTools', 'accessToSpareParts', 'accessToLowGwpRefrigerants',
];

export function isSectorSurveyComplete(data: TechnicianSurveyData): boolean {
  return SECTOR_SURVEY_KEYS.every((key) => data[key] !== undefined && data[key] !== '');
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: '#1C1917' }}>
        {label}
        {required ? <span className="ml-1" style={{ color: '#DC2626' }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, required, placeholder }: { value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent rounded-lg"
      style={{ borderColor: BORDER }}
    />
  );
}

function Select({ value, onChange, required, children }: { value: string; onChange: (v: string) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-4 py-3 border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
      style={{ borderColor: BORDER }}
    >
      {children}
    </select>
  );
}

function ScaleField({ label, value, onChange, required }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: '#1C1917' }}>
        {label}
        {required ? <span className="ml-1" style={{ color: '#DC2626' }}>*</span> : null}
        <span className="ml-1 text-xs font-normal text-gray-400">(1 = very low, 5 = very high)</span>
      </label>
      <div className="grid grid-cols-6 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? undefined : n)}
            className="py-2.5 text-sm font-semibold border transition-colors rounded-lg"
            style={{
              borderColor: value === n ? ACCENT : BORDER,
              backgroundColor: value === n ? ACCENT_TINT : '#ffffff',
              color: value === n ? ACCENT : '#1C1917',
            }}
          >
            {n}
          </button>
        ))}
        {!required && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="py-2.5 text-xs font-semibold border transition-colors rounded-lg"
            style={{
              borderColor: value === undefined ? ACCENT : BORDER,
              backgroundColor: value === undefined ? ACCENT_TINT : '#ffffff',
              color: value === undefined ? ACCENT : '#9CA3AF',
            }}
          >
            N/A
          </button>
        )}
      </div>
    </div>
  );
}

export function SectorSurveyFields({
  value,
  onChange,
  required = false,
}: {
  value: TechnicianSurveyData;
  onChange: (data: TechnicianSurveyData) => void;
  required?: boolean;
}) {
  const update = <K extends keyof TechnicianSurveyData>(key: K, v: TechnicianSurveyData[K]) =>
    onChange({ ...value, [key]: v });

  const placeholderOption = required
    ? <option value="" disabled>Select an answer</option>
    : <option value="">Prefer not to answer</option>;

  return (
    <fieldset className="space-y-5">
      <div>
        <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Sector Survey {required ? '(required)' : '(optional)'}
        </legend>
        <p className="mt-2 text-xs text-gray-500">
          HEVACRAZ periodically surveys the national technician workforce to understand access to
          tools, training, and safety equipment. {required
            ? 'This is required for every technician added to the registry.'
            : "Answering helps inform sector support programmes — skip any or all of it if you'd rather not answer."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Gender" required={required}>
          <Select value={value.gender ?? ''} onChange={(v) => update('gender', (v || undefined) as TechnicianSurveyData['gender'])} required={required}>
            {placeholderOption}
            {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Age group" required={required}>
          <Select value={value.ageGroup ?? ''} onChange={(v) => update('ageGroup', (v || undefined) as TechnicianSurveyData['ageGroup'])} required={required}>
            {placeholderOption}
            {AGE_GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Education level" required={required}>
          <Select value={value.educationLevel ?? ''} onChange={(v) => update('educationLevel', (v || undefined) as TechnicianSurveyData['educationLevel'])} required={required}>
            {placeholderOption}
            {EDUCATION_LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Do you hold a refrigeration/HVAC certification?" required={required}>
          <Select value={value.hasCertification ?? ''} onChange={(v) => update('hasCertification', (v || undefined) as TechnicianSurveyData['hasCertification'])} required={required}>
            {placeholderOption}
            {HAS_CERTIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Preferred language" required={required}>
          <Select value={value.preferredLanguage ?? ''} onChange={(v) => update('preferredLanguage', (v || undefined) as TechnicianSurveyData['preferredLanguage'])} required={required}>
            {placeholderOption}
            {LANGUAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Biggest daily challenge" required={required}>
          <Input value={value.biggestDailyChallenge ?? ''} onChange={(v) => update('biggestDailyChallenge', v || undefined)} placeholder="e.g. power outages, spare parts access" required={required} />
        </Field>
        <Field label="How often does load shedding affect your work?" required={required}>
          <Select value={value.loadSheddingFrequency ?? ''} onChange={(v) => update('loadSheddingFrequency', (v || undefined) as TechnicianSurveyData['loadSheddingFrequency'])} required={required}>
            {placeholderOption}
            {LOAD_SHEDDING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="How often do you use refrigerant recovery equipment?" required={required}>
          <Select value={value.refrigerantRecoveryEquipmentUse ?? ''} onChange={(v) => update('refrigerantRecoveryEquipmentUse', (v || undefined) as TechnicianSurveyData['refrigerantRecoveryEquipmentUse'])} required={required}>
            {placeholderOption}
            {RECOVERY_EQUIPMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Access to personal protective equipment (PPE)" required={required}>
          <Select value={value.ppeAccess ?? ''} onChange={(v) => update('ppeAccess', (v || undefined) as TechnicianSurveyData['ppeAccess'])} required={required}>
            {placeholderOption}
            {PPE_ACCESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Do you install energy-efficient systems?" required={required}>
          <Select value={value.installsEnergyEfficient ?? ''} onChange={(v) => update('installsEnergyEfficient', (v || undefined) as TechnicianSurveyData['installsEnergyEfficient'])} required={required}>
            {placeholderOption}
            {ENERGY_EFFICIENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ScaleField label="Confidence with traditional refrigerants" value={value.confidenceTraditionalRefrigerants} onChange={(v) => update('confidenceTraditionalRefrigerants', v)} required={required} />
        <ScaleField label="Confidence with low-GWP refrigerants" value={value.confidenceLowGwpRefrigerants} onChange={(v) => update('confidenceLowGwpRefrigerants', v)} required={required} />
        <ScaleField label="Access to tools" value={value.accessToTools} onChange={(v) => update('accessToTools', v)} required={required} />
        <ScaleField label="Access to spare parts" value={value.accessToSpareParts} onChange={(v) => update('accessToSpareParts', v)} required={required} />
        <ScaleField label="Access to low-GWP refrigerants" value={value.accessToLowGwpRefrigerants} onChange={(v) => update('accessToLowGwpRefrigerants', v)} required={required} />
      </div>
    </fieldset>
  );
}
