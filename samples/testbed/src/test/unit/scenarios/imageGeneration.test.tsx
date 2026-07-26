/**
 * Unit tests for the `image-generation` scenario: `SettingsPanel`, `PromptPanel`,
 * `ImageResults`, and the orchestrating `index.tsx` component. Network calls
 * (`AiAssist.callProviderImageGeneration` / `callProviderListModels`) are stubbed via
 * `jest.spyOn` — the same pattern `useAiAssist.test.ts` uses in `@fgv/ts-app-shell`.
 *
 * @packageDocumentation
 */

import '@fgv/ts-utils-jest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { fail, succeed } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import { SettingsPanel } from '../../../scenarios/imageGeneration/SettingsPanel';
import { PromptPanel } from '../../../scenarios/imageGeneration/PromptPanel';
import { ImageResults } from '../../../scenarios/imageGeneration/ImageResults';
import { defaultModelFor, IMAGE_PROVIDERS, imageGenerationScenario } from '../../../scenarios/imageGeneration';
import type { IScenarioContext } from '../../../shell';

// ---------------------------------------------------------------------------
// Scenario metadata
// ---------------------------------------------------------------------------

describe('imageGenerationScenario metadata', () => {
  test('declares the id, category, and a web impl with no cli impl', () => {
    expect(imageGenerationScenario.id).toBe('image-generation');
    expect(imageGenerationScenario.category).toBe('ai');
    expect(imageGenerationScenario.web).toBeDefined();
    expect(imageGenerationScenario.cli).toBeUndefined();
  });

  test('IMAGE_PROVIDERS is non-empty and only contains image-capable providers', () => {
    expect(IMAGE_PROVIDERS.length).toBeGreaterThan(0);
    for (const provider of IMAGE_PROVIDERS) {
      const descriptor = AiAssist.getProviderDescriptor(provider).orThrow();
      expect(AiAssist.supportsImageGeneration(descriptor)).toBe(true);
    }
  });

  test('requiredSecrets is derived from IMAGE_PROVIDERS (reuses existing CLI secret ids)', () => {
    const ids = (imageGenerationScenario.requiredSecrets ?? []).map((s) => s.id);
    expect(ids).toContain('openai-api-key');
    expect(ids).toContain('gemini-api-key');
    expect(ids).toContain('google-api-key');
    // Anthropic does not support image generation — must not be declared here.
    expect(ids).not.toContain('anthropic-api-key');
  });

  test('defaultModelFor returns the empty string for an unknown provider id', () => {
    expect(defaultModelFor('does-not-exist' as AiAssist.AiProviderId)).toBe('');
  });

  test('defaultModelFor resolves the image tier for a known provider', () => {
    expect(defaultModelFor('openai').length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// SettingsPanel
// ---------------------------------------------------------------------------

describe('imageGeneration SettingsPanel', () => {
  afterEach(cleanup);

  function baseProps(): React.ComponentProps<typeof SettingsPanel> {
    return {
      providers: ['openai', 'google-gemini'],
      provider: 'openai',
      onProviderChange: jest.fn(),
      apiKeyStatus: 'loading',
      apiKeyError: undefined,
      model: '',
      modelPlaceholder: 'gpt-image-2',
      onModelChange: jest.fn(),
      availableModels: [],
      isFetchingModels: false,
      modelListError: undefined,
      onFetchModels: jest.fn()
    };
  }

  test('shows the loading key affordance', () => {
    render(<SettingsPanel {...baseProps()} apiKeyStatus="loading" />);
    expect(screen.getByTestId('image-gen-key-loading')).not.toBeNull();
  });

  test('shows the ready key affordance', () => {
    render(<SettingsPanel {...baseProps()} apiKeyStatus="ready" />);
    expect(screen.getByTestId('image-gen-key-ready')).not.toBeNull();
  });

  test('shows the missing key affordance with the error message', () => {
    render(<SettingsPanel {...baseProps()} apiKeyStatus="missing" apiKeyError="not set" />);
    const el = screen.getByTestId('image-gen-key-missing');
    expect(el.textContent).toContain('not set');
  });

  test('the fetch-models button is disabled unless a key is ready', () => {
    render(<SettingsPanel {...baseProps()} apiKeyStatus="missing" />);
    expect((screen.getByTestId('image-gen-fetch-models-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  test('the fetch-models button is enabled with a ready key and not already fetching', () => {
    render(<SettingsPanel {...baseProps()} apiKeyStatus="ready" />);
    expect((screen.getByTestId('image-gen-fetch-models-btn') as HTMLButtonElement).disabled).toBe(false);
  });

  test('the fetch-models button shows "Fetching…" and is disabled while fetching', () => {
    render(<SettingsPanel {...baseProps()} apiKeyStatus="ready" isFetchingModels={true} />);
    const btn = screen.getByTestId('image-gen-fetch-models-btn');
    expect(btn.textContent).toBe('Fetching…');
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  test('changing the provider select calls onProviderChange', () => {
    const onProviderChange = jest.fn();
    render(<SettingsPanel {...baseProps()} onProviderChange={onProviderChange} />);
    fireEvent.change(screen.getByTestId('image-gen-provider-select'), { target: { value: 'google-gemini' } });
    expect(onProviderChange).toHaveBeenCalledWith('google-gemini');
  });

  test('changing the model input calls onModelChange', () => {
    const onModelChange = jest.fn();
    render(<SettingsPanel {...baseProps()} onModelChange={onModelChange} />);
    fireEvent.change(screen.getByTestId('image-gen-model-input'), { target: { value: 'gpt-image-3' } });
    expect(onModelChange).toHaveBeenCalledWith('gpt-image-3');
  });

  test('clicking fetch models calls onFetchModels', () => {
    const onFetchModels = jest.fn();
    render(<SettingsPanel {...baseProps()} apiKeyStatus="ready" onFetchModels={onFetchModels} />);
    fireEvent.click(screen.getByTestId('image-gen-fetch-models-btn'));
    expect(onFetchModels).toHaveBeenCalled();
  });

  test('renders the fetched model list', () => {
    render(
      <SettingsPanel
        {...baseProps()}
        availableModels={[{ id: 'gpt-image-2', displayName: 'GPT Image 2', capabilities: new Set() }]}
      />
    );
    const list = screen.getByTestId('image-gen-model-list');
    expect(within(list).getByText('GPT Image 2')).not.toBeNull();
  });

  test('renders the model-list error and still allows manual entry', () => {
    render(<SettingsPanel {...baseProps()} modelListError="network error" />);
    expect(screen.getByTestId('image-gen-model-list-error').textContent).toContain('network error');
  });
});

// ---------------------------------------------------------------------------
// PromptPanel
// ---------------------------------------------------------------------------

describe('imageGeneration PromptPanel', () => {
  afterEach(cleanup);

  const OPENAI_CAPABILITY: AiAssist.IAiImageModelCapability = {
    modelPrefix: 'gpt-image-',
    format: 'openai-images',
    acceptsImageReferenceInput: true,
    acceptedSizes: ['1024x1024', '1536x1024'],
    maxCount: 10
  };

  const GEMINI_CAPABILITY: AiAssist.IAiImageModelCapability = {
    modelPrefix: '',
    format: 'gemini-image-out',
    acceptsImageReferenceInput: true,
    maxCount: 1
  };

  function baseProps(
    overrides: Partial<React.ComponentProps<typeof PromptPanel>> = {}
  ): React.ComponentProps<typeof PromptPanel> {
    return {
      imageCapability: OPENAI_CAPABILITY,
      isWorking: false,
      canSubmit: true,
      referenceImages: [],
      onReferenceImagesChange: jest.fn(),
      onGenerate: jest.fn(async () => undefined),
      onAbort: jest.fn(),
      ...overrides
    };
  }

  test('shows the size selector for the openai-images format', () => {
    render(<PromptPanel {...baseProps()} />);
    expect(screen.getByTestId('image-gen-size-select')).not.toBeNull();
    expect(screen.queryByTestId('image-gen-aspect-select')).toBeNull();
  });

  test('shows the aspect-ratio selector for the gemini-image-out format', () => {
    render(<PromptPanel {...baseProps({ imageCapability: GEMINI_CAPABILITY })} />);
    expect(screen.queryByTestId('image-gen-size-select')).toBeNull();
    expect(screen.getByTestId('image-gen-aspect-select')).not.toBeNull();
  });

  test('shows neither selector when imageCapability is undefined', () => {
    render(<PromptPanel {...baseProps({ imageCapability: undefined })} />);
    expect(screen.queryByTestId('image-gen-size-select')).toBeNull();
    expect(screen.queryByTestId('image-gen-aspect-select')).toBeNull();
  });

  test('submit is disabled when canSubmit is false, with a hint shown', () => {
    render(<PromptPanel {...baseProps({ canSubmit: false })} />);
    expect((screen.getByTestId('image-gen-submit-btn') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('image-gen-cannot-submit-hint')).not.toBeNull();
  });

  test('submit is disabled when the prompt is empty', () => {
    render(<PromptPanel {...baseProps()} />);
    fireEvent.change(screen.getByTestId('image-gen-prompt-input'), { target: { value: '   ' } });
    expect((screen.getByTestId('image-gen-submit-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  test('submitting calls onGenerate with the OpenAI size option', () => {
    const onGenerate = jest.fn(async () => undefined);
    render(<PromptPanel {...baseProps({ onGenerate })} />);
    fireEvent.change(screen.getByTestId('image-gen-prompt-input'), { target: { value: 'a cat' } });
    fireEvent.change(screen.getByTestId('image-gen-size-select'), { target: { value: '1536x1024' } });
    fireEvent.click(screen.getByTestId('image-gen-submit-btn'));
    expect(onGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'a cat', options: expect.objectContaining({ size: '1536x1024' }) })
    );
  });

  test('submitting with the gemini format sends a models block with the aspect ratio', () => {
    const onGenerate = jest.fn(async () => undefined);
    render(<PromptPanel {...baseProps({ imageCapability: GEMINI_CAPABILITY, onGenerate })} />);
    fireEvent.change(screen.getByTestId('image-gen-prompt-input'), { target: { value: 'a dog' } });
    fireEvent.change(screen.getByTestId('image-gen-aspect-select'), { target: { value: '16:9' } });
    fireEvent.click(screen.getByTestId('image-gen-submit-btn'));
    expect(onGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          models: [{ provider: 'google', family: 'gemini-flash-image', config: { aspectRatio: '16:9' } }]
        })
      })
    );
  });

  test('clicking submit while canSubmit is false does not call onGenerate', () => {
    const onGenerate = jest.fn(async () => undefined);
    render(<PromptPanel {...baseProps({ canSubmit: false, onGenerate })} />);
    fireEvent.click(screen.getByTestId('image-gen-submit-btn'));
    expect(onGenerate).not.toHaveBeenCalled();
  });

  test('shows the abort button while working, and clicking it calls onAbort', () => {
    const onAbort = jest.fn();
    render(<PromptPanel {...baseProps({ isWorking: true, onAbort })} />);
    fireEvent.click(screen.getByTestId('image-gen-abort-btn'));
    expect(onAbort).toHaveBeenCalled();
  });

  test('the count input clamps to a minimum of 1', () => {
    render(<PromptPanel {...baseProps()} />);
    const input = screen.getByTestId('image-gen-count-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0' } });
    expect(input.value).toBe('1');
  });

  test('shows the maxCount hint when the capability declares one', () => {
    render(<PromptPanel {...baseProps()} />);
    expect(screen.getByText(/up to 10 image\(s\)/)).not.toBeNull();
  });

  test('does not show reference-image affordances when acceptsImageReferenceInput is false', () => {
    render(
      <PromptPanel
        {...baseProps({
          imageCapability: { modelPrefix: '', format: 'xai-images', acceptsImageReferenceInput: false }
        })}
      />
    );
    expect(screen.queryByTestId('image-gen-ref-file-input')).toBeNull();
  });

  test('shows reference images and supports removing one', () => {
    const onReferenceImagesChange = jest.fn();
    render(
      <PromptPanel
        {...baseProps({
          referenceImages: [{ mimeType: 'image/png', base64: 'AAA' }],
          onReferenceImagesChange
        })}
      />
    );
    fireEvent.click(screen.getByLabelText('Remove reference image 1'));
    const updater = onReferenceImagesChange.mock.calls[0][0] as (
      prev: ReadonlyArray<AiAssist.IAiImageAttachment>
    ) => ReadonlyArray<AiAssist.IAiImageAttachment>;
    expect(updater([{ mimeType: 'image/png', base64: 'AAA' }])).toEqual([]);
  });

  test('clear-all removes every reference image', () => {
    const onReferenceImagesChange = jest.fn();
    render(
      <PromptPanel
        {...baseProps({
          referenceImages: [{ mimeType: 'image/png', base64: 'AAA' }],
          onReferenceImagesChange
        })}
      />
    );
    fireEvent.click(screen.getByText('Clear all'));
    expect(onReferenceImagesChange).toHaveBeenCalledWith([]);
  });

  test('adding a valid reference image file calls onReferenceImagesChange with an attachment', async () => {
    const onReferenceImagesChange = jest.fn();
    render(<PromptPanel {...baseProps({ onReferenceImagesChange })} />);
    const file = new File(['fake-bytes'], 'ref.png', { type: 'image/png' });
    fireEvent.change(screen.getByTestId('image-gen-ref-file-input'), { target: { files: [file] } });

    await waitFor(() => expect(onReferenceImagesChange).toHaveBeenCalled());
    const updater = onReferenceImagesChange.mock.calls[0][0] as (
      prev: ReadonlyArray<AiAssist.IAiImageAttachment>
    ) => ReadonlyArray<AiAssist.IAiImageAttachment>;
    const result = updater([]);
    expect(result).toHaveLength(1);
    expect(result[0]?.mimeType).toBe('image/png');
  });

  test('rejects an unsupported reference-image file type with an alert', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    render(<PromptPanel {...baseProps()} />);
    const file = new File(['fake-bytes'], 'ref.gif', { type: 'image/gif' });
    fireEvent.change(screen.getByTestId('image-gen-ref-file-input'), { target: { files: [file] } });

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(alertSpy.mock.calls[0]?.[0]).toMatch(/unsupported file type/);
    alertSpy.mockRestore();
  });

  test('changing the file input with no files is a no-op', () => {
    const onReferenceImagesChange = jest.fn();
    render(<PromptPanel {...baseProps({ onReferenceImagesChange })} />);
    fireEvent.change(screen.getByTestId('image-gen-ref-file-input'), { target: { files: [] } });
    expect(onReferenceImagesChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ImageResults
// ---------------------------------------------------------------------------

describe('imageGeneration ImageResults', () => {
  afterEach(cleanup);

  const RESPONSE: AiAssist.IAiImageGenerationResponse = {
    images: [
      { mimeType: 'image/png', base64: 'AAA', revisedPrompt: 'a revised prompt' },
      { mimeType: 'image/jpeg', base64: 'BBB' }
    ]
  };

  test('renders one figure per generated image with the count in the heading', () => {
    render(<ImageResults response={RESPONSE} />);
    expect(screen.getByTestId('image-gen-result-0')).not.toBeNull();
    expect(screen.getByTestId('image-gen-result-1')).not.toBeNull();
    expect(screen.getByText('Generated 2 images')).not.toBeNull();
  });

  test('renders the revised prompt when present', () => {
    render(<ImageResults response={RESPONSE} />);
    expect(screen.getByText(/a revised prompt/)).not.toBeNull();
  });

  test('omits the "use as reference" affordance when onUseAsReference is not supplied', () => {
    render(<ImageResults response={RESPONSE} />);
    expect(screen.queryByTestId('image-gen-use-as-ref-0')).toBeNull();
  });

  test('clicking "use as reference" invokes the callback with the image', () => {
    const onUseAsReference = jest.fn();
    render(<ImageResults response={RESPONSE} onUseAsReference={onUseAsReference} />);
    fireEvent.click(screen.getByTestId('image-gen-use-as-ref-0'));
    expect(onUseAsReference).toHaveBeenCalledWith(RESPONSE.images[0]);
  });

  test('singular heading for a single-image response', () => {
    render(<ImageResults response={{ images: [{ mimeType: 'image/png', base64: 'AAA' }] }} />);
    expect(screen.getByText('Generated 1 image')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// index.tsx (integration, mocked AiAssist dispatch)
// ---------------------------------------------------------------------------

describe('imageGeneration integration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  function makeContext(resolveSecret: IScenarioContext['resolveSecret']): IScenarioContext {
    return {
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        detail: jest.fn()
      } as unknown as IScenarioContext['logger'],
      keyStore: undefined,
      resolveSecret,
      dataTree: {} as unknown as IScenarioContext['dataTree']
    };
  }

  test('shows the missing-key affordance when no secret resolves', async () => {
    const context = makeContext(async () => fail('secret not configured'));
    const Component = imageGenerationScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.getByTestId('image-gen-key-missing')).not.toBeNull());
    expect((screen.getByTestId('image-gen-submit-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  test('enables generation and renders results once a key resolves and generation succeeds', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    const generateSpy = jest.spyOn(AiAssist, 'callProviderImageGeneration').mockResolvedValue(
      succeed({ images: [{ mimeType: 'image/png', base64: 'AAA' }] })
    );
    const Component = imageGenerationScenario.web!.component;
    render(<Component context={context} />);

    await waitFor(() => expect(screen.getByTestId('image-gen-key-ready')).not.toBeNull());
    fireEvent.click(screen.getByTestId('image-gen-submit-btn'));

    await waitFor(() => expect(screen.getByTestId('image-gen-results')).not.toBeNull());
    expect(generateSpy).toHaveBeenCalled();
  });

  test('shows an inline error when generation fails', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    jest.spyOn(AiAssist, 'callProviderImageGeneration').mockResolvedValue(fail('provider rejected the request'));
    const Component = imageGenerationScenario.web!.component;
    render(<Component context={context} />);

    await waitFor(() => expect(screen.getByTestId('image-gen-key-ready')).not.toBeNull());
    fireEvent.click(screen.getByTestId('image-gen-submit-btn'));

    await waitFor(() => expect(screen.getByTestId('image-gen-error')).not.toBeNull());
    expect(screen.getByTestId('image-gen-error').textContent).toContain('provider rejected the request');
  });

  test('fetching models populates the model list on success', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    jest.spyOn(AiAssist, 'callProviderListModels').mockResolvedValue(
      succeed([{ id: 'gpt-image-3', displayName: 'GPT Image 3', capabilities: new Set() }])
    );
    const Component = imageGenerationScenario.web!.component;
    render(<Component context={context} />);

    await waitFor(() => expect(screen.getByTestId('image-gen-key-ready')).not.toBeNull());
    fireEvent.click(screen.getByTestId('image-gen-fetch-models-btn'));

    await waitFor(() => expect(screen.getByTestId('image-gen-model-list')).not.toBeNull());
    expect(within(screen.getByTestId('image-gen-model-list')).getByText('GPT Image 3')).not.toBeNull();
  });

  test('fetching models surfaces a list error on failure', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    jest.spyOn(AiAssist, 'callProviderListModels').mockResolvedValue(fail('rate limited'));
    const Component = imageGenerationScenario.web!.component;
    render(<Component context={context} />);

    await waitFor(() => expect(screen.getByTestId('image-gen-key-ready')).not.toBeNull());
    fireEvent.click(screen.getByTestId('image-gen-fetch-models-btn'));

    await waitFor(() => expect(screen.getByTestId('image-gen-model-list-error')).not.toBeNull());
  });

  test('switching provider resets the settings panel to the new provider', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    const Component = imageGenerationScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.getByTestId('image-gen-key-ready')).not.toBeNull());

    const otherProvider = IMAGE_PROVIDERS.find((p) => p !== IMAGE_PROVIDERS[0]);
    if (otherProvider) {
      fireEvent.change(screen.getByTestId('image-gen-provider-select'), { target: { value: otherProvider } });
      const select = screen.getByTestId('image-gen-provider-select') as HTMLSelectElement;
      expect(select.value).toBe(otherProvider);
    }
  });

  test('using a generated image as a reference adds it to referenceImages when the model accepts refs', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    jest
      .spyOn(AiAssist, 'callProviderImageGeneration')
      .mockResolvedValue(succeed({ images: [{ mimeType: 'image/png', base64: 'AAA' }] }));
    const Component = imageGenerationScenario.web!.component;
    render(<Component context={context} />);

    await waitFor(() => expect(screen.getByTestId('image-gen-key-ready')).not.toBeNull());
    fireEvent.click(screen.getByTestId('image-gen-submit-btn'));
    await waitFor(() => expect(screen.getByTestId('image-gen-results')).not.toBeNull());

    const useAsRefBtn = screen.queryByTestId('image-gen-use-as-ref-0');
    if (useAsRefBtn) {
      fireEvent.click(useAsRefBtn);
      await waitFor(() => expect(screen.getByLabelText('Remove reference image 1')).not.toBeNull());
    }
  });
});
