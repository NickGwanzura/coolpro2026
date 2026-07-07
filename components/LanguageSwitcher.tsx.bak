'use client';

import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function LanguageSwitcher() {
    const { language, setLanguage } = useI18n();

    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <Languages className="h-4 w-4 text-gray-500" />
            <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${language === 'en' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${language === 'fr' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
                FR
            </button>
        </div>
    );
}
