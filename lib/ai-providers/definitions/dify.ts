import { ProviderConfig } from "../types"

export const DIFY_PROVIDER: ProviderConfig = {
    id: "dify",
    name: "Dify",
    type: "dify",
    iconPath: "/providers/dify.svg",
    description: "Dify LLMOps platform",
    defaultBaseUrl: "https://api.dify.ai/v1",
    models: [
        {
            id: "dify-default",
            label: "Dify App",
            description: "Dify default application model"
        }
    ]
}
