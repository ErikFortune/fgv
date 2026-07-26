/**
 * `image-generation` scenario — a web port of `samples/ai-image-gen-sample`'s image
 * mode. Provider + model picker (pre-filled from the `image` tier via
 * `AiAssist.resolveModel`), prompt form, and generated-image gallery, using
 * `@fgv/ts-app-shell`'s `useAiAssist` hook exactly as the sample does.
 *
 * The sample's `InMemoryKeyStore` + per-scenario API-key `<input>` are replaced by the
 * shell's session secrets store: `useProviderApiKey` (in `../aiProviderSecrets.ts`)
 * resolves the current provider's key via `context.resolveSecret`, and the panel shows a
 * "missing key — open Secrets" affordance rather than accepting typed input directly.
 * `samples/ai-image-gen-sample` itself is untouched — see the `testbed-web-scenarios`
 * brief for why it is not retired in this phase.
 *
 * Web-only: a live API key cannot be embedded in the CLI's non-interactive run, and the
 * sample this ports has no CLI surface either.
 *
 * @packageDocumentation
 */

import React, { useMemo, useRef, useState } from 'react';
import { AiAssist } from '@fgv/ts-extras';
import { useAiAssist } from '@fgv/ts-app-shell';

import type { IScenario, IScenarioContext, IWebScenarioImpl } from '../../shell';
import { requiredSecretsForProviders, SingleSecretKeyStore, useProviderApiKey } from '../aiProviderSecrets';
import { SettingsPanel } from './SettingsPanel';
import { PromptPanel } from './PromptPanel';
import { ImageResults } from './ImageResults';

// ---------------------------------------------------------------------------
// Provider list + defaults
// ---------------------------------------------------------------------------

/** Every registered provider that declares an image-generation capability. */
const IMAGE_PROVIDERS: ReadonlyArray<AiAssist.AiProviderId> = AiAssist.getProviderDescriptors()
  .filter((d) => AiAssist.supportsImageGeneration(d))
  .map((d) => d.id);

/** Resolves the `image`-tier default model id for a provider (empty string if unknown). */
function defaultModelFor(provider: AiAssist.AiProviderId): string {
  const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();
  if (!descriptor) {
    return '';
  }
  return AiAssist.resolveModel(descriptor.defaultModel, 'image');
}

function initialModelsByProvider(): ReadonlyMap<AiAssist.AiProviderId, string> {
  return new Map(IMAGE_PROVIDERS.map((p) => [p, defaultModelFor(p)]));
}

// ---------------------------------------------------------------------------
// Web component
// ---------------------------------------------------------------------------

