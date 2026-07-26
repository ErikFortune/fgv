/**
 * `streaming-chat` scenario — a web port of `samples/ai-image-gen-sample`'s chat mode,
 * including the `ts-prompt-assist` tone demo (`promptLibrary.ts`). Provider + model
 * picker, a streaming transcript, and a tone selector that re-resolves the system prompt
 * via `PromptLibrary.resolve` before each send.
 *
 * As with `../imageGeneration`, the sample's per-scenario API-key `<input>` is replaced
 * by the shell's session secrets store (`useProviderApiKey`); `samples/ai-image-gen-sample`
 * itself is untouched.
 *
 * Web-only: a live API key cannot be embedded in the CLI's non-interactive run, and the
 * sample this ports has no CLI surface either.
 *
 * @packageDocumentation
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AiAssist } from '@fgv/ts-extras';
import { useAiAssist } from '@fgv/ts-app-shell';

import type { IScenario, IScenarioContext, IWebScenarioImpl } from '../../shell';
import {
  PROVIDER_SECRET_SPECS,
  requiredSecretsForProviders,
  SingleSecretKeyStore,
  useProviderApiKey
} from '../aiProviderSecrets';
import { ChatSettingsPanel } from './SettingsPanel';
import { ChatPanel, type IChatTurn } from './ChatPanel';
import { createPromptLibrary, resolveChatSystemPrompt } from './promptLibrary';
import type { ChatPromptLibrary, ChatTone } from './promptLibrary';

// ---------------------------------------------------------------------------
// Provider list + defaults
// ---------------------------------------------------------------------------

/** Providers this scenario wires a secret for AND that expose a chat `baseUrl`. */
const CHAT_PROVIDERS: ReadonlyArray<AiAssist.AiProviderId> = AiAssist.getProviderDescriptors()
  .filter((d) => d.baseUrl.length > 0 && PROVIDER_SECRET_SPECS[d.id] !== undefined)
  .map((d) => d.id);

/** Resolves the `base`-tier default model id for a provider (empty string if unknown). */
function defaultModelFor(provider: AiAssist.AiProviderId): string {
  const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();
  if (!descriptor) {
    return '';
  }
  return AiAssist.resolveModel(descriptor.defaultModel, 'base');
}

function initialModelsByProvider(): ReadonlyMap<AiAssist.AiProviderId, string> {
  return new Map(CHAT_PROVIDERS.map((p) => [p, defaultModelFor(p)]));
}

// ---------------------------------------------------------------------------
// Web component
// ---------------------------------------------------------------------------

