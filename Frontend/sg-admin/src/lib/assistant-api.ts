import { apiFetch, isApiEnabled } from './api';

export interface AssistantStatus {
  llm: boolean;
  provider: string | null;
  model: string | null;
  baseUrl?: string;
  apiKeySet?: boolean;
}

export interface LlmConfig {
  provider: 'openai' | 'groq' | 'ollama' | 'custom';
  baseUrl: string;
  model: string;
  apiKeySet: boolean;
  apiKeyHint: string | null;
}

export interface AssistantChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolAction {
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export interface AssistantChatResult {
  reply: string;
  mode: 'llm' | 'local';
  actions: ToolAction[];
}

export async function fetchAssistantStatus(): Promise<AssistantStatus | null> {
  if (!isApiEnabled()) return null;
  try {
    return await apiFetch<AssistantStatus>('/assistant/status');
  } catch {
    return null;
  }
}

export async function getLlmConfig(): Promise<LlmConfig> {
  return apiFetch<LlmConfig>('/assistant/config');
}

export async function saveLlmConfig(input: {
  provider?: LlmConfig['provider'];
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<LlmConfig> {
  return apiFetch<LlmConfig>('/assistant/config', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function testLlmConnection(): Promise<{ ok: boolean; message: string }> {
  return apiFetch<{ ok: boolean; message: string }>('/assistant/test', { method: 'POST' });
}

export async function chatWithAssistant(
  messages: AssistantChatMessage[],
): Promise<AssistantChatResult> {
  return apiFetch<AssistantChatResult>('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}
