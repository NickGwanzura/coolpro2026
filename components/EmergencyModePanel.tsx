'use client';

import { AlertTriangle, WifiOff } from 'lucide-react';
import { useMemo } from 'react';
import { useEmergencyMode } from '@/lib/emergencyMode';
import { useI18n } from '@/lib/i18n';
import { getEmergencySafetyScripts } from '@/lib/refrigerantIntelligence';
import { RefrigerantRiskBadge } from '@/components/RefrigerantRiskBadge';

export function EmergencyModePanel() {
    const { emergencyMode, toggleEmergencyMode } = useEmergencyMode();
    const { language, t } = useI18n();
    const scripts = useMemo(() => getEmergencySafetyScripts(language), [language]);

    return (
        <section className={`border p-6 shadow-sm transition ${emergencyMode ? 'border-rose-200 bg-rose-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">{t.offlineProtocols}</p>
                    <h2 className="mt-2 text-xl font-bold text-gray-900">{t.emergencyMode}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        Load local safety scripts, switch the UI into a high-contrast emergency state, and keep key refrigerant procedures available without connectivity.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={toggleEmergencyMode}
                    className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${emergencyMode ? 'bg-rose-600 text-white hover:bg-rose-700' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    {emergencyMode ? <AlertTriangle className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    {emergencyMode ? 'Emergency mode active' : 'Activate emergency mode'}
                </button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {scripts.map((script) => (
                    <article key={script.id} className="border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-500">{script.refrigerantCode}</p>
                                <h3 className="mt-1 text-lg font-bold text-gray-900">{script.title}</h3>
                            </div>
                            <RefrigerantRiskBadge color={script.severity} label={script.severity} />
                        </div>
                        <div className="mt-4 space-y-2">
                            {script.steps.map((step) => (
                                <div key={step} className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                    {step}
                                </div>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
