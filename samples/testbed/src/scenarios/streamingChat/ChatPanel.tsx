/**
 * Streaming-chat transcript + composer for the `streaming-chat` scenario. Ported from
 * `samples/ai-image-gen-sample/src/components/ChatPanel.tsx` with testbed styling
 * tokens, `streaming-chat-*` test ids, and a `disabledReason` that distinguishes
 * "missing key" from "prompt library not ready" (the shell secrets store replaces the
 * sample's per-scenario API-key input).
 *
 * @packageDocumentation
 */

import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { AiAssist } from '@fgv/ts-extras';

import { chatTones, chatToneConverter } from './promptLibrary';
import type { ChatTone } from './promptLibrary';

function formatToneLabel(tone: ChatTone): string {
  return tone.charAt(0).toUpperCase() + tone.slice(1);
}

export interface IChatTurn {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly isStreaming?: boolean;
}

export interface IChatPanelProps {
  readonly provider: AiAssist.AiProviderId;
  readonly isWorking: boolean;
  readonly canSubmit: boolean;
  /**
   * Reason shown when `canSubmit` is false — lets the parent differentiate "no API key"
   * from "prompt library not ready" (or any other gating condition the parent owns).
   */
  readonly disabledReason: string;
  readonly turns: ReadonlyArray<IChatTurn>;
  readonly error: string | undefined;
  readonly activeToolEvents: ReadonlyArray<string>;
  readonly tone: ChatTone;
  readonly onToneChange: (tone: ChatTone) => void;
  readonly onSend: (
    text: string,
    options: { readonly tools?: ReadonlyArray<AiAssist.AiServerToolConfig> }
  ) => Promise<void>;
  readonly onAbort: () => void;
  readonly onClear: () => void;
}

export function ChatPanel(props: IChatPanelProps): React.ReactElement {
  const {
    provider,
    isWorking,
    canSubmit,
    disabledReason,
    turns,
    error,
    activeToolEvents,
    tone,
    onToneChange,
    onSend,
    onAbort,
    onClear
  } = props;

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

  const submitMessage = (): void => {
    if (!canSubmit || isWorking || input.trim().length === 0) {
      return;
    }
    const tools: ReadonlyArray<AiAssist.AiServerToolConfig> | undefined =
      useWebSearch && supportsWebSearch ? [{ type: 'web_search' }] : undefined;
    const text = input;
    setInput('');
    onSend(text, { tools }).catch(() => undefined);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    submitMessage();
  };

  return (
    <section
      data-testid="streaming-chat-panel"
      className="rounded-lg border border-border bg-surface-raised p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Streaming chat</h3>
        {turns.length > 0 && (
          <button
            type="button"
            data-testid="streaming-chat-clear-btn"
            onClick={onClear}
            disabled={isWorking}
            className="text-xs text-muted hover:text-secondary disabled:opacity-40"
          >
            Clear conversation
          </button>
        )}
      </div>

      <div
        ref={transcriptRef}
        data-testid="streaming-chat-transcript"
        className="mt-3 max-h-96 min-h-48 space-y-3 overflow-y-auto rounded-md border border-border bg-surface p-3 text-sm"
      >
        {turns.length === 0 ? (
          <p className="text-muted">
            Type a question below to start a conversation. Tokens stream in as the model generates them.
          </p>
        ) : (
          turns.map((turn, idx) => (
            <div key={idx} data-testid={`streaming-chat-turn-${idx}`} className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                {turn.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="whitespace-pre-wrap text-primary">
                {turn.content}
                {turn.isStreaming && turn.content.length === 0 && <span className="text-muted">…</span>}
                {turn.isStreaming && turn.content.length > 0 && (
                  <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-brand-primary align-middle" />
                )}
              </div>
            </div>
          ))
        )}

        {activeToolEvents.length > 0 && (
          <div
            data-testid="streaming-chat-tool-events"
            className="rounded border border-border bg-surface-alt px-2 py-1 text-xs text-secondary"
          >
            {activeToolEvents.map((label, idx) => (
              <div key={idx}>{label}</div>
            ))}
          </div>
        )}
      </div>

      {error !== undefined && (
        <div
          data-testid="streaming-chat-error"
          className="mt-3 rounded-md border border-status-error-border bg-status-error-bg p-3 text-sm text-status-error-text"
        >
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="font-medium text-secondary">Message</span>
          <textarea
            data-testid="streaming-chat-input"
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitMessage();
              }
            }}
            disabled={isWorking}
            placeholder="Ask about a recipe, ingredients, or anything else…"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            data-testid="streaming-chat-send-btn"
            disabled={!canSubmit || isWorking || input.trim().length === 0}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isWorking ? 'Streaming…' : 'Send'}
          </button>

          {isWorking && (
            <button
              type="button"
              data-testid="streaming-chat-abort-btn"
              onClick={onAbort}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-secondary hover:bg-hover"
            >
              Cancel
            </button>
          )}

          {supportsWebSearch && (
            <label className="inline-flex items-center gap-2 text-sm text-secondary">
              <input
                type="checkbox"
                data-testid="streaming-chat-web-search-checkbox"
                checked={useWebSearch}
                onChange={(e) => setUseWebSearch(e.target.checked)}
                disabled={isWorking}
                className="h-4 w-4 rounded border-border text-brand-primary focus:ring-focus-ring"
              />
              <span>Use web search</span>
            </label>
          )}

          <label className="inline-flex items-center gap-2 text-sm text-secondary">
            <span>Tone</span>
            <select
              data-testid="streaming-chat-tone-select"
              value={tone}
              // Narrow `e.target.value: string` back into `ChatTone` via the exported
              // Converter; falls back to the current tone if the DOM string isn't a
              // recognised option (defensive — the `<option>` set is rendered from the
              // same `chatTones` array, so a mismatch is unreachable in normal flow).
              onChange={(e) => onToneChange(chatToneConverter.convert(e.target.value).orDefault(tone))}
              disabled={isWorking}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              {chatTones.map((t) => (
                <option key={t} value={t}>
                  {formatToneLabel(t)}
                </option>
              ))}
            </select>
          </label>

          {!canSubmit && (
            <span data-testid="streaming-chat-disabled-hint" className="text-sm text-muted">
              {disabledReason}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
