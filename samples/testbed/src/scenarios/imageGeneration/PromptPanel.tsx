/**
 * Prompt form for the `image-generation` scenario: prompt text, count, size/aspect-ratio
 * (format-dependent), and reference-image upload. Ported from
 * `samples/ai-image-gen-sample/src/components/PromptPanel.tsx` with testbed styling
 * tokens and `image-gen-*` test ids.
 *
 * @packageDocumentation
 */

import { useState } from 'react';
import React from 'react';
import { AiAssist } from '@fgv/ts-extras';

export interface IPromptPanelProps {
  /**
   * Image-generation capability resolved for the currently selected provider + model.
   * `undefined` means the current model has no matching capability (e.g. an unknown
   * model id) and the panel renders no format-specific affordances.
   */
  readonly imageCapability: AiAssist.IAiImageModelCapability | undefined;
  readonly isWorking: boolean;
  readonly canSubmit: boolean;
  readonly referenceImages: ReadonlyArray<AiAssist.IAiImageAttachment>;
  readonly onReferenceImagesChange: React.Dispatch<
    React.SetStateAction<ReadonlyArray<AiAssist.IAiImageAttachment>>
  >;
  readonly onGenerate: (params: AiAssist.IAiImageGenerationParams) => Promise<void>;
  readonly onAbort: () => void;
}

/** Default `gpt-image-*` size options (used when the capability doesn't list `acceptedSizes`). */
const DEFAULT_OPENAI_SIZES: ReadonlyArray<AiAssist.GptImageSize> = [
  '1024x1024',
  '1536x1024',
  '1024x1536',
  'auto'
];

/** Common aspect ratios offered for the Gemini Flash Image / xAI Grok Imagine formats. */
const ASPECT_RATIOS: readonly string[] = ['1:1', '3:4', '4:3', '9:16', '16:9'];

const ACCEPTED_REF_MIME_TYPE_LIST = ['image/png', 'image/jpeg', 'image/webp'] as const;
const ACCEPTED_REF_MIME_TYPES: string = ACCEPTED_REF_MIME_TYPE_LIST.join(',');
const ACCEPTED_REF_MIME_TYPE_SET: ReadonlySet<string> = new Set(ACCEPTED_REF_MIME_TYPE_LIST);

async function fileToAttachment(file: File): Promise<AiAssist.IAiImageAttachment> {
  // Some browsers/OSes report JPEGs as `image/jpg`; normalize to the canonical
  // `image/jpeg` before validation so they aren't rejected.
  const fileType = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  // `<input accept>` is only a hint, so validate explicitly (drag-drop / "All files" can bypass it).
  if (!ACCEPTED_REF_MIME_TYPE_SET.has(fileType)) {
    throw new Error(`unsupported file type: ${file.type || 'unknown'}`);
  }
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('failed to read file'));
    reader.readAsDataURL(file);
  });
  // FileReader.readAsDataURL is spec-defined to produce `data:<mime>;base64,<data>`,
  // but validate the structure explicitly so a malformed prefix fails loudly
  // instead of producing a silently miscomputed mime/base64.
  const PREFIX = 'data:';
  const MARKER = ';base64,';
  if (!dataUrl.startsWith(PREFIX)) {
    throw new Error('failed to read file: invalid data URL format');
  }
  const markerIdx = dataUrl.indexOf(MARKER);
  if (markerIdx === -1) {
    throw new Error('failed to read file: expected base64 data URL');
  }
  const base64 = dataUrl.slice(markerIdx + MARKER.length);
  if (!base64) {
    throw new Error('failed to read file: empty base64 payload');
  }
  const headerMime = dataUrl.slice(PREFIX.length, markerIdx);
  const mimeType = (headerMime === 'image/jpg' ? 'image/jpeg' : headerMime) || fileType;
  return { mimeType, base64 };
}

