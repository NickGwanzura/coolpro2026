"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppLanguage } from '@/types/index';

type Dictionary = {
    emergencyMode: string;
    language: string;
    offlineProtocols: string;
    scanNameplate: string;
    imageAnnotation: string;
    certifyZim: string;
};

const DICTIONARY: Record<AppLanguage, Dictionary> = {
    en: {
        emergencyMode: 'Emergency Mode',
        language: 'Language',
        offlineProtocols: 'Offline Safety Protocols',
        scanNameplate: 'Scan Nameplate',
        imageAnnotation: 'Image Annotation',
        certifyZim: 'CertifyZim',
    },
    fr: {
        emergencyMode: 'Mode d’urgence',
        language: 'Langue',
        offlineProtocols: 'Protocoles de securite hors ligne',
        scanNameplate: 'Scanner la plaque signaletique',
        imageAnnotation: 'Annotation d’image',
        certifyZim: 'CertifyZim',
    },
};

interface I18nContextValue {
    language: AppLanguage;
    setLanguage: (language: AppLanguage) => void;
    t: Dictionary;
    speechLocale: string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getInitialLanguage(): AppLanguage {
    if (typeof window === 'undefined') {
        return 'en';
    }

    const saved = window.localStorage.getItem('coolpro_language');
    return saved === 'fr' ? 'fr' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<AppLanguage>(getInitialLanguage);

    useEffect(() => {
        window.localStorage.setItem('coolpro_language', language);
        document.documentElement.lang = language;
    }, [language]);

    const value = useMemo<I18nContextValue>(() => ({
        language,
        setLanguage,
        t: DICTIONARY[language],
        speechLocale: language === 'fr' ? 'fr-FR' : 'en-US',
    }), [language]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }

    return context;
}
