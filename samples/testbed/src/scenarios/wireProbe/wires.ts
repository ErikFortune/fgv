/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * The wires the probe covers, the model each is probed with, and how each one's **raw** request is
 * built: the fixture schema in that wire's position and dialect, with no keyword adaptation.
 *
 * @packageDocumentation
 */

import { AiAssist } from '@fgv/ts-extras';
import type { JsonObject, JsonSchema, JsonValue } from '@fgv/ts-json-base';

/**
 * One provider wire that carries a JSON Schema.
 * @public
 */
export interface IWireProbeWire {
  /** Stable id, accepted by `WIRE_PROBE_WIRES`. */
  readonly id: string;
  /** Report heading. */
  readonly label: string;
  readonly providerId: AiAssist.AiProviderId;
  /** A registry alias, resolved to a concrete id before anything is sent. */
  readonly model: string;
  /** Where the schema rides: a client tool's parameters, or structured output. */
  readonly kind: 'tools' | 'structured-output';
}

/**
 * The wires, with the model each is probed with.
 *
 * @remarks
 * The cheapest registered model on each line, with two exceptions that keep the probe honest
 * rather than cheap:
 * - **Anthropic tools** uses the base tier (`claude-sonnet-5`), not `@anthropic:haiku`: the
 *   registry marks haiku a non-tier alias whose retirement was due no sooner than 2026-10-15, and a
 *   retired model turns every row inconclusive.
 * - **Anthropic JSON outputs** uses `claude-opus-5-5`: `ai-assist` sends `output_config.format`
 *   only for the lines that reject forced tool use (opus-5-5, fable-5-1, mythos-5-1), and opus-5-5
 *   is the cheapest of them. Probing JSON outputs on a model `ai-assist` never sends them to would
 *   test a wire we do not use.
 *
 * Every request is one turn with a 16-token cap (OpenAI's Responses minimum), so a probe run costs
 * a few hundred short requests.
 * @public
 */
export const WIRE_PROBE_WIRES: ReadonlyArray<IWireProbeWire> = [
  {
    id: 'anthropic-tools',
    label: 'Anthropic tools',
    providerId: 'anthropic',
    model: '@anthropic:sonnet',
    kind: 'tools'
  },
  {
    id: 'anthropic-json-outputs',
    label: 'Anthropic JSON outputs',
    providerId: 'anthropic',
    model: '@anthropic:opus',
    kind: 'structured-output'
  },
  {
    id: 'openai-tools',
    label: 'OpenAI Responses tools',
    providerId: 'openai',
    model: '@openai:nano',
    kind: 'tools'
  },
  {
    id: 'openai-strict-output',
    label: 'OpenAI strict structured output',
    providerId: 'openai',
    model: '@openai:nano',
    kind: 'structured-output'
  },
  {
    id: 'gemini-tools',
    label: 'Gemini function declarations',
    providerId: 'google-gemini',
    model: '@google-gemini:flash-lite',
    kind: 'tools'
  },
  {
    id: 'gemini-response-schema',
    label: 'Gemini responseSchema',
    providerId: 'google-gemini',
    model: '@google-gemini:flash-lite',
    kind: 'structured-output'
  },
  {
    id: 'xai-tools',
    label: 'xAI Responses tools',
    providerId: 'xai-grok',
    model: '@xai-grok:standard',
    kind: 'tools'
  },
  {
    id: 'xai-strict-output',
    label: 'xAI strict structured output',
    providerId: 'xai-grok',
    model: '@xai-grok:standard',
    kind: 'structured-output'
  }
];

/**
 * The output cap on every raw request. 16 is the smallest OpenAI's Responses API accepts; a
 * rejection for the schema arrives before any token is generated, so the cap only bounds the cost
 * of an accepted request.
 * @public
 */
export const RAW_MAX_TOKENS: number = 16;

/**
 * The prompt. Irrelevant to what is measured, so it asks for as little as possible.
 * @public
 */
export const PROBE_PROMPT: string = 'Reply with the single character: x';

/** The probe tool's name and description. */
export const PROBE_TOOL_NAME: string = 'probe';
const PROBE_TOOL_DESCRIPTION: string = 'A probe tool. Do not call it.';

/**
 * Wire field names, as computed keys: the wire is snake_case and the lint profile rejects
 * snake_case object-literal property names (the house pattern from `xaiCacheProbe`).
 */
const WIRE_MAX_TOKENS: string = 'max_tokens';
const WIRE_MAX_COMPLETION_TOKENS: string = 'max_completion_tokens';
const WIRE_MAX_OUTPUT_TOKENS: string = 'max_output_tokens';
const WIRE_INPUT_SCHEMA: string = 'input_schema';
const WIRE_OUTPUT_CONFIG: string = 'output_config';
const WIRE_RESPONSE_FORMAT: string = 'response_format';
const WIRE_JSON_SCHEMA: string = 'json_schema';
const WIRE_FUNCTION_DECLARATIONS: string = 'function_declarations';
const WIRE_ANTHROPIC_VERSION: string = 'anthropic-version';
const WIRE_GOOGLE_KEY: string = 'x-goog-api-key';

