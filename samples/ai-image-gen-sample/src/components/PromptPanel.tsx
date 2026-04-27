import { useMemo, useState } from 'react';

import { AiAssist } from '@fgv/ts-extras';

export interface IPromptPanelProps {
  readonly provider: AiAssist.AiProviderId;
  readonly isWorking: boolean;
  readonly canSubmit: boolean;
  readonly referenceImages: ReadonlyArray<AiAssist.IAiImageAttachment>;
  readonly onReferenceImagesChange: (next: ReadonlyArray<AiAssist.IAiImageAttachment>) => void;
  readonly onGenerate: (params: AiAssist.IAiImageGenerationParams) => Promise<void>;
  readonly onAbort: () => void;
}

const OPENAI_SIZES: ReadonlyArray<NonNullable<AiAssist.IAiImageGenerationOptions['size']>> = [
  '1024x1024',
  '1024x1792',
  '1792x1024'
];

const IMAGEN_ASPECT_RATIOS: ReadonlyArray<
  NonNullable<NonNullable<AiAssist.IAiImageGenerationOptions['imagen']>['aspectRatio']>
> = ['1:1', '3:4', '4:3', '9:16', '16:9'];

const ACCEPTED_REF_MIME_TYPES = 'image/png,image/jpeg,image/webp';

async function fileToAttachment(file: File): Promise<AiAssist.IAiImageAttachment> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('failed to read file'));
    reader.readAsDataURL(file);
  });
  // dataUrl is like `data:<mime>;base64,<data>`; split into mime + raw base64
  const commaIdx = dataUrl.indexOf(',');
  const header = dataUrl.slice(5, dataUrl.indexOf(';'));
  const base64 = dataUrl.slice(commaIdx + 1);
  return { mimeType: header || file.type || 'application/octet-stream', base64 };
}

export function PromptPanel(props: IPromptPanelProps): React.JSX.Element {
  const { provider, isWorking, canSubmit, referenceImages, onReferenceImagesChange, onGenerate, onAbort } =
    props;

  const [prompt, setPrompt] = useState('A friendly robot painting a watercolor landscape');
  const [count, setCount] = useState(1);
  const [size, setSize] = useState<NonNullable<AiAssist.IAiImageGenerationOptions['size']>>('1024x1024');
  const [aspectRatio, setAspectRatio] =
    useState<NonNullable<NonNullable<AiAssist.IAiImageGenerationOptions['imagen']>['aspectRatio']>>('1:1');

  const descriptor = useMemo(() => AiAssist.getProviderDescriptor(provider).orDefault(), [provider]);
  const imageFormat = descriptor?.imageApiFormat;
  const acceptsRefs = descriptor?.acceptsImageReferenceInput === true;

  const isImagen = imageFormat === 'gemini-imagen';
  const supportsSize = imageFormat === 'openai-images';

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!canSubmit || isWorking) {
      return;
    }
    const options: AiAssist.IAiImageGenerationOptions = {
      count,
      ...(supportsSize ? { size } : {}),
      ...(isImagen ? { imagen: { aspectRatio } } : {})
    };
    void onGenerate({
      prompt,
      options,
      ...(acceptsRefs && referenceImages.length > 0 ? { referenceImages } : {})
    });
  };

  const handleAddRefs = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) {
      return;
    }
    const added = await Promise.all(Array.from(files).map(fileToAttachment));
    onReferenceImagesChange([...referenceImages, ...added]);
  };

  const handleRemoveRef = (index: number): void => {
    onReferenceImagesChange(referenceImages.filter((_, i) => i !== index));
  };

  const handleClearRefs = (): void => {
    onReferenceImagesChange([]);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Prompt</h2>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Describe the image</span>
          <textarea
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isWorking}
          />
        </label>

        {acceptsRefs && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Reference images{' '}
                <span className="font-normal text-slate-500">
                  ({referenceImages.length} attached) — preserve a character or style across generations
                </span>
              </span>
              {referenceImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRefs}
                  disabled={isWorking}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
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
              className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={(e) => {
                void handleAddRefs(e.target.files);
                e.target.value = '';
              }}
            />
            {referenceImages.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {referenceImages.map((ref, idx) => (
                  <li key={idx} className="relative">
                    <img
                      src={AiAssist.toDataUrl(ref)}
                      alt={`Reference ${idx + 1}`}
                      className="h-16 w-16 rounded-md border border-slate-300 object-cover shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRef(idx)}
                      disabled={isWorking}
                      aria-label={`Remove reference image ${idx + 1}`}
                      className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50"
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
            <span className="font-medium text-slate-700">Count</span>
            <input
              type="number"
              min={1}
              max={4}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              disabled={isWorking}
            />
            <span className="mt-1 block text-xs text-slate-500">
              {provider === 'openai' && 'dall-e-3 only accepts 1; the API will reject higher values.'}
            </span>
          </label>

          {supportsSize && (
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Size</span>
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={size}
                onChange={(e) =>
                  setSize(e.target.value as NonNullable<AiAssist.IAiImageGenerationOptions['size']>)
                }
                disabled={isWorking}
              >
                {OPENAI_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}

          {isImagen && (
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Aspect ratio</span>
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={aspectRatio}
                onChange={(e) =>
                  setAspectRatio(
                    e.target.value as NonNullable<
                      NonNullable<AiAssist.IAiImageGenerationOptions['imagen']>['aspectRatio']
                    >
                  )
                }
                disabled={isWorking}
              >
                {IMAGEN_ASPECT_RATIOS.map((a) => (
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
            disabled={!canSubmit || isWorking || prompt.trim().length === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isWorking ? 'Generating…' : 'Generate'}
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

          {!canSubmit && (
            <span className="text-sm text-slate-500">Enter an API key to enable generation.</span>
          )}
        </div>
      </form>
    </section>
  );
}
