// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Merge logic and runtime validation for image generation options.
 * @packageDocumentation
 */

import { type JsonObject } from '@fgv/ts-json-base';
import { fail, Result, succeed } from '@fgv/ts-utils';

import type {
  IAiImageModelCapability,
  IAiImageGenerationOptions,
  IModelFamilyConfig,
  INamedModelFamilyConfig,
  IGptImageModelOptions,
  IGrokImagineModelOptions,
  IGeminiFlashImageModelOptions,
  IOtherModelOptions
} from './model';

// ============================================================================
// Provider lineage helpers
// ============================================================================

/** Maps AiImageApiFormat values to the corresponding IModelFamilyConfig provider discriminator. */
function providerLineageForFormat(format: string): 'openai' | 'xai' | 'google' | 'other' | undefined {
  switch (format) {
    case 'openai-images':
      return 'openai';
    case 'xai-images':
    case 'xai-images-edits':
      return 'xai';
    case 'gemini-image-out':
      return 'google';
    default:
      return undefined;
  }
}

// ============================================================================
// Type guards
// ============================================================================

function isGptImageModelOptions(block: IModelFamilyConfig): block is IGptImageModelOptions {
  return block.provider === 'openai' && block.family === 'gpt-image';
}

function isGrokImagineModelOptions(block: IModelFamilyConfig): block is IGrokImagineModelOptions {
  return block.provider === 'xai' && block.family === 'grok-imagine';
}

function isGeminiFlashImageModelOptions(block: IModelFamilyConfig): block is IGeminiFlashImageModelOptions {
  return block.provider === 'google' && block.family === 'gemini-flash-image';
}

function isOtherModelOptions(block: IModelFamilyConfig): block is IOtherModelOptions {
  return block.provider === 'other';
}

// ============================================================================
// Resolved wire shape
// ============================================================================

/**
 * The resolved, merged wire parameters for an image generation request.
 * Built from the layered options and ready for provider-specific encoding.
 * @public
 */
export interface IResolvedImageOptions {
  /** Number of images to generate. */
  readonly n: number;
  /** Image size (OpenAI-style pixel strings). */
  readonly size?: string;
  /** Quality tier. */
  readonly quality?: string;
  /** Seed for reproducibility. */
  readonly seed?: number;
  // GptImage-specific
  readonly outputFormat?: string;
  readonly outputCompression?: number;
  readonly background?: string;
  readonly moderation?: string;
  // xAI-specific
  readonly aspectRatio?: string;
  readonly resolution?: string;
  // Gemini Flash-specific
  readonly geminiAspectRatio?: string;
  // Other-block passthroughs (merged at model-specific tier)
  readonly otherParams?: JsonObject;
}

// ============================================================================
// Merge logic
// ============================================================================

/**
 * Resolves the merged image options for a given model and capability.
 *
 * @remarks
 * **Merge precedence (later wins):**
 * 1. Generic top-level options (size, count, quality, seed)
 * 2. Family-generic blocks (models field omitted, provider matches)
 * 3. Model-specific blocks (models array includes the resolved model name)
 * 4. Other blocks (provider: 'other', models array includes model name)
 *
 * Provider-mismatch blocks are silently skipped.
 *
 * Within each tier, declaration order — later declaration wins.
 *
 * @param modelId - The resolved model string
 * @param capability - The resolved IAiImageModelCapability for this model
 * @param options - Caller-supplied options
 * @returns The merged wire parameters
 * @public
 */
export function resolveImageOptions(
  modelId: string,
  capability: IAiImageModelCapability,
  options: IAiImageGenerationOptions | undefined
): IResolvedImageOptions {
  const opts = options ?? {};
  const lineage = providerLineageForFormat(capability.format);

  // Start from generic top-level
  let resolved: IResolvedImageOptions = {
    n: opts.count ?? 1,
    ...(opts.size !== undefined ? { size: opts.size } : {}),
    ...(opts.quality !== undefined ? { quality: opts.quality } : {}),
    ...(opts.seed !== undefined ? { seed: opts.seed } : {})
  };

  const modelBlocks = opts.models ?? [];

  // Tier 2: family-generic blocks (models field omitted, provider matches lineage)
  for (const block of modelBlocks) {
    if (block.provider !== lineage && block.provider !== 'other') continue;
    if (block.provider === 'other') continue; // other blocks handled in tier 4
    if (!isApplicableBlock(block, modelId)) continue;
    if (!isFamilyGenericBlock(block)) continue;
    resolved = applyBlock(resolved, block);
  }

  // Tier 3: model-specific blocks (models array includes this model)
  for (const block of modelBlocks) {
    if (block.provider !== lineage && block.provider !== 'other') continue;
    if (block.provider === 'other') continue;
    if (!isApplicableBlock(block, modelId)) continue;
    if (isFamilyGenericBlock(block)) continue;
    resolved = applyBlock(resolved, block);
  }

  // Tier 4: Other blocks (same precedence as model-specific)
  for (const block of modelBlocks) {
    if (!isOtherModelOptions(block)) continue;
    if (!block.models.includes(modelId)) continue;
    resolved = applyOtherBlock(resolved, block);
  }

  return resolved;
}

