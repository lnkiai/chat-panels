import { ProviderConfig } from "../types"

export const GEMINI_PROVIDER: ProviderConfig = {
    id: "gemini",
    name: "Google Gemini",
    type: "gemini",
    iconPath: "/providers/gemini.svg",
    description: "Google's multimodal AI models.",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: [
        { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Flagship · deep reasoning & coding" },
        { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Fast · low latency with reasoning" },
        { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", description: "Fastest & lowest cost" },
        { id: "gemini-3-pro", label: "Gemini 3 Pro (Preview)", description: "Advanced multimodal reasoning" },
        { id: "gemini-3-flash", label: "Gemini 3 Flash (Preview)", description: "Next-gen at lower cost" },
    ]
}
