# AIプロバイダ モデル一覧API & 最新モデルリファレンス

## 概要

多くのAIプロバイダはOpenAI互換の `/v1/models` エンドポイントを提供しており、APIで動的にモデル一覧を取得できます。これにより、アプリ内でプロバイダのモデルを自動的に更新することが可能です。

---

## 1. OpenAI

### モデル一覧API

```http
GET https://api.openai.com/v1/models
Authorization: Bearer YOUR_API_KEY
```

### レスポンス例

```json
{
  "data": [
    {"id": "gpt-4o", "object": "model", "created": 1715367049, "owned_by": "openai"},
    {"id": "gpt-4o-mini", "object": "model", "created": 1715367049, "owned_by": "openai"},
    {"id": "o3-mini", "object": "model", "created": 1738281600, "owned_by": "openai"}
  ]
}
```

### 最新モデル一覧（2025年）

| モデル名 | 説明 | コンテキスト |
|---------|------|------------|
| `gpt-5` | GPT-5 フラッグシップモデル | 256k |
| `gpt-5-mini` | GPT-5 軽量版 | 128k |
| `gpt-4o` | GPT-4o マルチモーダル | 128k |
| `gpt-4o-mini` | GPT-4o 軽量版 | 128k |
| `o4-mini` | 推論特化モデル | 128k |
| `o3-mini` | 推論特化モデル（前世代） | 128k |
| `gpt-4.1` | GPT-4.1 最新世代 | 128k |
| `gpt-4.1-mini` | GPT-4.1 軽量版 | 128k |

---

## 2. Anthropic (Claude)

### モデル一覧API

```http
GET https://api.anthropic.com/v1/models
x-api-key: YOUR_API_KEY
anthropic-version: 2023-06-01
```

### レスポンス例

```json
{
  "data": [
    {"id": "claude-opus-4-20250514", "display_name": "Claude Opus 4", "type": "model"},
    {"id": "claude-sonnet-4-20250514", "display_name": "Claude Sonnet 4", "type": "model"}
  ],
  "has_more": false
}
```

### 最新モデル一覧（2025年）

| モデル名 | 説明 | コンテキスト |
|---------|------|------------|
| `claude-opus-4-20250514` | Claude 4 Opus（最高性能） | 200k |
| `claude-sonnet-4-20250514` | Claude 4 Sonnet（バランス型） | 200k |
| `claude-3-7-sonnet-20250219` | Claude 3.7 Sonnet | 200k |
| `claude-3-5-haiku-20241022` | Claude 3.5 Haiku（高速） | 200k |
| `claude-3-opus-20240229` | Claude 3 Opus | 200k |
| `claude-3-haiku-20240307` | Claude 3 Haiku | 200k |

---

## 3. Google Gemini

### モデル一覧API

```http
GET https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY
```

### レスポンス例

```json
{
  "models": [
    {"name": "models/gemini-2.5-pro", "displayName": "Gemini 2.5 Pro", "supportedGenerationMethods": ["generateContent"]},
    {"name": "models/gemini-2.5-flash", "displayName": "Gemini 2.5 Flash", "supportedGenerationMethods": ["generateContent"]}
  ]
}
```

### 最新モデル一覧（2025年）

| モデル名 | 説明 | コンテキスト |
|---------|------|------------|
| `gemini-3-pro` | Gemini 3 Pro（最新） | 1M |
| `gemini-3-flash` | Gemini 3 Flash（高速） | 1M |
| `gemini-2.5-pro` | Gemini 2.5 Pro | 1M |
| `gemini-2.5-flash` | Gemini 2.5 Flash | 1M |
| `gemini-2.5-flash-lite` | Gemini 2.5 Flash Lite | 128k |
| `gemini-2.0-flash` | Gemini 2.0 Flash（非推奨予定） | 1M |

---

## 4. DeepSeek

### モデル一覧API

```http
GET https://api.deepseek.com/v1/models
Authorization: Bearer YOUR_API_KEY
```

### 最新モデル一覧（2025年）

| モデル名 | 説明 | コンテキスト |
|---------|------|------------|
| `deepseek-chat` | 汎用チャットモデル | 128k |
| `deepseek-reasoner` | 推論特化（R1ベース） | 128k |
| `DeepSeek-V3.2` | V3.2 最新版 | 128k |
| `DeepSeek-V3.2-Speciale` | V3.2 高性能版（API限定） | 128k |
| `DeepSeek-V3-Ultra` | マルチモーダル MoE | 1M |
| `deepseek-coder` | コード生成特化 | 128k |

