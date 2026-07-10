import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { answer, SUGGESTIONS } from '../lib/assistant';
import {
  chatWithAssistant,
  fetchAssistantStatus,
  type AssistantChatMessage,
} from '../lib/assistant-api';
import { isApiEnabled } from '../lib/api';
import { getUser, hasValidToken } from '../lib/auth';
import { Icon } from '../lib/icons';
import { useStore } from '../store';

interface ChatMsg {
  id: number;
  role: 'user' | 'bot';
  text: string;
}

export function AiAssistant() {
  const store = useStore();
  const user = getUser();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 0,
      role: 'bot',
      text: `Hi ${user?.name?.split(' ')[0] ?? 'Admin'}! 👋 I'm your AI course assistant. Ask me about revenue, students, course performance, at-risk learners and more.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [llmEnabled, setLlmEnabled] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (!isApiEnabled() || !hasValidToken()) {
      setLlmEnabled(false);
      return;
    }
    void fetchAssistantStatus().then((s) => setLlmEnabled(s?.llm ?? false));
  }, []);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;

    const userMsg: ChatMsg = { id: Date.now(), role: 'user', text: clean };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    try {
      if (isApiEnabled() && hasValidToken()) {
        const history: AssistantChatMessage[] = [...messages, userMsg]
          .filter((m) => m.id !== 0)
          .map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text,
          }));

        const result = await chatWithAssistant(history);
        setLlmEnabled(result.mode === 'llm');

        if (result.actions.some((a) => a.ok)) {
          await store.refresh();
        }

        setMessages((m) => [
          ...m,
          { id: Date.now() + 1, role: 'bot', text: result.reply },
        ]);
      } else {
        await new Promise((r) => setTimeout(r, 400));
        const reply = answer(clean, store.list);
        setMessages((m) => [...m, { id: Date.now() + 1, role: 'bot', text: reply }]);
      }
    } catch {
      const reply = answer(clean, store.list);
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: `${reply}\n\n_(Could not reach the assistant API — showing offline answer.)_`,
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const modeLabel =
    llmEnabled === null
      ? 'Checking…'
      : llmEnabled
        ? 'LLM · open-ended answers & actions'
        : 'Keyword mode · add LLM_API_KEY on server';

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        subtitle="Ask natural-language questions about your academy — answered from live data"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-brand-600 px-5 py-3.5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Icon name="bot" size={20} />
            </span>
            <div>
              <div className="text-sm font-bold">SG Growth Copilot</div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${llmEnabled ? 'bg-emerald-300' : 'bg-amber-300'}`}
                />
                {modeLabel}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                      m.role === 'user' ? 'bg-slate-400' : 'bg-brand-600'
                    }`}
                  >
                    <Icon name={m.role === 'user' ? 'user' : 'bot'} size={15} />
                  </span>
                  <div
                    className={`max-w-[78%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === 'user'
                        ? 'rounded-br-sm bg-brand-600 text-white'
                        : 'rounded-bl-sm bg-slate-100 text-slate-700'
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Icon name="bot" size={15} />
                </span>
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-slate-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                llmEnabled
                  ? 'Ask anything — e.g. “Mark message 1 as read” or “Add a student named…”'
                  : 'Ask about revenue, students, courses…'
              }
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:brightness-105 disabled:opacity-50"
            >
              <Icon name="send" size={16} />
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Icon name="sparkle" size={16} className="text-amber-500" /> Try asking
            </h3>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  disabled={typing}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                >
                  <Icon name="message" size={13} className="shrink-0 text-brand-400" />
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-brand-800">
            <Icon name="brain" size={20} className="text-brand-600" />
            <p className="mt-2 text-xs leading-relaxed text-brand-800/80">
              {llmEnabled
                ? 'Full LLM mode is active. I can answer open-ended questions and create, update, or delete records when you ask.'
                : 'Go to Settings → AI Assistant to add your OpenAI/Groq API key, or use free local Ollama.'}
            </p>
            {!llmEnabled && (
              <Link
                to="/settings"
                onClick={() => sessionStorage.setItem('sg_settings_tab', 'ai')}
                className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline"
              >
                Open AI settings →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
