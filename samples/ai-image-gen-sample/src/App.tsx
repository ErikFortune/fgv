import { useMemo, useRef, useState } from 'react';

import { AiAssist } from '@fgv/ts-extras';

import { SettingsPanel } from './components/SettingsPanel';
import { PromptPanel } from './components/PromptPanel';
import { ImageResults } from './components/ImageResults';
import { InMemoryKeyStore } from './inMemoryKeyStore';
import { useAiAssist } from '@fgv/ts-app-shell';

/**
 * Providers that support image generation. Filtered from the full registry
 * by `imageApiFormat` presence.
 */
const IMAGE_PROVIDERS: ReadonlyArray<AiAssist.AiProviderId> = AiAssist.getProviderDescriptors()
  .filter((d) => d.imageApiFormat !== undefined)
  .map((d) => d.id);

const SECRET_NAME_PREFIX = 'sample.';

function secretNameFor(provider: AiAssist.AiProviderId): string {
  return `${SECRET_NAME_PREFIX}${provider}`;
}

/**
 * Initial model overrides per provider — derived from the descriptor's
 * default. Users can edit these in the UI to work around model-name churn
 * (e.g. when a provider rotates Imagen versions).
 */
function defaultModelFor(provider: AiAssist.AiProviderId): string {
  const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();
  return descriptor ? AiAssist.resolveModel(descriptor.defaultModel, 'image') : '';
}

export function App(): React.JSX.Element {
  const [provider, setProvider] = useState<AiAssist.AiProviderId>(IMAGE_PROVIDERS[0]);
  const [apiKeysByProvider, setApiKeysByProvider] = useState<ReadonlyMap<AiAssist.AiProviderId, string>>(
    new Map()
  );
  const [modelsByProvider, setModelsByProvider] = useState<ReadonlyMap<AiAssist.AiProviderId, string>>(
    () => new Map(IMAGE_PROVIDERS.map((p) => [p, defaultModelFor(p)]))
  );
  const [lastResult, setLastResult] = useState<AiAssist.IAiImageGenerationResponse | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

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
      providers: IMAGE_PROVIDERS.map((p) => {
        const model = modelsByProvider.get(p);
        return {
          provider: p,
          secretName: secretNameFor(p),
          ...(model && model.length > 0 ? { model } : {})
        };
      }),
      defaultProvider: provider
    }),
    [provider, modelsByProvider]
  );

  const { isWorking, generateImages } = useAiAssist({ settings, keyStore });

  const setApiKey = (next: string): void => {
    setApiKeysByProvider((prev) => {
      const updated = new Map(prev);
      updated.set(provider, next);
      return updated;
    });
  };

  const setModel = (next: string): void => {
    setModelsByProvider((prev) => {
      const updated = new Map(prev);
      updated.set(provider, next);
      return updated;
    });
  };

  const handleGenerate = async (params: AiAssist.IAiImageGenerationParams): Promise<void> => {
    setError(undefined);
    setLastResult(undefined);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const result = await generateImages(provider, params, controller.signal);
    abortControllerRef.current = undefined;
    if (result.isFailure()) {
      setError(result.message);
    } else {
      setLastResult(result.value);
    }
  };

  const handleAbort = (): void => {
    abortControllerRef.current?.abort();
  };

  const currentKey = apiKeysByProvider.get(provider) ?? '';
  const currentModel = modelsByProvider.get(provider) ?? '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <h1 className="text-2xl font-semibold">AI Image Generation Sample</h1>
          <p className="mt-1 text-sm text-slate-600">
            Demonstrates the @fgv/ts-extras image-generation API via the @fgv/ts-app-shell useAiAssist hook.
            API keys live in memory for this session only.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <SettingsPanel
          providers={IMAGE_PROVIDERS}
          provider={provider}
          onProviderChange={setProvider}
          apiKey={currentKey}
          onApiKeyChange={setApiKey}
          model={currentModel}
          modelPlaceholder={defaultModelFor(provider)}
          onModelChange={setModel}
        />

        <PromptPanel
          provider={provider}
          isWorking={isWorking}
          canSubmit={currentKey.length > 0}
          onGenerate={handleGenerate}
          onAbort={handleAbort}
        />

        {error !== undefined && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}

        {lastResult !== undefined && <ImageResults response={lastResult} />}
      </main>
    </div>
  );
}
