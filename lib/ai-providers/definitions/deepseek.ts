import { ProviderConfig } from "../types"

export const DEEPSEEK_PROVIDER: ProviderConfig = {
    id: "deepseek",
    name: "DeepSeek",
    type: "openai_compatible",
    iconPath: "/providers/deepseek.svg",
    description: "Highly capable open-weight models.",
    defaultBaseUrl: "https://api.deepseek.com",
    models: [
        { id: "deepseek-chat", label: "DeepSeek Chat", description: "General purpose (128k)" },
        { id: "deepseek-reasoner", label: "DeepSeek Reasoner", description: "R1-based reasoning (128k)" },
        { id: "DeepSeek-V3.2", label: "DeepSeek V3.2", description: "Latest flagship" },
        { id: "deepseek-coder", label: "DeepSeek Coder", description: "Coding specialist" },
    ]
}
