"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Languages, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Language } from "@/lib/i18n/translations"
import { cn } from "@/lib/utils"

const LANGUAGES: { id: Language; label: string }[] = [
    { id: "en", label: "English" },
    { id: "ja", label: "日本語" },
    { id: "zh", label: "中文" },
]

export function LanguageSelector({ modalMode = true, className }: { modalMode?: boolean, className?: string }) {
    const { language, setLanguage } = useI18n()
    const [open, setOpen] = useState(false)

    if (!modalMode) {
        return (
            <div className={cn("flex items-center gap-1", className)}>
                {LANGUAGES.map(l => (
                    <button
                        key={l.id}
                        onClick={() => setLanguage(l.id)}
                        className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                            language === l.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        {l.label}
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div className={cn("relative z-50", className)}>
            <motion.button
                onClick={() => setOpen(!open)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center p-2 rounded-full bg-background border border-border shadow-sm hover:border-primary/40 transition-colors text-muted-foreground hover:text-foreground"
            >
                <Languages className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="absolute bottom-full right-0 mb-3 w-36 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 p-1"
                        >
                            {LANGUAGES.map((l) => (
                                <button
                                    key={l.id}
                                    onClick={() => {
                                        setLanguage(l.id)
                                        setOpen(false)
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                                        language === l.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                    )}
                                >
                                    {l.label}
                                    {language === l.id && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
