# AI プロバイダ設定リファレンス

Difyのモデルプロバイダシステムを参考にした、AIプロバイダのConfiguration設計ガイドです。

## 概要

DifyではAIプロバイダはプラグイン形式で管理されており、各プロバイダは以下の識別子形式で管理されます：
- `langgenius/openai/openai`
- `langgenius/anthropic/anthropic`
- `langgenius/gemini/google`
- `langgenius/deepseek/deepseek`
- `langgenius/tongyi/tongyi`

## プロバイダ共通設定構造

```typescript
// 基本的なプロバイダ設定インターフェース
interface ProviderConfig {
  provider: string;           // プロバイダID（例: 'openai', 'anthropic'）
  credentials: {
    api_key: string;          // APIキー
    api_base?: string;        // カスタムエンドポイント（オプション）
    organization?: string;    // 組織ID（オプション）
  };
}

// プロバイダエンティティの構造
interface ProviderEntity {
  provider: string;
  label: I18nObject;
  description?: I18nObject;
  supported_model_types: ModelType[];
  configurate_methods: ConfigurationMethod[];
  provider_credential_schema: CredentialSchema;
  model_credential_schema: ModelCredentialSchema;
}

enum ModelType {
  LLM = 'llm',
  TEXT_EMBEDDING = 'text-embedding',
  RERANK = 'rerank',
  SPEECH2TEXT = 'speech2text',
  TTS = 'tts',
  MODERATION = 'moderation',
}
```

---

## 1. OpenAI

### 設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `openai_api_key` | OpenAI APIキー | 必須 |
| `openai_api_base` | カスタムエンドポイントURL | `https://api.openai.com/v1` |
| `openai_organization` | 組織ID | null |

### Credentials キー

```python
# api/core/hosting_configuration.py より
credentials = {
    "openai_api_key": api_key,
    "openai_api_base": base_url,      # オプション
    "openai_organization": org_id,    # オプション
}
```

### 対応モデル（例）

```
gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-3.5-turbo
o3-mini, o4-mini, gpt-4.1, gpt-4.1-mini
```

### OpenAI互換プロバイダへの適用

NebiusなどのOpenAI互換APIは、エンドポイントを変更するだけで対応可能：

```typescript
const nebiusConfig: ProviderConfig = {
  provider: 'openai_compatible',
  credentials: {
    api_key: 'your-nebius-api-key',
    api_base: 'https://api.nebius.ai/v1',  // エンドポイントのみ変更
  }
};
```

---

## 2. Anthropic (Claude)

### 設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `anthropic_api_key` | Anthropic APIキー | 必須 |
| `anthropic_api_url` | カスタムエンドポイントURL | `https://api.anthropic.com` |

### Credentials キー

```python
# api/core/hosting_configuration.py より
credentials = {
    "anthropic_api_key": api_key,
    "anthropic_api_url": base_url,  # オプション
}
```

### 対応モデル

```
claude-opus-4-20250514, claude-sonnet-4-20250514
claude-3-5-haiku-20241022, claude-3-opus-20240229
claude-3-7-sonnet-20250219, claude-3-haiku-20240307
```

---

## 3. Google Gemini

### 設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `google_api_key` | Google AI APIキー | 必須 |
| `google_base_url` | カスタムエンドポイントURL | デフォルトGoogle API |

### Credentials キー

```python
credentials = {
    "google_api_key": api_key,
    "google_base_url": base_url,  # オプション
}
```

### 対応モデル

```
gemini-2.5-flash, gemini-2.0-flash, gemini-2.0-flash-lite
gemini-1.5-pro, gemini-1.5-flash
```

### 注意事項

Dify内部でプロバイダIDの変換が行われる：
```python
# api/models/provider_ids.py より
if self.organization == "langgenius" and self.provider_name == "google":
    self.plugin_name = "gemini"
```

---

## 4. DeepSeek

### 設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `api_key` | DeepSeek APIキー | 必須 |
| `endpoint_url` | カスタムエンドポイントURL | `https://api.deepseek.com` |

### Credentials キー

```python
credentials = {
    "api_key": api_key,
    "endpoint_url": base_url,  # オプション
}
```

### 対応モデル

```
deepseek-chat, deepseek-reasoner
```

---

## 5. Qwen (通義千問 / Tongyi)

### 設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `dashscope_api_key` | Alibaba Cloud DashScope APIキー | 必須 |
| `use_international_endpoint` | 国際エンドポイント使用 | false |

### Credentials キー

```python
credentials = {
    "dashscope_api_key": api_key,
    "use_international_endpoint": False,  # 海外からのアクセス時はTrue
}
```

### 対応モデル

```
qwen-turbo, qwen-plus, qwen-max, qwen-long
```

---

## 6. OpenRouter

OpenRouterはOpenAI互換APIを提供しているため、OpenAI設定をベースに使用可能：

### 設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `openai_api_key` | OpenRouter APIキー | 必須 |
| `openai_api_base` | OpenRouterエンドポイント | `https://openrouter.ai/api/v1` |

