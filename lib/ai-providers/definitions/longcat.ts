import { ProviderConfig } from "../types"

export const LONGCAT_PROVIDER: ProviderConfig = {
    id: "longcat",
    name: "Longcat AI",
    type: "openai_compatible",
    iconPath: "/providers/longcat.svg",
    description: "High-speed, long-context AI models.",
    defaultBaseUrl: "https://api.longcat.chat/openai/v1",
    isEnabled: true,
    models: [
        {
            id: "LongCat-Flash-Lite",
            label: "Flash-Lite",
            description: "High-speed / Lightweight / 320K tokens",
        },
        {
            id: "LongCat-Flash-Chat",
            label: "Flash-Chat",
            description: "General purpose / 256K tokens",
        },
        {
            id: "LongCat-Flash-Thinking-2601",
            label: "Flash-Thinking-2601",
            description: "Deep reasoning / Agent / 256K tokens",
        },
    ],
}
