import { useMemo, useState } from 'react';

import { AiAssist } from '@fgv/ts-extras';

export interface IPromptPanelProps {
  readonly provider: AiAssist.AiProviderId;
  readonly isWorking: boolean;
  readonly canSubmit: boolean;
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

export function PromptPanel(props: IPromptPanelProps): React.JSX.Element {
  const { provider, isWorking, canSubmit, onGenerate, onAbort } = props;

  const [prompt, setPrompt] = useState('A friendly robot painting a watercolor landscape');
  const [count, setCount] = useState(1);
  const [size, setSize] = useState<NonNullable<AiAssist.IAiImageGenerationOptions['size']>>('1024x1024');
  const [aspectRatio, setAspectRatio] =
    useState<NonNullable<NonNullable<AiAssist.IAiImageGenerationOptions['imagen']>['aspectRatio']>>('1:1');

  const imageFormat = useMemo(
    () => AiAssist.getProviderDescriptor(provider).orDefault()?.imageApiFormat,
    [provider]
  );

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
    void onGenerate({ prompt, options });
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