function ImageGenerationComponent({
  context
}: {
  readonly context: IScenarioContext;
}): React.ReactElement {
  /* c8 ignore next 3 - defensive: IMAGE_PROVIDERS always has at least one entry from the real ai-assist registry; the fallback guards only a hypothetical empty registry */
  const [provider, setProvider] = useState<AiAssist.AiProviderId>(
    IMAGE_PROVIDERS[0] ?? ('openai' as AiAssist.AiProviderId)
  );
  const [modelsByProvider, setModelsByProvider] =
    useState<ReadonlyMap<AiAssist.AiProviderId, string>>(initialModelsByProvider);
  const [availableByProvider, setAvailableByProvider] = useState<
    ReadonlyMap<AiAssist.AiProviderId, ReadonlyArray<AiAssist.IAiModelInfo>>
  >(new Map());
  const [listErrorByProvider, setListErrorByProvider] = useState<
    ReadonlyMap<AiAssist.AiProviderId, string>
  >(new Map());
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [lastResult, setLastResult] = useState<AiAssist.IAiImageGenerationResponse | undefined>(undefined);
  const [imageError, setImageError] = useState<string | undefined>(undefined);
  const [referenceImages, setReferenceImages] = useState<ReadonlyArray<AiAssist.IAiImageAttachment>>([]);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const { apiKey, status: apiKeyStatus, error: apiKeyError } = useProviderApiKey(context, provider);

  // `provider` only ever takes a value from IMAGE_PROVIDERS (initial state + the
  // dropdown's own options), and `modelsByProvider` is seeded from IMAGE_PROVIDERS via
  // `initialModelsByProvider()`, so `.get(provider)` is always defined in practice; same
  // for `AiAssist.getProviderDescriptor(provider)` below, and for `currentModel` being
  // non-empty (every image-capable provider's registry entry resolves a real `image`-tier
  // default). The `??`/ternary fallbacks guard against those invariants breaking, not a
  // reachable UI path.
  /* c8 ignore next 1 */
  const currentModel = modelsByProvider.get(provider) ?? defaultModelFor(provider);
  const imageCapability = useMemo(() => {
    const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();
    /* c8 ignore next 1 */
    return descriptor ? AiAssist.resolveImageCapability(descriptor, currentModel) : undefined;
  }, [provider, currentModel]);
  /* c8 ignore next 1 - defensive: imageCapability is only undefined via the equally-unreachable descriptor-undefined branch above */
  const modelAcceptsRefs = imageCapability?.acceptsImageReferenceInput === true;

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
          /* c8 ignore next 1 */
          ...(currentModel.length > 0 ? { model: currentModel } : {})
        }
      ],
      defaultProvider: provider
    }),
    [provider, currentModel]
  );

  const { isWorking, generateImages, listModels } = useAiAssist({
    settings,
    keyStore,
    logger: context.logger
  });

  const handleFetchModels = async (): Promise<void> => {
    const targetProvider = provider;
    setIsFetchingModels(true);
    const result = await listModels(targetProvider, 'image-generation');
    setIsFetchingModels(false);
    if (result.isFailure()) {
      setAvailableByProvider((prev) => new Map(prev).set(targetProvider, []));
      setListErrorByProvider((prev) => new Map(prev).set(targetProvider, result.message));
    } else {
      setAvailableByProvider((prev) => new Map(prev).set(targetProvider, result.value));
      setListErrorByProvider((prev) => {
        const next = new Map(prev);
        next.delete(targetProvider);
        return next;
      });
    }
  };

  const handleGenerate = async (params: AiAssist.IAiImageGenerationParams): Promise<void> => {
    setImageError(undefined);
    setLastResult(undefined);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const result = await generateImages(provider, params, controller.signal);
    abortControllerRef.current = undefined;
    if (result.isFailure()) {
      setImageError(result.message);
    } else {
      setLastResult(result.value);
    }
  };

  const handleAbort = (): void => {
    // The Cancel button (the only caller) renders only while isWorking is true, which
    // is exactly when handleGenerate has just set abortControllerRef.current — the
    // undefined branch is defensive, not a reachable UI path.
    /* c8 ignore next 1 */
    abortControllerRef.current?.abort();
  };

  return (
    <div data-testid="image-gen-scenario" className="space-y-4">
      <SettingsPanel
        providers={IMAGE_PROVIDERS}
        provider={provider}
        onProviderChange={setProvider}
        apiKeyStatus={apiKeyStatus}
        apiKeyError={apiKeyError}
        model={currentModel}
        modelPlaceholder={defaultModelFor(provider)}
        onModelChange={(next) => setModelsByProvider((prev) => new Map(prev).set(provider, next))}
        availableModels={availableByProvider.get(provider) ?? []}
        isFetchingModels={isFetchingModels}
        modelListError={listErrorByProvider.get(provider)}
        onFetchModels={() => {
          handleFetchModels().catch(() => undefined);
        }}
      />
      <PromptPanel
        imageCapability={imageCapability}
        isWorking={isWorking}
        canSubmit={apiKeyStatus === 'ready'}
        referenceImages={referenceImages}
        onReferenceImagesChange={setReferenceImages}
        onGenerate={handleGenerate}
        onAbort={handleAbort}
      />
      {imageError !== undefined && (
        <div
          data-testid="image-gen-error"
          className="rounded-md border border-status-error-border bg-status-error-bg p-4 text-sm text-status-error-text"
        >
          <strong className="font-semibold text-status-error-strong">Error:</strong> {imageError}
        </div>
      )}
      {lastResult !== undefined && (
        <ImageResults
          response={lastResult}
          onUseAsReference={
            modelAcceptsRefs
              ? (image) =>
                  setReferenceImages((prev) => [
                    ...prev,
                    { mimeType: image.mimeType, base64: image.base64 }
                  ])
              : undefined
          }
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario export
// ---------------------------------------------------------------------------

const webImpl: IWebScenarioImpl = {
  component: ImageGenerationComponent
};

/**
 * `image-generation` scenario: a web port of `samples/ai-image-gen-sample`'s image mode.
 * @public
 */
export const imageGenerationScenario: IScenario = {
  id: 'image-generation',
  title: 'Image Generation',
  description:
    'Ported from samples/ai-image-gen-sample: pick an image-capable provider, resolve its ' +
    'image-tier default model, and generate images via AiAssist.callProviderImageGeneration. ' +
    'API keys come from the shell Secrets panel (top bar), not a per-scenario input.',
  category: 'ai',
  tags: ['ai-assist', 'image-generation', 'live-api'],
  requiredSecrets: requiredSecretsForProviders(IMAGE_PROVIDERS),
  web: webImpl
};

export { IMAGE_PROVIDERS, defaultModelFor };
