import {
  getLlmSettings,
  isLlmConfigured as isLlmConfiguredFromConfig,
  type LlmSettings,
} from './llm-config.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResponse {
  choices: {
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }[];
}

export function isLlmConfigured() {
  return isLlmConfiguredFromConfig();
}

export function getActiveLlmSettings(): LlmSettings {
  return getLlmSettings();
}

export async function chatCompletion(
  messages: ChatMessage[],
  tools?: ToolDefinition[],
): Promise<ChatCompletionResponse> {
  const settings = getLlmSettings();
  if (!isLlmConfigured()) {
    throw new Error('LLM is not configured');
  }

  const body: Record<string, unknown> = {
    model: settings.model,
    messages,
    temperature: 0.4,
  };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const res = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey || 'ollama'}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  return (await res.json()) as ChatCompletionResponse;
}
