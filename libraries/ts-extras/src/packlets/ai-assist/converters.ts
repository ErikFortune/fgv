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
 * Converters for AI assist settings types.
 * @packageDocumentation
 */

import { type Converter, Converters, fail, succeed, type Validator, Validators } from '@fgv/ts-utils';
import { type JsonSchema } from '@fgv/ts-json-base';

import {
  type AiProviderId,
  type AiServerToolConfig,
  type AiServerToolType,
  type IAiAssistProviderConfig,
  type IAiAssistSettings,
  type IAiClientToolConfig,
  type IAiToolEnablement,
  type IAiWebSearchToolConfig,
  type ModelSpec,
  type ModelSpecKey,
  allModelSpecKeys
} from './model';
import { allProviderIds } from './registry';

// ============================================================================
// Provider ID
// ============================================================================

/**
 * Converter for {@link AiProviderId}.
 * @public
 */
export const aiProviderId: Converter<AiProviderId> = Converters.enumeratedValue<AiProviderId>(allProviderIds);

// ============================================================================
// Server-Side Tool Converters
// ============================================================================

/**
 * All known server-side tool type values.
 * @internal
 */
const allServerToolTypes: ReadonlyArray<AiServerToolType> = ['web_search'];

/**
 * Converter for {@link AiServerToolType}.
 * @public
 */
export const aiServerToolType: Converter<AiServerToolType> =
  Converters.enumeratedValue<AiServerToolType>(allServerToolTypes);

/**
 * Converter for {@link IAiWebSearchToolConfig}.
 * @public
 */
export const aiWebSearchToolConfig: Converter<IAiWebSearchToolConfig> =
  Converters.strictObject<IAiWebSearchToolConfig>({
    type: Converters.enumeratedValue<'web_search'>(['web_search']),
    allowedDomains: Converters.arrayOf(Converters.string).optional(),
    blockedDomains: Converters.arrayOf(Converters.string).optional(),
    maxUses: Converters.number.optional(),
    enableImageUnderstanding: Converters.boolean.optional()
  });

/**
 * Converter for {@link AiServerToolConfig} (discriminated union on `type`).
 * @public
 */
export const aiServerToolConfig: Converter<AiServerToolConfig> =
  Converters.discriminatedObject<AiServerToolConfig>('type', {
    web_search: aiWebSearchToolConfig
  });

// ============================================================================
// Client-Defined Tool Converters
// ============================================================================

/**
 * Validator for the `parametersSchema` field of a client tool config.
 * Checks that the value is a non-null object exposing both `validate` and `toJson`
 * as callable functions — the runtime presence check for {@link JsonSchema.ISchemaValidator}.
 * Does not inspect the inner JSON Schema structure.
 * @internal
 */
const parametersSchemaValidator: Validator<JsonSchema.ISchemaValidator<unknown>> = Validators.isA<
  JsonSchema.ISchemaValidator<unknown>
>(
  'ISchemaValidator (must expose .validate() and .toJson())',
  (v): v is JsonSchema.ISchemaValidator<unknown> =>
    v !== null &&
    v !== undefined &&
    typeof v === 'object' &&
    typeof (v as Record<string, unknown>)['validate'] === 'function' &&
    typeof (v as Record<string, unknown>)['toJson'] === 'function'
);

/**
 * Converter for {@link IAiClientToolConfig}. Validates the wrapper shape: `type`,
 * `name`, `description`, and the presence of a usable `parametersSchema`.
 * Does not inspect the inner JSON Schema structure — `JsonSchema.object(...)` already
 * guarantees the schema is valid.
 * @public
 */
export const aiClientToolConfig: Converter<IAiClientToolConfig> = Converters.generic<IAiClientToolConfig>(
  (from: unknown) => {
    if (from === null || from === undefined || typeof from !== 'object') {
      return fail('expected object for IAiClientToolConfig');
    }
    const obj = from as Record<string, unknown>;
    if (obj['type'] !== 'client_tool') {
      return fail(`expected type 'client_tool', got ${String(obj['type'])}`);
    }
    if (typeof obj['name'] !== 'string' || obj['name'].length === 0) {
      return fail('IAiClientToolConfig: name must be a non-empty string');
    }
    if (typeof obj['description'] !== 'string') {
      return fail('IAiClientToolConfig: description must be a string');
    }
    const schemaResult = parametersSchemaValidator.validate(obj['parametersSchema']);
    if (schemaResult.isFailure()) {
      return fail(`IAiClientToolConfig: parametersSchema ${schemaResult.message}`);
    }
    return succeed({
      type: 'client_tool',
      name: obj['name'],
      description: obj['description'],
      parametersSchema: schemaResult.value
    } as IAiClientToolConfig);
  }
);

/**
 * Converter for {@link IAiToolEnablement}.
 * @public
 */
export const aiToolEnablement: Converter<IAiToolEnablement> = Converters.strictObject<IAiToolEnablement>({
  type: aiServerToolType,
  enabled: Converters.boolean,
  config: aiServerToolConfig.optional()
});

// ============================================================================
// Model Specification
// ============================================================================

/**
 * Converter for {@link ModelSpecKey}.
 * @public
 */
export const modelSpecKey: Converter<ModelSpecKey> =
  Converters.enumeratedValue<ModelSpecKey>(allModelSpecKeys);

/**
 * Recursive converter for {@link ModelSpec}.
 * Accepts a string or an object whose values are themselves ModelSpec values,
 * with keys constrained to known {@link ModelSpecKey} values.
 * Uses the `self` parameter from `Converters.generic` for recursion.
 * @public
 */
export const modelSpec: Converter<ModelSpec> = Converters.generic<ModelSpec>(
  (from: unknown, self: Converter<ModelSpec>) => {
    return Converters.oneOf<ModelSpec>([
      Converters.string,
      Converters.recordOf(self, { keyConverter: modelSpecKey })
    ])
      .withFormattedError(() => 'expected model spec (string or object with keys: base, tools, image)')
      .convert(from);
  }
);

// ============================================================================
// Provider Config & Settings
// ============================================================================

/**
 * Converter for {@link IAiAssistProviderConfig}.
 * @public
 */
export const aiAssistProviderConfig: Converter<IAiAssistProviderConfig> =
  Converters.strictObject<IAiAssistProviderConfig>({
    provider: aiProviderId,
    secretName: Converters.string.optional(),
    model: modelSpec.optional(),
    tools: Converters.arrayOf(aiToolEnablement).optional(),
    endpoint: Converters.string.optional()
  });

/**
 * Converter for {@link IAiAssistSettings}.
 * @public
 */
export const aiAssistSettings: Converter<IAiAssistSettings> = Converters.strictObject<IAiAssistSettings>({
  providers: Converters.arrayOf(aiAssistProviderConfig),
  defaultProvider: aiProviderId.optional(),
  proxyUrl: Converters.string.optional(),
  proxyAllProviders: Converters.boolean.optional()
});