```typescript
const openRouterConfig: ProviderConfig = {
  provider: 'openai_compatible',
  credentials: {
    api_key: 'your-openrouter-api-key',
    api_base: 'https://openrouter.ai/api/v1',
  }
};
```

---

## 7. Z.ai (ChatGLM/GLM)

### 設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `api_key` | Zhipu AI APIキー | 必須 |

### Credentials キー

```python
credentials = {
    "api_key": api_key,
}
```

---

## 8. xAI (Grok)

### 設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `xai_api_key` | xAI APIキー | 必須 |
| `xai_api_base` | カスタムエンドポイントURL | デフォルトxAI API |

### Credentials キー

```python
credentials = {
    "xai_api_key": api_key,
    "xai_api_base": base_url,  # オプション
}
```

### 対応モデル

```
grok-3, grok-3-mini, grok-3-mini-fast
```

---

## Azure OpenAI

### 設定項目

| 項目 | 説明 | デフォルト |
|------|------|-----------|
| `openai_api_key` | Azure OpenAI APIキー | 必須 |
| `openai_api_base` | Azureリソースエンドポイント | 必須 |
| `base_model_name` | ベースモデル名 | gpt-35-turbo |

### Credentials キー

```python
credentials = {
    "openai_api_key": api_key,
    "openai_api_base": endpoint,
    "base_model_name": "gpt-35-turbo",
}
```

---

## 推奨アーキテクチャ設計

### プロバイダ設定ファイル構造

```
providers/
├── base.ts                 # 共通インターフェース
├── openai.ts              # OpenAI設定
├── openai-compatible.ts   # OpenAI互換（Nebius, OpenRouter等）
├── anthropic.ts           # Anthropic設定
├── gemini.ts              # Google Gemini設定
├── deepseek.ts            # DeepSeek設定
├── tongyi.ts              # Qwen/Tongyi設定
├── zhipu.ts               # ChatGLM/GLM設定
├── xai.ts                 # xAI設定
└── index.ts               # エクスポート
```

### 共通基底クラス

```typescript
// providers/base.ts
export interface BaseProviderConfig {
  id: string;
  name: string;
  type: 'native' | 'openai_compatible';
  credentials: Record<string, any>;
  models: string[];
}

export interface ProviderCredentialSchema {
  api_key: {
    type: 'secret';
    required: true;
    label: string;
  };
  api_base?: {
    type: 'text';
    required: false;
    label: string;
    placeholder: string;
  };
  organization?: {
    type: 'text';
    required: false;
    label: string;
  };
}

export abstract class BaseProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly credentialSchema: ProviderCredentialSchema;
  
  abstract validateCredentials(credentials: Record<string, any>): boolean;
  abstract createClient(credentials: Record<string, any>): any;
}
```

### OpenAI互換プロバイダの簡略化

```typescript
// providers/openai-compatible.ts
import { BaseProvider, BaseProviderConfig } from './base';

export interface OpenAICompatibleConfig extends BaseProviderConfig {
  type: 'openai_compatible';
  baseUrl: string;
}

export const createOpenAICompatibleProvider = (config: {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
}): OpenAICompatibleConfig => ({
  id: config.id,
  name: config.name,
  type: 'openai_compatible',
  credentials: {},
  baseUrl: config.baseUrl,
  models: config.models,
});

// 使用例: Nebius
export const nebiusProvider = createOpenAICompatibleProvider({
  id: 'nebius',
  name: 'Nebius',
  baseUrl: 'https://api.nebius.ai/v1',
  models: ['llama-3-70b', 'mistral-large'],
});

// 使用例: OpenRouter
export const openRouterProvider = createOpenAICompatibleProvider({
  id: 'openrouter',
  name: 'OpenRouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  models: ['openai/gpt-4', 'anthropic/claude-3', 'meta-llama/llama-3'],
});
```

---

## 参考リンク

- [Dify Model Provider Service](https://github.com/langgenius/dify/blob/main/api/services/model_provider_service.py)
- [Dify Hosting Configuration](https://github.com/langgenius/dify/blob/main/api/core/hosting_configuration.py)
- [Dify Hosted Service Config](https://github.com/langgenius/dify/blob/main/api/configs/feature/hosted_service/__init__.py)
- [Dify Plugins Repository](https://github.com/langgenius/dify-plugins)
- [Dify Plugin Development Docs](https://docs.dify.ai/en/develop-plugin/dev-guides-and-walkthroughs/creating-new-model-provider)

---

## サポートプロバイダ一覧（Dify公式）

```typescript
// web/types/model-provider.ts より
export enum ModelProviderQuotaGetPaid {
  ANTHROPIC = 'langgenius/anthropic/anthropic',
  OPENAI = 'langgenius/openai/openai',
  GEMINI = 'langgenius/gemini/google',
  X = 'langgenius/x/x',
  DEEPSEEK = 'langgenius/deepseek/deepseek',
  TONGYI = 'langgenius/tongyi/tongyi',
}
```

その他のプロバイダ（Dify公式サポート）:
- Azure OpenAI
- Minimax
- Spark (iFlytek)
- ChatGLM (Zhipu AI)
- Baichuan
- Cohere
- Replicate
- Hugging Face