---

## 5. Qwen (通義千問 / Alibaba)

### モデル一覧API

```http
GET https://dashscope.aliyuncs.com/api/v1/models
Authorization: Bearer YOUR_API_KEY
```

**国際版エンドポイント:**
- シンガポール: `https://dashscope-intl.aliyuncs.com/api/v1/models`

### 最新モデル一覧（2025年）

| モデル名 | 説明 | コンテキスト |
|---------|------|------------|
| `qwen3-235b-a22b` | Qwen3 フラッグシップ | 128k |
| `qwen-max` | Qwen Max（高性能） | 128k |
| `qwen-plus` | Qwen Plus（バランス型） | 128k |
| `qwen-turbo` | Qwen Turbo（高速） | 128k |
| `qwen-long` | Qwen Long（長文） | 1M |
| `qwen2.5-omni-7b` | マルチモーダル統合 | 128k |
| `qwen-coder-plus` | コード生成特化 | 128k |

---

## 6. OpenRouter（マルチプロバイダ統合）

### モデル一覧API ⭐ 推奨

```http
GET https://openrouter.ai/api/v1/models
Authorization: Bearer YOUR_API_KEY
```

### 特徴
- **400以上��モデル**を単一APIで利用可能
- 各プロバイダのモデルを統一フォーマットで取得
- 価格情報、コンテキスト長、対応パラメータなど詳細メタデータ付き

### レスポンス例

```json
{
  "data": [
    {
      "id": "openai/gpt-4o",
      "name": "GPT-4o",
      "pricing": {"prompt": "0.000005", "completion": "0.000015"},
      "context_length": 128000,
      "architecture": {"modality": "text+image->text"}
    },
    {
      "id": "anthropic/claude-3-opus",
      "name": "Claude 3 Opus",
      "pricing": {"prompt": "0.000015", "completion": "0.000075"},
      "context_length": 200000
    }
  ]
}
```

---

## 7. xAI (Grok)

### モデル一覧API

```http
GET https://api.x.ai/v1/models
Authorization: Bearer YOUR_API_KEY
```

### 最新モデル一覧（2025年）

| モデル名 | 説明 | コンテキスト |
|---------|------|------------|
| `grok-4` | Grok 4 フラッグシップ | 256k |
| `grok-4.1` | Grok 4.1 強化版 | 256k |
| `grok-3` | Grok 3 | 128k |
| `grok-3-mini` | Grok 3 Mini | 128k |
| `grok-3-mini-fast` | Grok 3 Mini Fast | 128k |
| `grok-code-fast` | コード特化高速 | 128k |

---

## 8. Zhipu AI (ChatGLM / Z.ai)

### モデル一覧API

```http
POST https://open.bigmodel.cn/api/paas/v4/chat/completions
Authorization: Bearer YOUR_API_KEY
```

**国際版:**
```http
https://api.z.ai/v1/models
```

### 最新モデル一覧（2025年）

| モデル名 | 説明 | コンテキスト |
|---------|------|------------|
| `glm-4.5` | GLM-4.5 フラッグシップ | 128k |
| `glm-4.5-air` | GLM-4.5 軽量版 | 128k |
| `glm-4` | GLM-4 基本 | 128k |
| `glm-4-plus` | GLM-4 Plus | 128k |
| `glm-4-flash` | GLM-4 Flash（高速） | 128k |
| `glm-4-long` | GLM-4 Long（長文） | 1M |
| `glm-4v` | GLM-4 Vision | 128k |
| `glm-4v-plus` | GLM-4 Vision Plus | 128k |
| `codegeex-4` | CodeGeex 4（コード） | 128k |

---

## 実装例: 動的モデルリスト取得

### TypeScript実装例

