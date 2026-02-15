import { ProviderConfig } from "../types"

export const GEMINI_PROVIDER: ProviderConfig = {
    id: "gemini",
    name: "Google Gemini",
    type: "gemini", // Needs specific implementation
    iconPath: "/providers/gemini.svg",
    description: "Google's multimodal AI models.",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: [
        { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Long context reasoning" },
        { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", description: "Fast execution" },
        { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Efficient and capable" },
        { id: "gemini-3-pro", label: "Gemini 3 Pro", description: "Flagship model" },
        { id: "gemini-3-flash", label: "Gemini 3 Flash", description: "Next-gen fast model" },
    ]
}
