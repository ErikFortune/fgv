import { AiAssist } from '@fgv/ts-extras';

export interface IImageResultsProps {
  readonly response: AiAssist.IAiImageGenerationResponse;
  readonly onUseAsReference?: (image: AiAssist.IAiGeneratedImage) => void;
}

export function ImageResults(props: IImageResultsProps): React.JSX.Element {
  const { response, onUseAsReference } = props;
  const count = response.images.length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">
        Generated {count} {count === 1 ? 'image' : 'images'}
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {response.images.map((image, idx) => (
          <figure key={idx} className="space-y-2">
            <img
              src={AiAssist.toDataUrl(image)}
              alt={`Generated image ${idx + 1}`}
              className="w-full rounded-md border border-slate-200 shadow-sm"
            />
            <figcaption className="text-xs text-slate-500">
              <span className="font-mono">{image.mimeType}</span>
              {image.revisedPrompt !== undefined && (
                <p className="mt-1 italic text-slate-600">
                  <span className="not-italic font-semibold text-slate-700">Revised prompt:</span>{' '}
                  {image.revisedPrompt}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <a
                  href={AiAssist.toDataUrl(image)}
                  download={`generated-${idx + 1}.${image.mimeType.split('/')[1] ?? 'png'}`}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Download
                </a>
                {onUseAsReference !== undefined && (
                  <button
                    type="button"
                    onClick={() => onUseAsReference(image)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Use as reference
                  </button>
                )}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
