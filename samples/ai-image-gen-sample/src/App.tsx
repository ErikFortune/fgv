import { useMemo, useRef, useState } from 'react';

import { AiAssist } from '@fgv/ts-extras';
import { useAiAssist } from '@fgv/ts-app-shell';

import { SettingsPanel } from './components/SettingsPanel';
import { PromptPanel } from './components/PromptPanel';
import { ImageResults } from './components/ImageResults';
import { ChatPanel, type IChatTurn } from './components/ChatPanel';
import { InMemoryKeyStore } from './inMemoryKeyStore';

type Mode = 'image' | 'chat';

const ALL_DESCRIPTORS = AiAssist.getProviderDescriptors();

const PROVIDERS_BY_MODE: Record<Mode, ReadonlyArray<AiAssist.AiProviderId>> = {
  image: ALL_DESCRIPTORS.filter((d) => d.imageApiFormat !== undefined).map((d) => d.id),
  // Anything with a baseUrl can do chat — the registry's only no-baseUrl entry
  // is copy-paste, which we don't exercise from the streaming chat panel.
  chat: ALL_DESCRIPTORS.filter((d) => d.baseUrl.length > 0).map((d) => d.id)
};

const CAPABILITY_BY_MODE: Record<Mode, AiAssist.AiModelCapability> = {
  image: 'image-generation',
  chat: 'chat'
};

const SECRET_NAME_PREFIX = 'sample.';

function secretNameFor(provider: AiAssist.AiProviderId): string {
  return `${SECRET_NAME_PREFIX}${provider}`;
}

function defaultModelFor(provider: AiAssist.AiProviderId, mode: Mode): string {
  const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();
  if (!descriptor) {
    return '';
  }
  return AiAssist.resolveModel(descriptor.defaultModel, mode === 'image' ? 'image' : 'base');
}

interface IPerProviderMaps {
  readonly models: ReadonlyMap<AiAssist.AiProviderId, string>;
  readonly available: ReadonlyMap<AiAssist.AiProviderId, ReadonlyArray<AiAssist.IAiModelInfo>>;
  readonly listError: ReadonlyMap<AiAssist.AiProviderId, string>;
}

function emptyPerProvider(mode: Mode): IPerProviderMaps {
  return {
    models: new Map(PROVIDERS_BY_MODE[mode].map((p) => [p, defaultModelFor(p, mode)])),
    available: new Map(),
    listError: new Map()
  };
}