export function PromptPanel(props: IPromptPanelProps): React.ReactElement {
  const {
    imageCapability,
    isWorking,
    canSubmit,
    referenceImages,
    onReferenceImagesChange,
    onGenerate,
    onAbort
  } = props;

  const [prompt, setPrompt] = useState('A friendly robot painting a watercolor landscape');
  const [count, setCount] = useState(1);
  const [size, setSize] = useState<AiAssist.GptImageSize>('1024x1024');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');

  const imageFormat = imageCapability?.format;
  const acceptsRefs = imageCapability?.acceptsImageReferenceInput === true;

  // Aspect-ratio-driven formats configure via the layered `options.models` block for
  // their family rather than a top-level field (only OpenAI's `size` is top-level).
  const isGeminiFlashImage = imageFormat === 'gemini-image-out';
  const isGrokImagine = imageFormat === 'xai-images' || imageFormat === 'xai-images-edits';
  const supportsSize = imageFormat === 'openai-images';
  const supportsAspectRatio = isGeminiFlashImage || isGrokImagine;
  const availableSizes: ReadonlyArray<AiAssist.GptImageSize> =
    (imageCapability?.acceptedSizes as ReadonlyArray<AiAssist.GptImageSize> | undefined) ??
    DEFAULT_OPENAI_SIZES;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!canSubmit || isWorking) {
      return;
    }
    const options: AiAssist.IAiImageGenerationOptions = {
      count,
      ...(supportsSize ? { size } : {}),
      ...(isGeminiFlashImage
        ? { models: [{ provider: 'google', family: 'gemini-flash-image', config: { aspectRatio } }] }
        : {}),
      ...(isGrokImagine
        ? { models: [{ provider: 'xai', family: 'grok-imagine', config: { aspectRatio } }] }
        : {})
    };
    onGenerate({
      prompt,
      options,
      ...(acceptsRefs && referenceImages.length > 0 ? { referenceImages } : {})
    }).catch(() => undefined);
  };

  const handleAddRefs = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) {
      return;
    }
    const added = await Promise.all(Array.from(files).map(fileToAttachment));
    // Functional update guards against state changing while file reads are in flight.
    onReferenceImagesChange((prev) => [...prev, ...added]);
  };

  const handleRemoveRef = (index: number): void => {
    onReferenceImagesChange((prev) => prev.filter((__ref, i) => i !== index));
  };

  const handleClearRefs = (): void => {
    onReferenceImagesChange([]);
  };

  return (
    <section data-testid="image-gen-prompt" className="rounded-lg border border-border bg-surface-raised p-4">
      <h3 className="text-sm font-semibold text-primary">Prompt</h3>

      <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="font-medium text-secondary">Describe the image</span>
          <textarea
            data-testid="image-gen-prompt-input"
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isWorking}
          />
        </label>

        {acceptsRefs && (
          <div className="rounded-md border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">
                Reference images{' '}
                <span className="font-normal text-muted">
                  ({referenceImages.length} attached) — preserve a character or style across generations
                </span>
              </span>
              {referenceImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRefs}
                  disabled={isWorking}
                  className="text-xs font-medium text-secondary hover:text-primary disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>
            <input
              type="file"
              accept={ACCEPTED_REF_MIME_TYPES}
              multiple
              disabled={isWorking}
              aria-label="Add reference images"
              data-testid="image-gen-ref-file-input"
              className="mt-2 block w-full text-sm text-secondary"
              onChange={(e) => {
                handleAddRefs(e.target.files).catch((error: unknown) => {
                  // Surfaced to the user via alert; console gives the developer a stack
                  // trace during local development.
                  console.error('Failed to add reference images.', error);
                  window.alert(
                    error instanceof Error ? error.message : 'Failed to add one or more reference images.'
                  );
                });
                e.target.value = '';
              }}
            />
            {referenceImages.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {referenceImages.map((ref, idx) => (
                  // base64 payload is unique per attachment and stable across
                  // removes, so React won't reuse DOM nodes when indices shift.
                  <li key={ref.base64} className="relative">
                    <img
                      src={AiAssist.toDataUrl(ref)}
                      alt={`Reference ${idx + 1}`}
                      className="h-16 w-16 rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRef(idx)}
                      disabled={isWorking}
                      aria-label={`Remove reference image ${idx + 1}`}
                      className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-xs text-secondary hover:bg-hover disabled:opacity-50"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium text-secondary">Count</span>
            <input
              type="number"
              min={1}
              max={4}
              data-testid="image-gen-count-input"
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              disabled={isWorking}
            />
            <span className="mt-1 block text-xs text-muted">
              {imageCapability?.maxCount !== undefined &&
                `This model accepts up to ${imageCapability.maxCount} image(s) per request.`}
            </span>
          </label>

          {supportsSize && (
            <label className="block text-sm">
              <span className="font-medium text-secondary">Size</span>
              <select
                data-testid="image-gen-size-select"
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                value={size}
                onChange={(e) => setSize(e.target.value as AiAssist.GptImageSize)}
                disabled={isWorking}
              >
                {availableSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}

          {supportsAspectRatio && (
            <label className="block text-sm">
              <span className="font-medium text-secondary">Aspect ratio</span>
              <select
                data-testid="image-gen-aspect-select"
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={isWorking}
              >
                {ASPECT_RATIOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            data-testid="image-gen-submit-btn"
            disabled={!canSubmit || isWorking || prompt.trim().length === 0}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isWorking ? 'Generating…' : 'Generate'}
          </button>

          {isWorking && (
            <button
              type="button"
              data-testid="image-gen-abort-btn"
              onClick={onAbort}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-secondary hover:bg-hover"
            >
              Cancel
            </button>
          )}

          {!canSubmit && (
            <span data-testid="image-gen-cannot-submit-hint" className="text-sm text-muted">
              Configure an API key (Secrets, top bar) to enable generation.
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