function StreamingChatComponent({ context }: { readonly context: IScenarioContext }): React.ReactElement {
  const [provider, setProvider] = useState<AiAssist.AiProviderId>(
    CHAT_PROVIDERS[0] ?? ('openai' as AiAssist.AiProviderId)
  );
  const [modelsByProvider, setModelsByProvider] =
    useState<ReadonlyMap<AiAssist.AiProviderId, string>>(initialModelsByProvider);
  const [chatTurns, setChatTurns] = useState<ReadonlyArray<IChatTurn>>([]);
  const [chatError, setChatError] = useState<string | undefined>(undefined);
  const [activeToolEvents, setActiveToolEvents] = useState<ReadonlyArray<string>>([]);
  const [chatTone, setChatTone] = useState<ChatTone>('neutral');
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const { apiKey, status: apiKeyStatus, error: apiKeyError } = useProviderApiKey(context, provider);

  // Prompt library is built once on mount via the canonical useEffect-initialiser
  // pattern from the ts-prompt-assist README.
  const [promptLibrary, setPromptLibrary] = useState<ChatPromptLibrary | null>(null);
  const [promptLibraryError, setPromptLibraryError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await createPromptLibrary();
      if (cancelled) return;
      if (result.isFailure()) {
        setPromptLibraryError(result.message);
      } else {
        setPromptLibrary(result.value);
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const currentModel = modelsByProvider.get(provider) ?? defaultModelFor(provider);

  const keyStore = useMemo(
    () =>
      new SingleSecretKeyStore(apiKeyStatus === 'ready' ? new Map([[provider, apiKey]]) : new Map()),
    [provider, apiKeyStatus, apiKey]
  );

  const settings = useMemo<AiAssist.IAiAssistSettings>(
    () => ({
      providers: [
        {
          provider,
          secretName: provider,
          ...(currentModel.length > 0 ? { model: currentModel } : {})
        }
      ],
      defaultProvider: provider
    }),
    [provider, currentModel]
  );

  const { isWorking, streamDirect } = useAiAssist({ settings, keyStore, logger: context.logger });

  const canSubmit = apiKeyStatus === 'ready' && promptLibrary !== null;
  // Order matches the user's mental model: the API-key gate is the first thing they
  // configure, so name that one first; once it's set, surface the prompt-library state.
  const disabledReason: string =
    apiKeyStatus !== 'ready'
      ? 'Configure an API key (Secrets, top bar) to enable chat.'
      : promptLibraryError !== undefined
        ? `Prompt library failed to load: ${promptLibraryError}`
        : promptLibrary === null
          ? 'Prompt library is still initializing…'
          : '';

  const handleSendChat = async (
    text: string,
    options: { readonly tools?: ReadonlyArray<AiAssist.AiServerToolConfig> }
  ): Promise<void> => {
    setChatError(undefined);
    setActiveToolEvents([]);

    const userTurn: IChatTurn = { role: 'user', content: text };
    const assistantTurn: IChatTurn = { role: 'assistant', content: '', isStreaming: true };
    setChatTurns((prev) => [...prev, userTurn, assistantTurn]);

    if (promptLibrary === null) {
      setChatError(promptLibraryError ?? 'Prompt library is still initializing.');
      setChatTurns((prev) => prev.slice(0, -2));
      return;
    }
    const systemPromptResult = await resolveChatSystemPrompt(promptLibrary, chatTone);
    if (systemPromptResult.isFailure()) {
      setChatError(systemPromptResult.message);
      setChatTurns((prev) => prev.slice(0, -2));
      return;
    }

    // Create the AbortController only once we're committed to the network call —
    // early-return paths above would otherwise leave a stale controller in the ref.
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Prior turns go into messagesBefore so they're sent between the resolved system
    // prompt and the new user message.
    const messagesBefore: AiAssist.IChatMessage[] = chatTurns
      .filter((t) => t.role === 'user' || t.role === 'assistant')
      .map((t) => ({ role: t.role, content: t.content }));
    const prompt = new AiAssist.AiPrompt(text, systemPromptResult.value);

    let receivedAnyContent = false;
    let inlineError: string | undefined;

    const result = await streamDirect(
      provider,
      prompt,
      (event) => {
        if (event.type === 'text-delta') {
          receivedAnyContent = true;
          setChatTurns((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: last.content + event.delta };
            }
            return next;
          });
        } else if (event.type === 'tool-event') {
          if (event.phase === 'started') {
            setActiveToolEvents((prev) => [...prev, 'Searching the web…']);
          } else if (event.phase === 'completed') {
            setActiveToolEvents((prev) => prev.slice(0, -1));
          }
        } else if (event.type === 'done') {
          // Replace accumulated text with the adapter's canonical fullText so the
          // transcript can't drift from what the model actually produced.
          receivedAnyContent = event.fullText.length > 0;
          setChatTurns((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: event.fullText };
            }
            return next;
          });
        } else if (event.type === 'error') {
          inlineError = event.message;
        }
      },
      { tools: options.tools, messagesBefore, signal: controller.signal }
    );
    abortControllerRef.current = undefined;
    setActiveToolEvents([]);

    // Finalize the assistant turn: clear its streaming flag, or drop it entirely if
    // nothing arrived (connect failed or aborted with no output).
    setChatTurns((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (!last || last.role !== 'assistant') {
        return next;
      }
      if (!receivedAnyContent && last.content.length === 0) {
        next.pop();
        return next;
      }
      next[next.length - 1] = { ...last, isStreaming: false };
      return next;
    });

    if (inlineError !== undefined) {
      setChatError(inlineError);
    } else if (result.isFailure()) {
      setChatError(result.message);
    }
  };

  const handleClearChat = (): void => {
    setChatTurns([]);
    setChatError(undefined);
    setActiveToolEvents([]);
  };

  const handleAbort = (): void => {
    abortControllerRef.current?.abort();
  };

  return (
    <div data-testid="streaming-chat-scenario" className="space-y-4">
      <ChatSettingsPanel
        providers={CHAT_PROVIDERS}
        provider={provider}
        onProviderChange={setProvider}
        apiKeyStatus={apiKeyStatus}
        apiKeyError={apiKeyError}
        model={currentModel}
        modelPlaceholder={defaultModelFor(provider)}
        onModelChange={(next) => setModelsByProvider((prev) => new Map(prev).set(provider, next))}
      />
      <ChatPanel
        provider={provider}
        isWorking={isWorking}
        canSubmit={canSubmit}
        disabledReason={disabledReason}
        turns={chatTurns}
        error={chatError ?? promptLibraryError}
        activeToolEvents={activeToolEvents}
        tone={chatTone}
        onToneChange={setChatTone}
        onSend={handleSendChat}
        onAbort={handleAbort}
        onClear={handleClearChat}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario export
// ---------------------------------------------------------------------------

const webImpl: IWebScenarioImpl = {
  component: StreamingChatComponent
};

/**
 * `streaming-chat` scenario: a web port of `samples/ai-image-gen-sample`'s chat mode,
 * including the `ts-prompt-assist` tone demo.
 * @public
 */
export const streamingChatScenario: IScenario = {
  id: 'streaming-chat',
  title: 'Streaming Chat',
  description:
    'Ported from samples/ai-image-gen-sample: streaming chat via AiAssist.callProviderCompletionStream, ' +
    'with a ts-prompt-assist PromptLibrary resolving the system prompt under a neutral/formal tone ' +
    'qualifier before each send. API keys come from the shell Secrets panel (top bar).',
  category: 'prompts',
  tags: ['ai-assist', 'streaming', 'ts-prompt-assist', 'live-api'],
  requiredSecrets: requiredSecretsForProviders(CHAT_PROVIDERS),
  web: webImpl
};

export { CHAT_PROVIDERS, defaultModelFor };