```typescript
// providers/model-fetcher.ts

interface ModelInfo {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

interface ProviderModelsConfig {
  endpoint: string;
  headers: Record<string, string>;
  parseResponse: (data: any) => ModelInfo[];
}

const providerConfigs: Record<string, ProviderModelsConfig> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/models',
    headers: { 'Authorization': 'Bearer {{API_KEY}}' },
    parseResponse: (data) => data.data.map((m: any) => ({
      id: m.id,
      name: m.id,
    })),
  },
  
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/models',
    headers: {
      'x-api-key': '{{API_KEY}}',
      'anthropic-version': '2023-06-01',
    },
    parseResponse: (data) => data.data.map((m: any) => ({
      id: m.id,
      name: m.display_name || m.id,
    })),
  },
  
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    headers: {},
    parseResponse: (data) => data.models.map((m: any) => ({
      id: m.name.replace('models/', ''),
      name: m.displayName,
    })),
  },
  
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1/models',
    headers: { 'Authorization': 'Bearer {{API_KEY}}' },
    parseResponse: (data) => data.data.map((m: any) => ({
      id: m.id,
      name: m.id,
    })),
  },
  
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1/models',
    headers: { 'Authorization': 'Bearer {{API_KEY}}' },
    parseResponse: (data) => data.data.map((m: any) => ({
      id: m.id,
      name: m.name,
      context_length: m.context_length,
      pricing: m.pricing,
    })),
  },
  
  xai: {
    endpoint: 'https://api.x.ai/v1/models',
    headers: { 'Authorization': 'Bearer {{API_KEY}}' },
    parseResponse: (data) => data.data.map((m: any) => ({
      id: m.id,
      name: m.id,
    })),
  },
  
  qwen: {
    endpoint: 'https://dashscope-intl.aliyuncs.com/api/v1/models',
    headers: { 'Authorization': 'Bearer {{API_KEY}}' },
    parseResponse: (data) => data.data.map((m: any) => ({
      id: m.id,
      name: m.id,
    })),
  },
};

async function fetchModels(provider: string, apiKey: string): Promise<ModelInfo[]> {
  const config = providerConfigs[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.headers)) {
    headers[key] = value.replace('{{API_KEY}}', apiKey);
  }
  
  // Geminiの場合はクエリパラメータでAPIキーを渡す
  let url = config.endpoint;
  if (provider === 'gemini') {
    url += `?key=${apiKey}`;
  }
  
  const response = await fetch(url, { headers });
  const data = await response.json();
  
  return config.parseResponse(data);
}

// 使用例
async function main() {
  const openaiModels = await fetchModels('openai', process.env.OPENAI_API_KEY!);
  console.log('OpenAI Models:', openaiModels);
  
  const openrouterModels = await fetchModels('openrouter', process.env.OPENROUTER_API_KEY!);
  console.log('OpenRouter Models:', openrouterModels.length, 'models available');
}
```

---

## 推奨アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
├─────────────────────────────────────────────────────────┤
│                   Model Registry                         │
│  ┌─────────────────────────────────────────────────────┤
│  │  - キャッシュされたモデルリスト                      │
│  │  - 定期的にAPIから更新（1日1回など）                │
│  │  - フォールバック用の静的モデルリスト                │
│  └─────────────────────────────────────────────────────┤
├─────────────────────────────────────────────────────────┤
│                  Provider Adapters                       │
│  ┌──────────┬──────────┬──────────┬──────────┬─────────┤
│  │ OpenAI   │ Claude   │ Gemini   │ DeepSeek │ etc.    │
│  │ Adapter  │ Adapter  │ Adapter  │ Adapter  │         │
│  └──────────┴──────────┴──────────┴──────────┴─────────┤
└─────────────────────────────────────────────────────────┘
```

---

## まとめ

| プロバイダ | モデル一覧API | 認証方法 |
|-----------|--------------|---------|
| OpenAI | `GET /v1/models` | Bearer Token |
| Anthropic | `GET /v1/models` | x-api-key + anthropic-version |
| Gemini | `GET /v1beta/models` | Query param `?key=` |
| DeepSeek | `GET /v1/models` | Bearer Token |
| Qwen | `GET /api/v1/models` | Bearer Token |
| OpenRouter | `GET /api/v1/models` | Bearer Token |
| xAI | `GET /v1/models` | Bearer Token |
| Zhipu | 明示的エンドポイントなし | Bearer Token |

**💡 ポイント:**
- **OpenRouter**を使えば400以上のモデルを一括で取得可能（メタ情報付き）
- ほとんどのプロバイダはOpenAI互換の `/v1/models` エンドポイントを提供
- APIから取得したモデルリストをキャッシュし、フォールバック用に静的リストも保持すると堅牢