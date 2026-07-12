import type { SupplierSurveyData } from '@/types/index';

const ACCENT = '#D97706';
const ACCENT_TINT = 'rgba(217,119,6,0.12)';
const BORDER = '#E5E0DB';

const EMPLOYEE_COUNT_OPTIONS: { value: NonNullable<SupplierSurveyData['employeeCountBand']>; label: string }[] = [
  { value: '1_5', label: '1–5' },
  { value: '6_20', label: '6–20' },
  { value: '21_50', label: '21–50' },
  { value: '51_200', label: '51–200' },
  { value: '200_plus', label: '200+' },
];

const YEARS_OPERATION_OPTIONS: { value: NonNullable<SupplierSurveyData['yearsInOperation']>; label: string }[] = [
  { value: 'under_1', label: 'Under 1 year' },
  { value: '1_3', label: '1–3 years' },
  { value: '4_10', label: '4–10 years' },
  { value: '11_20', label: '11–20 years' },
  { value: '20_plus', label: '20+ years' },
];

const RECOVERY_EQUIPMENT_OPTIONS: { value: NonNullable<SupplierSurveyData['recoveryEquipmentAccess']>; label: string }[] = [
  { value: 'always', label: 'Always available' },
  { value: 'sometimes', label: 'Sometimes available' },
  { value: 'rarely', label: 'Rarely available' },
  { value: 'never', label: 'Never available' },
  { value: 'no_access', label: 'No access to equipment' },
];

const LOAD_SHEDDING_OPTIONS: { value: NonNullable<SupplierSurveyData['loadSheddingFrequency']>; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'frequently', label: 'Frequently' },
  { value: 'daily', label: 'Daily' },
];

const LANGUAGE_OPTIONS: { value: NonNullable<SupplierSurveyData['preferredLanguage']>; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'shona', label: 'Shona' },
  { value: 'ndebele', label: 'Ndebele' },
];

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
      className="w-full px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent rounded-lg"
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
      className="w-full px-4 py-3 border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent rounded-lg"
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

export const SUPPLIER_SURVEY_KEYS: (keyof SupplierSurveyData)[] = [
  'employeeCountBand', 'yearsInOperation', 'recoveryEquipmentAccess',
  'storageComplianceConfidence', 'lowGwpRegulationConfidence', 'loadSheddingFrequency',
  'preferredLanguage', 'biggestDistributionChallenge',
];

export function isSupplierSurveyComplete(data: SupplierSurveyData): boolean {
  return SUPPLIER_SURVEY_KEYS.every((key) => data[key] !== undefined && data[key] !== '');
}

export function SupplierSurveyFields({
  value,
  onChange,
  required = false,
}: {
  value: SupplierSurveyData;
  onChange: (data: SupplierSurveyData) => void;
  required?: boolean;
}) {
  const update = <K extends keyof SupplierSurveyData>(key: K, v: SupplierSurveyData[K]) =>
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
          HEVACRAZ and the National Ozone Unit survey approved suppliers to understand supply-chain
          capacity and compliance readiness. {required
            ? 'This is required for every supplier added to the network.'
            : "Answering helps inform sector support programmes — skip any or all of it if you'd rather not answer."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Business size (employee count)" required={required}>
          <Select value={value.employeeCountBand ?? ''} onChange={(v) => update('employeeCountBand', (v || undefined) as SupplierSurveyData['employeeCountBand'])} required={required}>
            {placeholderOption}
            {EMPLOYEE_COUNT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Years in operation" required={required}>
          <Select value={value.yearsInOperation ?? ''} onChange={(v) => update('yearsInOperation', (v || undefined) as SupplierSurveyData['yearsInOperation'])} required={required}>
            {placeholderOption}
            {YEARS_OPERATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Access to refrigerant recovery/reclamation equipment" required={required}>
          <Select value={value.recoveryEquipmentAccess ?? ''} onChange={(v) => update('recoveryEquipmentAccess', (v || undefined) as SupplierSurveyData['recoveryEquipmentAccess'])} required={required}>
            {placeholderOption}
            {RECOVERY_EQUIPMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="How often does load shedding affect operations?" required={required}>
          <Select value={value.loadSheddingFrequency ?? ''} onChange={(v) => update('loadSheddingFrequency', (v || undefined) as SupplierSurveyData['loadSheddingFrequency'])} required={required}>
            {placeholderOption}
            {LOAD_SHEDDING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Preferred language" required={required}>
          <Select value={value.preferredLanguage ?? ''} onChange={(v) => update('preferredLanguage', (v || undefined) as SupplierSurveyData['preferredLanguage'])} required={required}>
            {placeholderOption}
            {LANGUAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Biggest supply/distribution challenge" required={required}>
          <Input value={value.biggestDistributionChallenge ?? ''} onChange={(v) => update('biggestDistributionChallenge', v || undefined)} placeholder="e.g. import delays, storage capacity" required={required} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ScaleField label="Storage facility compliance confidence" value={value.storageComplianceConfidence} onChange={(v) => update('storageComplianceConfidence', v)} required={required} />
        <ScaleField label="Confidence with low-GWP handling regulations" value={value.lowGwpRegulationConfidence} onChange={(v) => update('lowGwpRegulationConfidence', v)} required={required} />
      </div>
    </fieldset>
  );
}
