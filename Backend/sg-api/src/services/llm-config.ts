import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '..', '..', 'data', 'llm-config.json');

export type LlmProvider = 'openai' | 'groq' | 'ollama' | 'custom';

export interface LlmSettings {
  provider: LlmProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface LlmSettingsPublic {
  provider: LlmProvider;
  baseUrl: string;
  model: string;
  apiKeySet: boolean;
  apiKeyHint: string | null;
}

const PROVIDER_DEFAULTS: Record<LlmProvider, { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  ollama: { baseUrl: 'http://localhost:11434/v1', model: 'llama3.2' },
  custom: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
};

interface StoredConfig {
  provider?: LlmProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

function readStored(): StoredConfig | null {
  try {
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as StoredConfig;
  } catch {
    return null;
  }
}

function writeStored(data: StoredConfig) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

export function getLlmSettings(): LlmSettings {
  const stored = readStored();
  const provider = stored?.provider ?? inferProviderFromEnv();
  const defaults = PROVIDER_DEFAULTS[provider];

  const apiKey =
    stored?.apiKey?.trim() ||
    (provider === 'ollama' ? 'ollama' : config.llmApiKey.trim());

  return {
    provider,
    apiKey,
    baseUrl: stored?.baseUrl?.trim() || config.llmBaseUrl || defaults.baseUrl,
    model: stored?.model?.trim() || config.llmModel || defaults.model,
  };
}

function inferProviderFromEnv(): LlmProvider {
  const url = config.llmBaseUrl;
  if (url.includes('groq.com')) return 'groq';
  if (url.includes('11434')) return 'ollama';
  return 'openai';
}

export function isLlmConfigured(): boolean {
  const s = getLlmSettings();
  if (s.provider === 'ollama') return true;
  return Boolean(s.apiKey);
}

export function getLlmSettingsPublic(): LlmSettingsPublic {
  const s = getLlmSettings();
  const key = s.apiKey && s.apiKey !== 'ollama' ? s.apiKey : '';
  return {
    provider: s.provider,
    baseUrl: s.baseUrl,
    model: s.model,
    apiKeySet: Boolean(key),
    apiKeyHint: key.length > 4 ? `••••${key.slice(-4)}` : null,
  };
}

export function saveLlmSettings(input: Partial<LlmSettings>): LlmSettingsPublic {
  const current = getLlmSettings();
  const provider = input.provider ?? current.provider;
  const defaults = PROVIDER_DEFAULTS[provider];

  let apiKey = current.apiKey;
  if (input.apiKey !== undefined && input.apiKey.trim()) {
    apiKey = input.apiKey.trim();
  } else if (provider === 'ollama') {
    apiKey = 'ollama';
  }

  const stored: StoredConfig = {
    provider,
    apiKey: apiKey && apiKey !== 'ollama' ? apiKey : provider === 'ollama' ? '' : apiKey,
    baseUrl: input.baseUrl?.trim() || defaults.baseUrl,
    model: input.model?.trim() || defaults.model,
  };

  if (provider === 'ollama') {
    stored.apiKey = stored.apiKey || '';
  }

  writeStored(stored);
  return getLlmSettingsPublic();
}

export async function testLlmConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isLlmConfigured()) {
    return { ok: false, message: 'No API key configured. Add one in Settings → AI Assistant.' };
  }

  const s = getLlmSettings();
  try {
    const res = await fetch(`${s.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${s.apiKey || 'ollama'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: s.model,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `LLM error (${res.status}): ${text.slice(0, 200)}` };
    }

    return { ok: true, message: `Connected to ${s.provider} (${s.model})` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (s.provider === 'ollama') {
      return {
        ok: false,
        message: `Cannot reach Ollama at ${s.baseUrl}. Install from ollama.com and run: ollama pull ${s.model}`,
      };
    }
    return { ok: false, message: msg };
  }
}
