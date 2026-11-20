/**
 * Generated-image gallery for the `image-generation` scenario. Ported from
 * `samples/ai-image-gen-sample/src/components/ImageResults.tsx` with testbed styling
 * tokens and `image-gen-*` test ids.
 *
 * @packageDocumentation
 */

import React from 'react';
import { AiAssist } from '@fgv/ts-extras';

export interface IImageResultsProps {
  readonly response: AiAssist.IAiImageGenerationResponse;
  readonly onUseAsReference?: (image: AiAssist.IAiGeneratedImage) => void;
}

export function ImageResults(props: IImageResultsProps): React.ReactElement {
  const { response, onUseAsReference } = props;
  const count = response.images.length;

  return (
    <section data-testid="image-gen-results" className="rounded-lg border border-border bg-surface-raised p-4">
      <h3 className="text-sm font-semibold text-primary">
        Generated {count} {count === 1 ? 'image' : 'images'}
      </h3>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {response.images.map((image, idx) => (
          <figure key={idx} data-testid={`image-gen-result-${idx}`} className="space-y-2">
            <img
              src={AiAssist.toDataUrl(image)}
              alt={`Generated image ${idx + 1}`}
              className="w-full rounded-md border border-border"
            />
            <figcaption className="text-xs text-muted">
              <span className="font-mono">{image.mimeType}</span>
              {image.revisedPrompt !== undefined && (
                <p className="mt-1 italic text-secondary">
                  <span className="not-italic font-semibold text-primary">Revised prompt:</span>{' '}
                  {image.revisedPrompt}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <a
                  href={AiAssist.toDataUrl(image)}
                  download={`generated-${idx + 1}.${image.mimeType.split('/')[1] ?? 'png'}`}
                  className="text-brand-primary hover:text-brand-secondary"
                >
                  Download
                </a>
                {onUseAsReference !== undefined && (
                  <button
                    type="button"
                    data-testid={`image-gen-use-as-ref-${idx}`}
                    onClick={() => onUseAsReference(image)}
                    className="text-brand-primary hover:text-brand-secondary"
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
