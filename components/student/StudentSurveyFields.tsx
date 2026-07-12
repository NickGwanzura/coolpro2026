import type { StudentSurveyData } from '@/types/index';

const ACCENT = '#5A7D5A';
const ACCENT_TINT = 'rgba(90,125,90,0.12)';
const BORDER = '#E5E0DB';

const GENDER_OPTIONS: { value: NonNullable<StudentSurveyData['gender']>; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const AGE_GROUP_OPTIONS: { value: NonNullable<StudentSurveyData['ageGroup']>; label: string }[] = [
  { value: 'under_25', label: 'Under 25' },
  { value: '25_34', label: '25–34' },
  { value: '35_44', label: '35–44' },
  { value: '45_54', label: '45–54' },
  { value: '55_64', label: '55–64' },
  { value: '65_plus', label: '65+' },
];

const LANGUAGE_OPTIONS: { value: NonNullable<StudentSurveyData['preferredLanguage']>; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'shona', label: 'Shona' },
  { value: 'ndebele', label: 'Ndebele' },
];

const PRACTICAL_ACCESS_OPTIONS: { value: NonNullable<StudentSurveyData['practicalEquipmentAccess']>; label: string }[] = [
  { value: 'full_access', label: 'Full access' },
  { value: 'partial_access', label: 'Partial access' },
  { value: 'no_access', label: 'No access' },
];

const INTERNET_ACCESS_OPTIONS: { value: NonNullable<StudentSurveyData['internetAccessForCoursework']>; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'never', label: 'Never' },
];

const CAREER_GOAL_OPTIONS: { value: NonNullable<StudentSurveyData['careerGoal']>; label: string }[] = [
  { value: 'technician', label: 'Become a registered technician' },
  { value: 'trainer', label: 'Become a trainer/lecturer' },
  { value: 'supplier', label: 'Work in refrigerant supply' },
  { value: 'other', label: 'Other' },
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
      className="w-full px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-[#5A7D5A] focus:border-transparent rounded-lg"
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
      className="w-full px-4 py-3 border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7D5A] focus:border-transparent rounded-lg"
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

export const STUDENT_SURVEY_KEYS: (keyof StudentSurveyData)[] = [
  'gender', 'ageGroup', 'preferredLanguage', 'practicalEquipmentAccess',
  'confidenceTheory', 'confidenceHandsOn', 'internetAccessForCoursework',
  'careerGoal', 'biggestStudyChallenge',
];

export function isStudentSurveyComplete(data: StudentSurveyData): boolean {
  return STUDENT_SURVEY_KEYS.every((key) => data[key] !== undefined && data[key] !== '');
}

export function StudentSurveyFields({
  value,
  onChange,
  required = false,
}: {
  value: StudentSurveyData;
  onChange: (data: StudentSurveyData) => void;
  required?: boolean;
}) {
  const update = <K extends keyof StudentSurveyData>(key: K, v: StudentSurveyData[K]) =>
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
          HEVACRAZ surveys the student pipeline to understand access to training resources and
          career direction. {required
            ? 'This is required for every student added to the network.'
            : "Answering helps inform sector support programmes — skip any or all of it if you'd rather not answer."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Gender" required={required}>
          <Select value={value.gender ?? ''} onChange={(v) => update('gender', (v || undefined) as StudentSurveyData['gender'])} required={required}>
            {placeholderOption}
            {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Age group" required={required}>
          <Select value={value.ageGroup ?? ''} onChange={(v) => update('ageGroup', (v || undefined) as StudentSurveyData['ageGroup'])} required={required}>
            {placeholderOption}
            {AGE_GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Preferred language" required={required}>
          <Select value={value.preferredLanguage ?? ''} onChange={(v) => update('preferredLanguage', (v || undefined) as StudentSurveyData['preferredLanguage'])} required={required}>
            {placeholderOption}
            {LANGUAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Access to practical/workshop training equipment" required={required}>
          <Select value={value.practicalEquipmentAccess ?? ''} onChange={(v) => update('practicalEquipmentAccess', (v || undefined) as StudentSurveyData['practicalEquipmentAccess'])} required={required}>
            {placeholderOption}
            {PRACTICAL_ACCESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Access to a computer/internet for coursework" required={required}>
          <Select value={value.internetAccessForCoursework ?? ''} onChange={(v) => update('internetAccessForCoursework', (v || undefined) as StudentSurveyData['internetAccessForCoursework'])} required={required}>
            {placeholderOption}
            {INTERNET_ACCESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Career goal after graduating" required={required}>
          <Select value={value.careerGoal ?? ''} onChange={(v) => update('careerGoal', (v || undefined) as StudentSurveyData['careerGoal'])} required={required}>
            {placeholderOption}
            {CAREER_GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Biggest challenge in your studies" required={required}>
          <Input value={value.biggestStudyChallenge ?? ''} onChange={(v) => update('biggestStudyChallenge', v || undefined)} placeholder="e.g. access to equipment, transport" required={required} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ScaleField label="Confidence with refrigeration theory" value={value.confidenceTheory} onChange={(v) => update('confidenceTheory', v)} required={required} />
        <ScaleField label="Confidence with hands-on/practical skills" value={value.confidenceHandsOn} onChange={(v) => update('confidenceHandsOn', v)} required={required} />
      </div>
    </fieldset>
  );
}