function isApplicableBlock(block: IModelFamilyConfig, modelId: string): boolean {
  /* c8 ignore next 3 - defensive coding: other blocks are filtered before isApplicableBlock is called */
  if (isOtherModelOptions(block)) {
    return block.models.includes(modelId);
  }
  // Has models array? Must include this modelId.
  const named = block as INamedModelFamilyConfig;
  if (named.models !== undefined && named.models.length > 0) {
    return named.models.includes(modelId);
  }
  // No models array = family-generic = applies to all in this family
  return true;
}

function isFamilyGenericBlock(block: IModelFamilyConfig): boolean {
  /* c8 ignore next 1 - defensive coding: other blocks are filtered before isFamilyGenericBlock is called */
  if (isOtherModelOptions(block)) return false;
  const named = block as INamedModelFamilyConfig;
  return named.models === undefined || named.models.length === 0;
}

function applyBlock(resolved: IResolvedImageOptions, block: IModelFamilyConfig): IResolvedImageOptions {
  if (isGptImageModelOptions(block)) {
    return {
      ...resolved,
      ...(block.config.size !== undefined ? { size: block.config.size } : {}),
      ...(block.config.quality !== undefined ? { quality: block.config.quality } : {}),
      ...(block.config.outputFormat !== undefined ? { outputFormat: block.config.outputFormat } : {}),
      ...(block.config.outputCompression !== undefined
        ? { outputCompression: block.config.outputCompression }
        : {}),
      ...(block.config.background !== undefined ? { background: block.config.background } : {}),
      ...(block.config.moderation !== undefined ? { moderation: block.config.moderation } : {})
    };
  }
  if (isGrokImagineModelOptions(block)) {
    return {
      ...resolved,
      ...(block.config.aspectRatio !== undefined ? { aspectRatio: block.config.aspectRatio } : {}),
      ...(block.config.resolution !== undefined ? { resolution: block.config.resolution } : {})
    };
  }
  if (isGeminiFlashImageModelOptions(block)) {
    return {
      ...resolved,
      ...(block.config.aspectRatio !== undefined ? { geminiAspectRatio: block.config.aspectRatio } : {})
    };
  }
  /* c8 ignore next 2 - defensive coding: exhaustive union, all family types handled above */
  return resolved;
}

function applyOtherBlock(resolved: IResolvedImageOptions, block: IOtherModelOptions): IResolvedImageOptions {
  return {
    ...resolved,
    otherParams: { ...(resolved.otherParams ?? {}), ...block.config }
  };
}

// ============================================================================
// Runtime validation
// ============================================================================

/**
 * Validates the resolved options against per-model registry constraints.
 *
 * @remarks
 * Fails fast on the first violation. Error format:
 * `model "${model}": ${field} "${value}" is not accepted; accepted values: ${JSON.stringify(accepted)}`
 *
 * @param modelId - The resolved model string
 * @param capability - The resolved capability entry from the registry
 * @param resolved - The merged options from resolveImageOptions
 * @returns The same resolved options on success, or a failure with a contextual message
 * @public
 */
export function validateResolvedOptions(
  modelId: string,
  capability: IAiImageModelCapability,
  resolved: IResolvedImageOptions
): Result<IResolvedImageOptions> {
  // Validate count
  if (capability.maxCount !== undefined && resolved.n > capability.maxCount) {
    return fail(`model "${modelId}": count ${resolved.n} exceeds maximum of ${capability.maxCount}`);
  }

  // Validate size
  if (capability.acceptedSizes !== undefined && resolved.size !== undefined) {
    if (!capability.acceptedSizes.includes(resolved.size)) {
      return fail(
        `model "${modelId}": size "${resolved.size}" is not accepted; accepted values: ${JSON.stringify(
          capability.acceptedSizes
        )}`
      );
    }
  }

  // Validate quality
  if (
    capability.supportsQualityParam &&
    capability.acceptedQualities !== undefined &&
    resolved.quality !== undefined
  ) {
    if (!capability.acceptedQualities.includes(resolved.quality)) {
      return fail(
        `model "${modelId}": quality "${resolved.quality}" is not accepted; accepted values: ${JSON.stringify(
          capability.acceptedQualities
        )}`
      );
    }
  }

  return succeed(resolved);
}
