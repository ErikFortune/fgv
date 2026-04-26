import { useEffect, useRef, useState } from 'react';

import { AiAssist } from '@fgv/ts-extras';

export interface IChatTurn {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly isStreaming?: boolean;
}

export interface IChatPanelProps {
  readonly provider: AiAssist.AiProviderId;
  readonly isWorking: boolean;
  readonly canSubmit: boolean;
  readonly turns: ReadonlyArray<IChatTurn>;
  readonly error: string | undefined;
  readonly activeToolEvents: ReadonlyArray<string>;
  readonly onSend: (
    text: string,
    options: { readonly tools?: ReadonlyArray<AiAssist.AiServerToolConfig> }
  ) => Promise<void>;
  readonly onAbort: () => void;
  readonly onClear: () => void;
}

export function ChatPanel(props: IChatPanelProps): React.JSX.Element {
  const { provider, isWorking, canSubmit, turns, error, activeToolEvents, onSend, onAbort, onClear } = props;

  const [input, setInput] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();
  const supportsWebSearch = descriptor?.supportedTools.includes('web_search') ?? false;

  // Auto-scroll the transcript as new content arrives.
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [turns, activeToolEvents]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!canSubmit || isWorking || input.trim().length === 0) {
      return;
    }
    const tools: ReadonlyArray<AiAssist.AiServerToolConfig> | undefined =
      useWebSearch && supportsWebSearch ? [{ type: 'web_search' }] : undefined;
    const text = input;
    setInput('');
    void onSend(text, { tools });
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Streaming chat</h2>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            disabled={isWorking}
            className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-40"
          >
            Clear conversation
          </button>
        )}
      </div>

      <div
        ref={transcriptRef}
        className="mt-4 max-h-96 min-h-48 space-y-3 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
      >
        {turns.length === 0 ? (
          <p className="text-slate-500">
            Type a question below to start a conversation. Tokens stream in as the model generates them.
          </p>
        ) : (
          turns.map((turn, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {turn.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="whitespace-pre-wrap text-slate-800">
                {turn.content}
                {turn.isStreaming && turn.content.length === 0 && <span className="text-slate-400">…</span>}
                {turn.isStreaming && turn.content.length > 0 && (
                  <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-indigo-400 align-middle" />
                )}
              </div>
            </div>
          ))
        )}

        {activeToolEvents.length > 0 && (
          <div className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
            {activeToolEvents.map((label, idx) => (
              <div key={idx}>{label}</div>
            ))}
          </div>
        )}
      </div>

      {error !== undefined && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Message</span>
          <textarea
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isWorking}
            placeholder="Ask about a recipe, ingredients, or anything else…"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isWorking || input.trim().length === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isWorking ? 'Streaming…' : 'Send'}
          </button>

          {isWorking && (
            <button
              type="button"
              onClick={onAbort}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
          )}

          {supportsWebSearch && (
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={useWebSearch}
                onChange={(e) => setUseWebSearch(e.target.checked)}
                disabled={isWorking}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Use web search</span>
            </label>
          )}

          {!canSubmit && <span className="text-sm text-slate-500">Enter an API key to enable chat.</span>}
        </div>
      </form>
    </section>
  );
}
