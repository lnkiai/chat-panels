import { ProviderConfig } from "../types"

export const OPENAI_PROVIDER: ProviderConfig = {
    id: "openai",
    name: "OpenAI",
    type: "openai_compatible",
    iconPath: "/providers/openai.svg",
    description: "Industry standard models like GPT-4o.",
    defaultBaseUrl: "https://api.openai.com/v1",
    models: [
        { id: "gpt-4o", label: "GPT-4o", description: "Standard multimodal model (128k)" },
        { id: "gpt-4o-mini", label: "GPT-4o Mini", description: "Efficient small model (128k)" },
        { id: "o3-mini", label: "o3-mini", description: "Reasoning special model (128k)" },
        { id: "gpt-5", label: "GPT-5", description: "Flagship model (256k)" },
        { id: "gpt-5-mini", label: "GPT-5 Mini", description: "Lightweight GPT-5 (128k)" },
        { id: "o4-mini", label: "o4-mini", description: "Next-gen reasoning (128k)" },
    ]
}
