'use client';

import React, { useState, useEffect } from 'react';
import { detectLanguage, getBrowserLanguage, getLanguageNativeName, type SupportedLanguage } from '@/lib/languageRouter';

interface MultiLanguageSwitcherProps {
    onLanguageChange?: (lang: SupportedLanguage) => void;
    currentLanguage?: SupportedLanguage;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['ru', 'en', 'vi', 'es', 'pt', 'fr', 'de', 'ko', 'ja', 'zh'];

export default function MultiLanguageSwitcher({ onLanguageChange, currentLanguage }: MultiLanguageSwitcherProps) {
    const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(currentLanguage || getBrowserLanguage());
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (currentLanguage) {
            setSelectedLang(currentLanguage);
        }
    }, [currentLanguage]);

    const handleLanguageSelect = (lang: SupportedLanguage) => {
        setSelectedLang(lang);
        setIsOpen(false);
        onLanguageChange?.(lang);

        // Сохраняем в localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('edem_language', lang);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/40 border border-gray-700 hover:border-gray-600 text-sm text-gray-300 hover:text-white transition-colors"
            >
                <span className="text-lg">{getLanguageFlag(selectedLang)}</span>
                <span>{getLanguageNativeName(selectedLang)}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full mt-2 right-0 z-20 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[200px]">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <button
                                key={lang}
                                onClick={() => handleLanguageSelect(lang)}
                                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-800 transition-colors ${selectedLang === lang ? 'bg-gray-800' : ''
                                    }`}
                            >
                                <span className="text-lg">{getLanguageFlag(lang)}</span>
                                <span className="text-sm text-gray-300">{getLanguageNativeName(lang)}</span>
                                {selectedLang === lang && (
                                    <span className="ml-auto text-amber-400">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function getLanguageFlag(lang: SupportedLanguage): string {
    const flags: Record<SupportedLanguage, string> = {
        ru: '🇷🇺',
        en: '🇺🇸',
        vi: '🇻🇳',
        es: '🇪🇸',
        pt: '🇵🇹',
        fr: '🇫🇷',
        de: '🇩🇪',
        ko: '🇰🇷',
        ja: '🇯🇵',
        zh: '🇨🇳',
    };
    return flags[lang] || '🌐';
}

