"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { Language, translations, TranslationKey } from "./translations"

type I18nContextType = {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const STORAGE_KEY = "chat-panels-language"

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en")

    useEffect(() => {
        // Client-side detection
        const saved = localStorage.getItem(STORAGE_KEY) as Language | null
        if (saved && (saved === "en" || saved === "ja" || saved === "zh")) {
            setLanguageState(saved)
        } else {
            const browserLang = navigator.language.slice(0, 2).toLowerCase()
            if (browserLang === "ja") setLanguageState("ja")
            else if (browserLang === "zh") setLanguageState("zh")
            else setLanguageState("en")
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem(STORAGE_KEY, lang)
    }

    const t = (key: TranslationKey): string => {
        // Fallback to English if key somehow misses in selected lang dict
        return translations[language][key] || translations["en"][key] || key
    }

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider")
    }
    return context
}
