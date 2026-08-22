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
 * Structured-output types: the capability a provider declares, the request a
 * caller makes, and the enforcement the response reports.
 *
 * @remarks
 * Their own module rather than part of `model.ts` because they depend on nothing
 * there — `model.ts` imports them, not the reverse — and because `model.ts` was
 * at the `max-lines` cap. A dependency-free cut is one of the few available at a
 * moment like that which is not chosen under pressure.
 * @packageDocumentation
 */

import { type JsonSchema } from '@fgv/ts-json-base';

// ============================================================================
// Structured output — capability
// ============================================================================

/**
 * Wire format a provider uses to express a structured-output constraint.
 *
 * @remarks
 * Four shapes, not one, and they differ in more than field names: the OpenAI
 * pair carry the schema in the request body, Gemini carries it inside
 * `generationConfig`, and Anthropic has no response-format field at all —
 * its mechanism is forced tool use, which is why `'tool-forced'` is a distinct
 * {@link AiAssist.StructuredOutputEnforcement} value rather than a spelling of
 * `'schema'`.
 * @public
 */
export type AiStructuredOutputFormat =
  | 'openai-json-schema'
  | 'openai-responses-format'
  | 'gemini-response-schema'
  | 'anthropic-tool-forced';

/**
 * Structured-output capability for a model family within a provider. Used as an
 * entry in {@link IAiProviderDescriptor.structuredOutput}.
 *
 * @remarks
 * Deliberately thinner than its `imageGeneration` / `embedding` siblings: it
 * carries no `supportsX` flags, because what each format can enforce is a
 * property of the provider's **API surface** rather than of any one model, and a
 * per-entry declaration of it could only ever disagree with the one in code.
 * @public
 */
export interface IAiStructuredOutputCapability {
  /**
   * Prefix matched against the resolved completion model id. The empty string is
   * the catch-all and matches every model. When multiple rules' prefixes match a
   * model id, the longest prefix wins; ties are broken by first-encountered.
   */
  readonly modelPrefix: string;
  /** Wire format used to express the constraint for matching models. */
  readonly format: AiStructuredOutputFormat;
}

/**
 * Which constraint the provider was **asked** to apply to this response.
 *
 * @remarks
 * Three questions hide inside *"did it honour my schema"*, and they have different
 * owners:
 *
 * | question | answerable by |
 * |---|---|
 * | did we send a constraint? | this client, at request-build time |
 * | which constraint did the provider apply? | this client, from the resolved model's capability |
 * | does *this response* conform to my shape? | the caller's converter, and nothing else |
 *
 * This type answers the first two and deliberately not the third. Reporting
 * conformance would mean re-validating against the caller's own schema to
 * re-derive an answer the caller already holds.
 *
 * - `'none'` — nothing was sent; the resolved model declares no capability.
 * - `'json-mode'` — syntactically valid JSON is guaranteed; the shape is not.
 * - `'schema'` — generation was constrained to the supplied schema.
 * - `'tool-forced'` — Anthropic-style forced tool use; the shape comes from the
 *   forced tool's input schema, and `content` is the re-serialized tool input.
 * @public
 */
export type StructuredOutputEnforcement = 'none' | 'json-mode' | 'schema' | 'tool-forced';

/**
 * What to do when the resolved model cannot apply the requested constraint.
 *
 * @remarks
 * `'degrade'` is the default, and it is only safe **because
 * {@link IAiCompletionResponse.structuredOutput} is required** rather than
 * optional. Degrade-and-tell-me is safe; degrade-silently is the failure this
 * whole surface exists to remove — so the two decisions are one decision, not
 * two independent ones.
 *
 * Reach for `'fail'` when the output is persisted or put on a wire, where an
 * unconstrained generation that happens to parse is worse than an error because
 * it is wrong quietly. Leave it at `'degrade'` on paths that are *designed* to
 * degrade — an extractor that may return nothing, a segmenter that floors to a
 * mechanical chunker — where a hard failure would make this library less safe
 * than the code it replaces.
 * @public
 */
export type StructuredOutputFallback = 'degrade' | 'fail';

/**
 * Ask the provider for JSON constrained to a schema.
 * @public
 */
export interface ISchemaStructuredOutputRequest {
  readonly mode: 'schema';
  /**
   * The schema to constrain generation to — **the same object you validate the
   * reply with**, so the wire schema and the check cannot drift.
   *
   * @remarks
   * Author it with `JsonSchema.object({...})` from `@fgv/ts-json-base`. This is
   * the property `@fgv/ts-extras-ollama`'s `chatStructured` already has; this
   * surface is its cloud sibling.
   */
  readonly schema: JsonSchema.ISchemaValidator<unknown>;
  readonly onUnsupported?: StructuredOutputFallback;
}

/**
 * Ask the provider for syntactically valid JSON of arbitrary shape.
 *
 * @remarks
 * The weaker floor, and worth having on its own: the failure that motivated this
 * surface (`Expected ',' or '}' after property value` — an unescaped quote closing
 * a string early) is **syntactic**, so a JSON-mode guarantee removes it. Schema
 * constraint is what additionally buys shape. It is also the only mode some
 * model/provider pairs support.
 * @public
 */
export interface IJsonObjectStructuredOutputRequest {
  readonly mode: 'json-object';
  readonly onUnsupported?: StructuredOutputFallback;
}

/**
 * A caller's structured-output intent.
 *
 * @remarks
 * A discriminated union rather than an optional `schema` whose absence means
 * *"json-object please"* — an absence that means something is the shape this repo
 * has been burned by (see `MemoryEmbedOutcome` in `@fgv/ts-agent-memory`, which
 * exists because a three-ways-ambiguous absence could not be read).
 *
 * **The caller supplies intent; the response reports outcome.** A request never
 * needs to know whether the constraint will be honoured, because
 * `resolveProviderModel` resolves aliases and tiers at *call* time — a `tier`
 * request can cascade — so the concrete model that will serve a request is not
 * knowable to the caller up front. Requiring it to know would be unsound, which
 * is why the report rides on the response rather than being a lookup.
 * @public
 */
export type StructuredOutputRequest = ISchemaStructuredOutputRequest | IJsonObjectStructuredOutputRequest;