/**
 * A raw request. `headers` carries the API key, so the probe logs only `url`.
 * @public
 */
export interface IRawRequest {
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: JsonObject;
}

/**
 * The keyword-capability table `ai-assist` adapts this wire's schema with — read from the library,
 * never restated here, so the probe always compares against what ships.
 * @returns The table, or `undefined` when the model declares no structured-output capability.
 * @public
 */
export function wireSchemaKeywords(
  wire: IWireProbeWire,
  descriptor: AiAssist.IAiProviderDescriptor,
  model: string
): JsonSchema.SchemaKeywordCapabilities | undefined {
  return wire.kind === 'tools'
    ? AiAssist.clientToolSchemaKeywords(descriptor, { model })
    : AiAssist.structuredOutputSchemaKeywords(descriptor, { model });
}

/**
 * Builds the raw request for `schema` on `wire`, mirroring the request `ai-assist` sends except
 * that the schema is not keyword-adapted.
 *
 * @remarks
 * Gemini's **dialect** is still translated (`toGeminiParameterSchema`): it rejects draft-07's
 * `additionalProperties`, which every fixture carries, so an untranslated schema would measure the
 * envelope and not the keyword. That translation leaves every constraint and annotation keyword as
 * written.
 * @public
 */
export function buildRawRequest(
  wire: IWireProbeWire,
  descriptor: AiAssist.IAiProviderDescriptor,
  model: string,
  apiKey: string,
  schema: JsonValue
): IRawRequest {
  switch (descriptor.apiFormat) {
    case 'anthropic':
      return {
        url: `${descriptor.baseUrl}/messages`,
        headers: { 'x-api-key': apiKey, [WIRE_ANTHROPIC_VERSION]: '2023-06-01' },
        body: {
          model,
          [WIRE_MAX_TOKENS]: RAW_MAX_TOKENS,
          messages: [{ role: 'user', content: PROBE_PROMPT }],
          ...(wire.kind === 'tools'
            ? {
                tools: [
                  { name: PROBE_TOOL_NAME, description: PROBE_TOOL_DESCRIPTION, [WIRE_INPUT_SCHEMA]: schema }
                ]
              }
            : { [WIRE_OUTPUT_CONFIG]: { format: { type: 'json_schema', schema } } })
        }
      };
    case 'gemini': {
      const geminiSchema = AiAssist.toGeminiParameterSchema(schema);
      return {
        url: `${descriptor.baseUrl}/models/${model}:generateContent`,
        headers: { [WIRE_GOOGLE_KEY]: apiKey },
        body: {
          contents: [{ role: 'user', parts: [{ text: PROBE_PROMPT }] }],
          ...(wire.kind === 'tools'
            ? {
                tools: [
                  {
                    [WIRE_FUNCTION_DECLARATIONS]: [
                      { name: PROBE_TOOL_NAME, description: PROBE_TOOL_DESCRIPTION, parameters: geminiSchema }
                    ]
                  }
                ],
                generationConfig: { maxOutputTokens: RAW_MAX_TOKENS }
              }
            : {
                generationConfig: {
                  maxOutputTokens: RAW_MAX_TOKENS,
                  responseMimeType: 'application/json',
                  responseSchema: geminiSchema
                }
              })
        }
      };
    }
    case 'openai':
      // Tools ride the Responses API and structured output Chat Completions, as `ai-assist` routes
      // a request that carries no server tools on a model that is not Responses-only.
      return wire.kind === 'tools'
        ? {
            url: `${descriptor.baseUrl}/responses`,
            headers: { authorization: `Bearer ${apiKey}` },
            body: {
              model,
              [WIRE_MAX_OUTPUT_TOKENS]: RAW_MAX_TOKENS,
              input: PROBE_PROMPT,
              tools: [
                {
                  type: 'function',
                  name: PROBE_TOOL_NAME,
                  description: PROBE_TOOL_DESCRIPTION,
                  parameters: schema
                }
              ]
            }
          }
        : {
            url: `${descriptor.baseUrl}/chat/completions`,
            headers: { authorization: `Bearer ${apiKey}` },
            body: {
              model,
              [AiAssist.usesMaxCompletionTokensField(descriptor)
                ? WIRE_MAX_COMPLETION_TOKENS
                : WIRE_MAX_TOKENS]: RAW_MAX_TOKENS,
              messages: [{ role: 'user', content: PROBE_PROMPT }],
              [WIRE_RESPONSE_FORMAT]: {
                type: 'json_schema',
                [WIRE_JSON_SCHEMA]: { name: 'response', strict: true, schema }
              }
            }
          };
  }
}
