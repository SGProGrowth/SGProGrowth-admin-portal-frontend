import { getAllEntities } from '../db.js';
import { ASSISTANT_TOOLS, executeTool, type ToolAction } from './assistant-tools.js';
import { localAssistantAnswer } from './assistant-local.js';
import {
  getLlmSettingsPublic,
  saveLlmSettings,
  testLlmConnection,
  type LlmSettingsPublic,
} from './llm-config.js';
import {
  chatCompletion,
  isLlmConfigured,
  type ChatMessage,
} from './llm.js';

export interface AssistantChatInput {
  messages: { role: 'user' | 'assistant'; content: string }[];
  userName?: string;
  userRole?: string;
}

export interface AssistantChatResult {
  reply: string;
  mode: 'llm' | 'local';
  actions: ToolAction[];
}

const MAX_TOOL_ROUNDS = 6;

function buildSystemPrompt(userName?: string, userRole?: string) {
  return [
    'You are SG Growth Copilot — a smart, versatile AI assistant for the SG Pro Growth admin portal.',
    'You are knowledgeable about education, business, technology, current events, science, and general topics.',
    'Answer naturally and helpfully. Use bullet points for lists. Keep answers concise but complete.',
    '',
    'PORTAL TOOLS: You have tools to read and modify portal data — courses, quizzes, questions, assignments, students, instructors, groups, discussions, certificates, events, activities, and messages.',
    'When the user asks you to create, update, or delete portal records, use the appropriate tool then confirm what you did.',
    'Only delete records when the user clearly asks. For updates, fetch or infer the record id first.',
    'If portal data is missing, say so honestly. Do not invent enrolment numbers — use tools.',
    '',
    'GENERAL KNOWLEDGE: You can freely answer questions about ANY topic — business strategy, marketing, HR, finance, technology, industry trends, coding, or any other subject.',
    'For real-world facts and events, answer from your training knowledge. Note that your training has a knowledge cutoff, so for very recent events (after early 2024) you may not have the latest information.',
    'If you are unsure about something, say so honestly and suggest where the user can verify.',
    '',
    `Today: ${new Date().toISOString().slice(0, 10)}.`,
    userName ? `Logged-in admin: ${userName}${userRole ? ` (${userRole})` : ''}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function runAgent(
  history: { role: 'user' | 'assistant'; content: string }[],
  userName?: string,
  userRole?: string,
): Promise<AssistantChatResult> {
  const actions: ToolAction[] = [];
  const llmMessages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(userName, userRole) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await chatCompletion(llmMessages, ASSISTANT_TOOLS);
    const choice = response.choices[0];
    if (!choice) throw new Error('Empty LLM response');

    const msg = choice.message;
    const toolCalls = msg.tool_calls ?? [];

    if (toolCalls.length === 0) {
      return {
        reply: msg.content?.trim() || 'I could not generate a response. Please try again.',
        mode: 'llm',
        actions,
      };
    }

    llmMessages.push({
      role: 'assistant',
      content: msg.content,
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      const result = await executeTool(call.function.name, call.function.arguments);
      actions.push(result);
      llmMessages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result.ok ? result.result : { error: result.error }),
      });
    }
  }

  return {
    reply: 'I ran into too many steps — please try a simpler request.',
    mode: 'llm',
    actions,
  };
}

export async function runAssistantChat(input: AssistantChatInput): Promise<AssistantChatResult> {
  const history = input.messages.filter((m) => m.content.trim());

  if (!isLlmConfigured()) {
    const lastUser = [...history].reverse().find((m) => m.role === 'user');
    const entities = await getAllEntities();
    return {
      reply: localAssistantAnswer(lastUser?.content ?? '', entities),
      mode: 'local',
      actions: [],
    };
  }

  try {
    return await runAgent(history, input.userName, input.userRole);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LLM error';
    const lastUser = [...history].reverse().find((m) => m.role === 'user');
    const entities = await getAllEntities();
    const fallback = localAssistantAnswer(lastUser?.content ?? '', entities);
    return {
      reply: `${fallback}\n\n_(LLM unavailable: ${message})_`,
      mode: 'local',
      actions: [],
    };
  }
}

export function getAssistantStatus() {
  const settings = getLlmSettingsPublic();
  return {
    llm: isLlmConfigured(),
    provider: settings.provider,
    model: settings.model,
    baseUrl: settings.baseUrl,
    apiKeySet: settings.apiKeySet,
  };
}

export function getAssistantConfig(): LlmSettingsPublic {
  return getLlmSettingsPublic();
}

export function saveAssistantConfig(input: {
  provider?: LlmSettingsPublic['provider'];
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}) {
  return saveLlmSettings(input);
}

export { testLlmConnection };