export function App(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('image');
  const [providersByMode, setProvidersByMode] = useState<Record<Mode, AiAssist.AiProviderId>>({
    image: PROVIDERS_BY_MODE.image[0],
    chat: PROVIDERS_BY_MODE.chat[0]
  });
  const [apiKeysByProvider, setApiKeysByProvider] = useState<ReadonlyMap<AiAssist.AiProviderId, string>>(
    new Map()
  );
  const [perMode, setPerMode] = useState<Record<Mode, IPerProviderMaps>>({
    image: emptyPerProvider('image'),
    chat: emptyPerProvider('chat')
  });
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Image-mode result + error
  const [lastImageResult, setLastImageResult] = useState<AiAssist.IAiImageGenerationResponse | undefined>(
    undefined
  );
  const [imageError, setImageError] = useState<string | undefined>(undefined);

  // Chat-mode conversation
  const [chatTurns, setChatTurns] = useState<ReadonlyArray<IChatTurn>>([]);
  const [chatError, setChatError] = useState<string | undefined>(undefined);
  const [activeToolEvents, setActiveToolEvents] = useState<ReadonlyArray<string>>([]);

  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const provider = providersByMode[mode];
  const capability = CAPABILITY_BY_MODE[mode];
  const providers = PROVIDERS_BY_MODE[mode];

  const keyStore = useMemo(() => {
    const secrets = new Map<string, string>();
    for (const [p, key] of apiKeysByProvider) {
      if (key.length > 0) {
        secrets.set(secretNameFor(p), key);
      }
    }
    return new InMemoryKeyStore(secrets);
  }, [apiKeysByProvider]);

  const settings = useMemo<AiAssist.IAiAssistSettings>(
    () => ({
      providers: providers.map((p) => {
        const model = perMode[mode].models.get(p);
        return {
          provider: p,
          secretName: secretNameFor(p),
          ...(model && model.length > 0 ? { model } : {})
        };
      }),
      defaultProvider: provider
    }),
    [providers, mode, perMode, provider]
  );

  const { isWorking, generateImages, listModels, streamDirect } = useAiAssist({ settings, keyStore });

  const setProvider = (next: AiAssist.AiProviderId): void => {
    setProvidersByMode((prev) => ({ ...prev, [mode]: next }));
  };

  const setApiKey = (next: string): void => {
    setApiKeysByProvider((prev) => {
      const updated = new Map(prev);
      updated.set(provider, next);
      return updated;
    });
  };

  const setModel = (next: string): void => {
    setPerMode((prev) => {
      const updated = new Map(prev[mode].models);
      updated.set(provider, next);
      return { ...prev, [mode]: { ...prev[mode], models: updated } };
    });
  };

  const handleFetchModels = async (): Promise<void> => {
    const targetProvider = provider;
    const targetMode = mode;
    setIsFetchingModels(true);
    const result = await listModels(targetProvider, capability);
    setIsFetchingModels(false);
    setPerMode((prev) => {
      const current = prev[targetMode];
      const available = new Map(current.available);
      const listError = new Map(current.listError);
      if (result.isFailure()) {
        available.set(targetProvider, []);
        listError.set(targetProvider, result.message);
      } else {
        available.set(targetProvider, result.value);
        listError.delete(targetProvider);
      }
      return { ...prev, [targetMode]: { ...current, available, listError } };
    });
  };

  const handleGenerateImages = async (params: AiAssist.IAiImageGenerationParams): Promise<void> => {
    setImageError(undefined);
    setLastImageResult(undefined);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const result = await generateImages(provider, params, controller.signal);
    abortControllerRef.current = undefined;
    if (result.isFailure()) {
      setImageError(result.message);
    } else {
      setLastImageResult(result.value);
    }
  };

  const handleSendChat = async (
    text: string,
    options: { readonly tools?: ReadonlyArray<AiAssist.AiServerToolConfig> }
  ): Promise<void> => {
    setChatError(undefined);
    setActiveToolEvents([]);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userTurn: IChatTurn = { role: 'user', content: text };
    const assistantTurn: IChatTurn = { role: 'assistant', content: '', isStreaming: true };
    setChatTurns((prev) => [...prev, userTurn, assistantTurn]);

    // System prompt is a generic helpful-assistant string; prior turns go into
    // messagesBefore so they're sent between system and the new user message.
    const messagesBefore: AiAssist.IChatMessage[] = chatTurns
      .filter((t) => t.role === 'user' || t.role === 'assistant')
      .map((t) => ({ role: t.role, content: t.content }));
    const prompt = new AiAssist.AiPrompt(text, 'You are a helpful assistant.');

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
            setActiveToolEvents((prev) => [...prev, `Searching the web…`]);
          } else if (event.phase === 'completed') {
            setActiveToolEvents((prev) => prev.slice(0, -1));
          }
        } else if (event.type === 'done') {
          // Replace accumulated text with the adapter's canonical fullText so
          // the transcript can't drift from what the model actually produced.
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

    // Finalize the assistant turn: clear its streaming flag, or drop it
    // entirely if nothing arrived (connect failed or aborted with no output).
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

  const currentKey = apiKeysByProvider.get(provider) ?? '';
  const currentModel = perMode[mode].models.get(provider) ?? '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-2xl font-semibold">AI Assist Sample</h1>
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-sm font-medium">
              {(['image', 'chat'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded px-3 py-1 transition-colors ${
                    mode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m === 'image' ? 'Image Generation' : 'Streaming Chat'}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Demonstrates the @fgv/ts-extras AI APIs via the @fgv/ts-app-shell useAiAssist hook. API keys live
            in memory for this session only.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <SettingsPanel
          mode={mode}
          providers={providers}
          provider={provider}
          onProviderChange={setProvider}
          apiKey={currentKey}
          onApiKeyChange={setApiKey}
          model={currentModel}
          modelPlaceholder={defaultModelFor(provider, mode)}
          onModelChange={setModel}
          availableModels={perMode[mode].available.get(provider) ?? []}
          isFetchingModels={isFetchingModels}
          modelListError={perMode[mode].listError.get(provider)}
          onFetchModels={() => {
            void handleFetchModels();
          }}
        />

        {mode === 'image' ? (
          <>
            <PromptPanel
              provider={provider}
              isWorking={isWorking}
              canSubmit={currentKey.length > 0}
              onGenerate={handleGenerateImages}
              onAbort={handleAbort}
            />
            {imageError !== undefined && (
              <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800">
                <strong className="font-semibold">Error:</strong> {imageError}
              </div>
            )}
            {lastImageResult !== undefined && <ImageResults response={lastImageResult} />}
          </>
        ) : (
          <ChatPanel
            provider={provider}
            isWorking={isWorking}
            canSubmit={currentKey.length > 0}
            turns={chatTurns}
            error={chatError}
            activeToolEvents={activeToolEvents}
            onSend={handleSendChat}
            onAbort={handleAbort}
            onClear={handleClearChat}
          />
        )}
      </main>
    </div>
  );
}
