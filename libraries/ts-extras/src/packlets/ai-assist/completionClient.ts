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
 * Chat completion clients for AI assist. One provider dispatcher over
 * `IAiProviderDescriptor.apiFormat`, the four adapters it routes to (OpenAI Chat
 * Completions, OpenAI/xAI Responses, Anthropic, Google Gemini), the response
 * validators those adapters use, and the proxied variant of the same modality.
 *
 * @packageDocumentation
 */

import { type JsonObject } from '@fgv/ts-json-base';
import {
  captureResult,
  fail,
  type Logging,
  Result,
  succeed,
  type Validator,
  Validators
} from '@fgv/ts-utils';

import {
  AiPrompt,
  type AiServerToolConfig,
  DEFAULT_ANTHROPIC_MAX_TOKENS,
  type IAiCompletionResponse,
  type IAiProviderDescriptor,
  type IChatMessage,
  type IChatRequest,
  type IThinkingConfig,
  type ModelSpec,
  type ModelSpecKey,
  isAdaptiveThinkingModel,
  isResponsesOnlyModel,
  resolveProviderModel,
  usesMaxCompletionTokensField
} from './model';
import {
  anthropicEffortToBudgetTokens,
  checkTemperatureConflict,
  mergeThinkingConfig,
  providerDiscriminatorForId,
  type IResolvedThinkingConfig
} from './thinkingOptionsResolver';
import {
  buildAnthropicMessages,
  buildGeminiContents,
  buildMessages,
  buildOpenAiChatUserContent,
  buildOpenAiResponsesUserContent,
  normalizeOutboundMessages,
  splitChatRequest
} from './chatRequestBuilders';
import {
  anthropicAuthHeaders,
  bearerAuthHeader,
  geminiAuthHeader,
  resolveEffectiveBaseUrl
} from './endpoint';
import { type IAiApiConfig, fetchJson } from './http';
import { toAnthropicTools, toGeminiTools, toResponsesApiTools } from './toolFormats';
import {
  ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME,
  type IResolvedStructuredOutput,
  NO_STRUCTURED_OUTPUT,
  isStructuredOutputEnforcement,
  resolveStructuredOutput
} from './structuredOutput';
import { resolveStructuredOutputCapability } from './registry';
import type { StructuredOutputRequest } from './structuredOutputTypes';

// ============================================================================
// Types
// ============================================================================

/**
 * Parameters for a provider completion request. Carries the unified
 * {@link AiAssist.IChatRequest} shape (`system?` + ordered `messages`, last =
 * current user turn); history is linearized before the current turn.
 * @public
 */
export interface IProviderCompletionParams extends IChatRequest {
  /** The provider descriptor */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication */
  readonly apiKey: string;
  /**
   * Sampling temperature. Sent to the provider only when explicitly provided; omitted otherwise
   * so the provider's own default applies (current-gen models reject a caller-supplied default).
   */
  readonly temperature?: number;
  /** Optional model override — string or context-aware map (uses descriptor.defaultModel otherwise) */
  readonly modelOverride?: ModelSpec;
  /**
   * Optional quality tier selecting which completion model to use. `undefined`
   * selects the `base` tier; `'frontier'` cascades to `advanced` then `base`
   * when a tier is unset for a provider. Orthogonal to `thinking` and `tools`,
   * which never select a model.
   */
  readonly tier?: 'advanced' | 'frontier';
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
  /** Server-side tools to include in the request. Overrides settings-level tool config when provided. */
  readonly tools?: ReadonlyArray<AiServerToolConfig>;
  /** Optional abort signal for cancelling the in-flight request. */
  readonly signal?: AbortSignal;
  /**
   * Optional override of the descriptor's default base URL (scheme + host +
   * optional port + path prefix). The per-route suffix (e.g. `/chat/completions`)
   * is appended unchanged. Must be a well-formed `http`/`https` URL. Auth shape
   * is unchanged: `needsSecret` providers still require an API key.
   */
  readonly endpoint?: string;
  /**
   * Optional thinking/reasoning config. Anthropic, OpenAI, and xAI reject `temperature` when
   * the effective merged effort is non-`'none'`; Gemini always accepts both.
   */
  readonly thinking?: IThinkingConfig;
  /**
   * Optional cap on generated output tokens, mapped to each provider's native field:
   * Anthropic `max_tokens`, OpenAI Chat Completions `max_completion_tokens`, OpenAI/xAI
   * Responses `max_output_tokens`, Gemini `generationConfig.maxOutputTokens`, and the
   * xAI/Groq/Mistral/Ollama/`openai-compat` chat-completions path `max_tokens`. When unset,
   * every provider except Anthropic omits the field and applies its own default; Anthropic's
   * Messages API requires the field, so it falls back to `DEFAULT_ANTHROPIC_MAX_TOKENS`.
   */
  readonly maxTokens?: number;
  /**
   * Ask the provider to constrain its output — to a schema, or to syntactically
   * valid JSON of arbitrary shape.
   *
   * @remarks
   * **The caller supplies intent; the response reports outcome.** A caller cannot
   * know up front which concrete model will serve the request (a `tier` request
   * cascades, and aliases resolve at call time), so it never has to: whatever was
   * actually enforced comes back on
   * {@link AiAssist.IAiCompletionResponse.structuredOutput}.
   */
  readonly structuredOutput?: StructuredOutputRequest;
}

// ============================================================================
// Response validators (non-strict — extra API fields preserved for debugging)
// ============================================================================

// ---- OpenAI Chat Completions format ----

/** @internal */
interface IOpenAiMessage {
  content: string;
}
/** @internal */
interface IOpenAiChoice {
  message: IOpenAiMessage;
  finish_reason: string;
}
/** @internal */
interface IOpenAiResponse {
  choices: IOpenAiChoice[];
}

const openAiMessage: Validator<IOpenAiMessage> = Validators.object<IOpenAiMessage>({
  content: Validators.string
});
const openAiChoice: Validator<IOpenAiChoice> = Validators.object<IOpenAiChoice>({
  message: openAiMessage,
  finish_reason: Validators.string
});
const openAiResponse: Validator<IOpenAiResponse> = Validators.object<IOpenAiResponse>({
  choices: Validators.arrayOf(openAiChoice).withConstraint((arr) => arr.length > 0)
});

// ---- OpenAI/xAI Responses API format ----

/** @internal */
interface IResponsesApiOutputText {
  type: 'output_text';
  text: string;
}
/** @internal */
interface IResponsesApiMessage {
  type: 'message';
  role: string;
  content: IResponsesApiOutputText[];
}
/** @internal */
interface IResponsesApiResponse {
  output: Array<Record<string, unknown>>;
  status: string;
}

const responsesApiOutputText: Validator<IResponsesApiOutputText> = Validators.object<IResponsesApiOutputText>(
  {
    type: Validators.literal('output_text'),
    text: Validators.string
  }
);
const responsesApiMessage: Validator<IResponsesApiMessage> = Validators.object<IResponsesApiMessage>({
  type: Validators.literal('message'),
  role: Validators.string,
  content: Validators.arrayOf(responsesApiOutputText).withConstraint((arr) => arr.length > 0)
});
const responsesApiOutputItem: Validator<Record<string, unknown>> = Validators.isA(
  'object',
  (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
);
const responsesApiResponse: Validator<IResponsesApiResponse> = Validators.object<IResponsesApiResponse>({
  output: Validators.arrayOf(responsesApiOutputItem).withConstraint((arr) => arr.length > 0),
  status: Validators.string
});

// ---- Gemini format ----

/** @internal */
interface IGeminiPart {
  text: string;
}
/** @internal */
interface IGeminiContent {
  parts: IGeminiPart[];
}
/** @internal */
interface IGeminiCandidate {
  content: IGeminiContent;
  finishReason: string;
}
/** @internal */
interface IGeminiResponse {
  candidates: IGeminiCandidate[];
}

const geminiPart: Validator<IGeminiPart> = Validators.object<IGeminiPart>({
  text: Validators.string
});
const geminiContent: Validator<IGeminiContent> = Validators.object<IGeminiContent>({
  parts: Validators.arrayOf(geminiPart).withConstraint((arr) => arr.length > 0)
});
const geminiCandidate: Validator<IGeminiCandidate> = Validators.object<IGeminiCandidate>({
  content: geminiContent,
  finishReason: Validators.string
});
const geminiResponse: Validator<IGeminiResponse> = Validators.object<IGeminiResponse>({
  candidates: Validators.arrayOf(geminiCandidate).withConstraint((arr) => arr.length > 0)
});

// ============================================================================
// OpenAI-compatible client (Chat Completions — no tools)
// ============================================================================

/**
 * Calls an OpenAI-compatible chat completion endpoint.
 * Works for xAI Grok, OpenAI, Groq, and Mistral.
 * @internal
 */
async function callOpenAiCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  head?: ReadonlyArray<IChatMessage>,
  temperature?: number,
  logger?: Logging.ILogger,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig,
  maxTokens?: number,
  useMaxCompletionTokensField: boolean = false,
  structured: IResolvedStructuredOutput = NO_STRUCTURED_OUTPUT
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/chat/completions`;
  const messages = buildMessages(prompt.system, buildOpenAiChatUserContent(prompt), {
    head
  });
  const effort = resolvedThinking?.openAiEffort ?? resolvedThinking?.xaiEffort;
  const maxTokensField = useMaxCompletionTokensField ? 'max_completion_tokens' : 'max_tokens';
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    // Temperature is sent only when the caller explicitly provided one — omitting it lets each
    // provider apply its own default (current-gen models reject a non-default temperature). The
    // completion path already rejects temperature + non-'none' thinking upstream
    // (checkTemperatureConflict), so no effort gate is needed here.
    ...(temperature !== undefined ? { temperature } : {}),
    ...(effort !== undefined && config.model !== 'grok-4' ? { reasoning_effort: effort } : {}),
    // Omitted when the caller doesn't set maxTokens — every non-Anthropic provider applies its
    // own default. See AiAssist.usesMaxCompletionTokensField for the field-name split.
    ...(maxTokens !== undefined ? { [maxTokensField]: maxTokens } : {})
  };
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(body, resolvedThinking.otherParams);
  }
  Object.assign(body, structured.wire);

  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);

  /* c8 ignore next 1 - optional logger */
  logger?.info(`OpenAI completion: model=${config.model}`);
  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return openAiResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `OpenAI API response: ${msg}`)
    .onSuccess((response) => {
      const choice = response.choices[0];
      return succeed({
        content: choice.message.content,
        truncated: choice.finish_reason === 'length',
        structuredOutput: structured.enforcement
      });
    });
}

// ============================================================================
// OpenAI/xAI Responses API (with tools)
// ============================================================================

/**
 * Extracts text content from a Responses API output array.
 * Finds the first message-type output item and concatenates its text content blocks.
 * @internal
 */
function extractResponsesApiText(output: Array<Record<string, unknown>>): Result<string> {
  for (const item of output) {
    if (item.type === 'message') {
      const messageResult = responsesApiMessage.validate(item as JsonObject);
      if (messageResult.isSuccess()) {
        return succeed(messageResult.value.content.map((c) => c.text).join(''));
      }
    }
  }
  return fail('Responses API output contained no message with text content');
}

/**
 * Calls the xAI/OpenAI Responses API with server-side tools.
 * Used when tools are configured for an openai-format provider.
 * @internal
 */
async function callOpenAiResponsesCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  tools: ReadonlyArray<AiServerToolConfig> = [],
  head?: ReadonlyArray<IChatMessage>,
  temperature?: number,
  logger?: Logging.ILogger,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig,
  maxTokens?: number,
  structured: IResolvedStructuredOutput = NO_STRUCTURED_OUTPUT
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/responses`;
  const input = buildMessages(prompt.system, buildOpenAiResponsesUserContent(prompt), {
    head
  });
  const effort = resolvedThinking?.openAiEffort ?? resolvedThinking?.xaiEffort;
  const body: Record<string, unknown> = {
    model: config.model,
    input,
    // `tools` is omitted entirely when none are requested — a Responses-only model routed
    // here for tier/model reasons (not tools) must not send an empty tools array.
    ...(tools.length > 0 ? { tools: toResponsesApiTools(tools) } : {}),
    // Temperature is sent only when the caller explicitly provided one (see callOpenAiCompletion).
    ...(temperature !== undefined ? { temperature } : {}),
    ...(effort !== undefined && config.model !== 'grok-4' ? { reasoning: { effort } } : {})
  };
  // Shared by OpenAI and xAI — both route through the Responses API with the same field name.
  if (maxTokens !== undefined) {
    body.max_output_tokens = maxTokens;
  }
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(body, resolvedThinking.otherParams);
  }
  Object.assign(body, structured.wire);

  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);

  /* c8 ignore next 1 - optional logger */
  logger?.info(`OpenAI Responses API: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`);
  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return responsesApiResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Responses API response: ${msg}`)
    .onSuccess((response) => {
      return extractResponsesApiText(response.output).onSuccess((text) =>
        succeed({
          content: text,
          truncated: response.status === 'incomplete',
          structuredOutput: structured.enforcement
        })
      );
    });
}

// ============================================================================
// Anthropic adapter
// ============================================================================

/**
 * Extracts text content from Anthropic response content blocks.
 * When tools are used, the content array contains mixed block types
 * (text, server_tool_use, web_search_tool_result). We extract and
 * concatenate only the text blocks.
 * @internal
 */
function extractAnthropicText(content: unknown[]): Result<string> {
  const textParts: string[] = [];
  for (const block of content) {
    if (typeof block === 'object' && block !== null && 'type' in block) {
      const typed = block as Record<string, unknown>;
      if (typed.type === 'text' && typeof typed.text === 'string') {
        textParts.push(typed.text);
      }
    }
  }
  if (textParts.length === 0) {
    return fail('Anthropic response contained no text content blocks');
  }
  return succeed(textParts.join(''));
}

/**
 * Extracts the forced structured-output tool's input from Anthropic response
 * content blocks and re-serializes it.
 *
 * @remarks
 * Under `'tool-forced'` enforcement the model's answer arrives as a `tool_use`
 * block's `input` — a parsed object — rather than as text. Re-serializing it here
 * keeps `IAiCompletionResponse.content` a JSON **string** on every provider, so a
 * caller's converter is written once and does not branch on which enforcement it
 * got. A useful side effect: the string is produced by `JSON.stringify` rather
 * than by the model, so under this enforcement it is syntactically valid by
 * construction.
 * @internal
 */
function extractAnthropicStructuredOutput(content: unknown[]): Result<string> {
  for (const block of content) {
    if (typeof block === 'object' && block !== null && 'type' in block) {
      const typed = block as Record<string, unknown>;
      if (typed.type === 'tool_use' && typed.name === ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME) {
        return captureResult(() => JSON.stringify(typed.input)).withErrorFormat(
          (msg) => `Anthropic API response: structured output could not be serialized: ${msg}`
        );
      }
    }
  }
  // Loud rather than a silent fall back to text: we forced the tool, so its
  // absence means the request did not do what the response is about to claim it
  // did — and `structuredOutput: 'tool-forced'` would then be a lie.
  return fail(
    `Anthropic API response: structured output was forced but no '${ANTHROPIC_STRUCTURED_OUTPUT_TOOL_NAME}' tool_use block was returned`
  );
}

/** Calls the Anthropic Messages API with optional tool support. @internal */
async function callAnthropicCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  head?: ReadonlyArray<IChatMessage>,
  temperature?: number,
  logger?: Logging.ILogger,
  tools?: ReadonlyArray<AiServerToolConfig>,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig,
  useAdaptiveThinking: boolean = false,
  maxTokens?: number,
  structured: IResolvedStructuredOutput = NO_STRUCTURED_OUTPUT
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/messages`;
  const messages = buildAnthropicMessages(prompt, { head });
  const body: Record<string, unknown> = {
    model: config.model,
    system: prompt.system,
    messages,
    // Anthropic's Messages API requires max_tokens on every request — see
    // AiAssist.DEFAULT_ANTHROPIC_MAX_TOKENS for why only this provider defaults it.
    max_tokens: maxTokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS,
    // Temperature is sent only when explicitly provided (Claude-5 rejects any temperature). The
    // completion path rejects temperature + thinking upstream (checkTemperatureConflict), so no
    // effort gate is needed here.
    ...(temperature !== undefined ? { temperature } : {})
  };

  const effort = resolvedThinking?.anthropicEffort;
  if (effort !== undefined) {
    if (useAdaptiveThinking) {
      // Claude 5 family: adaptive thinking — no budget_tokens; effort moves to the
      // top-level output_config block. See AiAssist.isAdaptiveThinkingModel.
      body.thinking = { type: 'adaptive' };
      body.output_config = { effort };
    } else {
      body.thinking = { type: 'enabled', budget_tokens: anthropicEffortToBudgetTokens(effort) };
    }
  }
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(body, resolvedThinking.otherParams);
  }

  // The structured-output wire carries `tools` + `tool_choice` of its own, and
  // resolveStructuredOutput already refused the combination with server tools, so
  // the two assignments below can never both run.
  Object.assign(body, structured.wire);

  if (tools && tools.length > 0) {
    body.tools = toAnthropicTools(tools);
    /* c8 ignore next 3 - optional logger diagnostic output */
    logger?.info(`Anthropic completion: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`);
  } else {
    /* c8 ignore next 1 - optional logger */
    logger?.info(`Anthropic completion: model=${config.model}`);
  }

  const headers: Record<string, string> = anthropicAuthHeaders(config.apiKey);

  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const rawContent = (jsonResult.value as Record<string, unknown>).content;
  const stopReason = (jsonResult.value as Record<string, unknown>).stop_reason;
  if (!Array.isArray(rawContent)) {
    return fail('Anthropic API response: content is not an array');
  }
  if (typeof stopReason !== 'string') {
    return fail('Anthropic API response: stop_reason is missing or not a string');
  }
  const extracted =
    structured.enforcement === 'tool-forced'
      ? extractAnthropicStructuredOutput(rawContent)
      : extractAnthropicText(rawContent);
  return extracted.onSuccess((text) =>
    succeed({
      content: text,
      truncated: stopReason === 'max_tokens',
      structuredOutput: structured.enforcement
    })
  );
}

// ============================================================================
// Google Gemini adapter
// ============================================================================

/**
 * Calls the Google Gemini generateContent API.
 * When tools are configured, includes Google Search grounding.
 * @internal
 */
async function callGeminiCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  head?: ReadonlyArray<IChatMessage>,
  temperature?: number,
  logger?: Logging.ILogger,
  tools?: ReadonlyArray<AiServerToolConfig>,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig,
  maxTokens?: number,
  structured: IResolvedStructuredOutput = NO_STRUCTURED_OUTPUT
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/models/${config.model}:generateContent`;
  const contents = buildGeminiContents(prompt, { head });

  // Temperature is sent only when explicitly provided; otherwise Gemini's default applies.
  const generationConfig: Record<string, unknown> = {};
  if (temperature !== undefined) {
    generationConfig.temperature = temperature;
  }
  if (maxTokens !== undefined) {
    generationConfig.maxOutputTokens = maxTokens;
  }
  if (resolvedThinking?.geminiThinkingBudget !== undefined) {
    generationConfig.thinkingConfig = { thinkingBudget: resolvedThinking.geminiThinkingBudget };
  }
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(generationConfig, resolvedThinking.otherParams);
  }
  // Gemini nests the constraint INSIDE generationConfig, not on the body.
  Object.assign(generationConfig, structured.wire);
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: prompt.system }] },
    contents,
    generationConfig
  };

  if (tools && tools.length > 0) {
    body.tools = toGeminiTools(tools);
    /* c8 ignore next 1 - optional logger */
    logger?.info(`Gemini completion: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`);
  } else {
    /* c8 ignore next 1 - optional logger */
    logger?.info(`Gemini completion: model=${config.model}`);
  }

  const headers: Record<string, string> = geminiAuthHeader(config.apiKey);

  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return geminiResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Gemini API response: ${msg}`)
    .onSuccess((response) => {
      const candidate = response.candidates[0];
      return succeed({
        content: candidate.content.parts[0].text,
        truncated: candidate.finishReason === 'MAX_TOKENS',
        structuredOutput: structured.enforcement
      });
    });
}

// ============================================================================
// Provider dispatcher
// ============================================================================

/**
 * Calls the appropriate chat completion API for a given provider. Routes by
 * `apiFormat`: `'openai'` (xAI/OpenAI/Groq/Mistral — switches to Responses API
 * when tools are set), `'anthropic'`, or `'gemini'`.
 * @public
 */
export async function callProviderCompletion(
  params: IProviderCompletionParams
): Promise<Result<IAiCompletionResponse>> {
  const {
    descriptor,
    apiKey,
    system,
    messages,
    temperature,
    modelOverride,
    tier,
    logger,
    tools,
    signal,
    endpoint,
    thinking,
    maxTokens,
    structuredOutput
  } = params;

  const splitResult = splitChatRequest(system, messages);
  if (splitResult.isFailure()) {
    return fail(splitResult.message);
  }
  const { prompt, head } = splitResult.value;

  const baseUrlResult = resolveEffectiveBaseUrl(descriptor, endpoint);
  if (baseUrlResult.isFailure()) {
    return fail(baseUrlResult.message);
  }
  if (prompt.attachments.length > 0 && !descriptor.acceptsImageInput) {
    return fail(`provider "${descriptor.id}" does not accept image input`);
  }

  const hasTools = tools !== undefined && tools.length > 0;
  const discriminator = providerDiscriminatorForId(descriptor.id);
  // The quality tier is the only completion-model selector; thinking and tools
  // are orthogonal request params/capabilities and never pick a model.
  const modelContext: ModelSpecKey | undefined = tier;

  const modelResult = resolveProviderModel(descriptor, modelOverride, modelContext);
  if (modelResult.isFailure()) {
    return fail(modelResult.message);
  }
  const model = modelResult.value;

  let resolvedThinking: IResolvedThinkingConfig | undefined;
  if (thinking !== undefined) {
    if (discriminator !== undefined) {
      const mergeResult = mergeThinkingConfig(thinking, model, discriminator);
      /* c8 ignore next 3 - mergeThinkingConfig always succeeds; defensive guard */
      if (mergeResult.isFailure()) {
        return fail(mergeResult.message);
      }
      resolvedThinking = mergeResult.value;
      const conflictResult = checkTemperatureConflict(resolvedThinking, discriminator, temperature);
      if (conflictResult.isFailure()) {
        return fail(conflictResult.message);
      }
    }
  }

  // Resolved against the CONCRETE model, after resolveProviderModel — passing an
  // alias here is the defect resolveImageCapability once had.
  // The OpenAI route depends on tools AND the model, so it is computed here (once,
  // beside the switch that uses it) and handed to the resolver — a capability keyed
  // on the model alone cannot know which of the two OpenAI wire shapes applies.
  const usesResponsesApi: boolean =
    descriptor.apiFormat === 'openai' && (hasTools || isResponsesOnlyModel(descriptor, model));
  const structuredResult = resolveStructuredOutput(
    descriptor,
    model,
    structuredOutput,
    tools,
    usesResponsesApi,
    resolveStructuredOutputCapability
  );
  if (structuredResult.isFailure()) {
    return fail(structuredResult.message);
  }
  const resolvedStructured = structuredResult.value;

  const config: IAiApiConfig = {
    baseUrl: baseUrlResult.value,
    apiKey,
    model
  };
  /* c8 ignore next 8 - optional logger diagnostic output */
  if (logger) {
    const toolTypes = hasTools ? tools.map((t) => t.type).join(',') : 'none';
    const supported = descriptor.supportedTools.length > 0 ? descriptor.supportedTools.join(',') : 'none';
    logger.info(
      `AI completion: provider=${descriptor.id}, format=${descriptor.apiFormat}, model=${config.model}, ` +
        `tools=${toolTypes}, supported=${supported}`
    );
  }

  switch (descriptor.apiFormat) {
    case 'openai':
      // Responses-API-only models (e.g. gpt-5.5-pro) 400 on /chat/completions, so they route
      // to the Responses path even with no tools requested — same path the tools case uses.
      if (usesResponsesApi) {
        return callOpenAiResponsesCompletion(
          config,
          prompt,
          tools,
          head,
          temperature,
          logger,
          signal,
          resolvedThinking,
          maxTokens,
          resolvedStructured
        );
      }
      return callOpenAiCompletion(
        config,
        prompt,
        head,
        temperature,
        logger,
        signal,
        resolvedThinking,
        maxTokens,
        usesMaxCompletionTokensField(descriptor),
        resolvedStructured
      );
    case 'anthropic':
      return callAnthropicCompletion(
        config,
        prompt,
        head,
        temperature,
        logger,
        tools,
        signal,
        resolvedThinking,
        isAdaptiveThinkingModel(descriptor, config.model),
        maxTokens,
        resolvedStructured
      );
    case 'gemini':
      return callGeminiCompletion(
        config,
        prompt,
        head,
        temperature,
        logger,
        tools,
        signal,
        resolvedThinking,
        maxTokens,
        resolvedStructured
      );
    /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = descriptor.apiFormat;
      return fail(`unsupported API format: ${String(_exhaustive)}`);
    }
  }
}

// ============================================================================
// Proxied completion (routes through a backend server)
// ============================================================================

/**
 * Calls the AI completion endpoint on a proxy server instead of calling the
 * provider API directly from the browser. The proxy handles provider dispatch,
 * CORS, and API key forwarding. The request body serializes the unified
 * {@link AiAssist.IChatRequest} shape (`system?` + `messages`). Enforces the same
 * non-empty / trailing-user-turn and image-input invariants as the direct path.
 * @param proxyUrl - Base URL of the proxy server
 * @param params - Same parameters as {@link callProviderCompletion}
 * @public
 */
export async function callProxiedCompletion(
  proxyUrl: string,
  params: IProviderCompletionParams
): Promise<Result<IAiCompletionResponse>> {
  const {
    descriptor,
    apiKey,
    system,
    messages,
    temperature,
    modelOverride,
    logger,
    tools,
    signal,
    thinking,
    maxTokens,
    structuredOutput
  } = params;

  const splitResult = splitChatRequest(system, messages);
  if (splitResult.isFailure()) {
    return fail(splitResult.message);
  }
  if (splitResult.value.prompt.attachments.length > 0 && !descriptor.acceptsImageInput) {
    return fail(`provider "${descriptor.id}" does not accept image input`);
  }

  const body: Record<string, unknown> = {
    providerId: descriptor.id,
    apiKey,
    messages: normalizeOutboundMessages(splitResult.value)
  };
  // Temperature is forwarded only when explicitly provided, matching the direct path — the proxy
  // omits it from the upstream request so the provider default applies.
  if (temperature !== undefined) {
    body.temperature = temperature;
  }
  if (system !== undefined) {
    body.system = system;
  }
  if (modelOverride !== undefined) {
    body.modelOverride = modelOverride;
  }
  if (tools && tools.length > 0) {
    body.tools = tools;
  }
  if (thinking !== undefined) {
    body.thinking = thinking;
  }
  // Forwarded only when explicitly provided; the proxy is responsible for mapping it to the
  // correct upstream provider field (see AiAssist.usesMaxCompletionTokensField).
  if (maxTokens !== undefined) {
    body.maxTokens = maxTokens;
  }
  if (structuredOutput !== undefined) {
    // The schema travels as its draft-07 wire form, not as the validator object —
    // an `ISchemaValidator` is not JSON-serializable. A proxy reconstitutes it with
    // `JsonSchema.fromJson(raw)` before calling `callProviderCompletion`.
    body.structuredOutput =
      structuredOutput.mode === 'schema'
        ? {
            mode: 'schema',
            schema: structuredOutput.schema.toJson(),
            ...(structuredOutput.onUnsupported !== undefined
              ? { onUnsupported: structuredOutput.onUnsupported }
              : {})
          }
        : {
            mode: 'json-object',
            ...(structuredOutput.onUnsupported !== undefined
              ? { onUnsupported: structuredOutput.onUnsupported }
              : {})
          };
  }

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);
  const url = `${proxyUrl}/api/ai/completion`;
  const jsonResult = await fetchJson(url, {}, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const response = jsonResult.value as Record<string, unknown>;
  if (typeof response.error === 'string') {
    return fail(`proxy: ${response.error}`);
  }

  if (typeof response.content !== 'string') {
    return fail('proxy returned invalid response: missing content');
  }

  // A caller who asked for nothing gets `'none'` without the proxy having to say
  // so. A caller who DID ask gets a loud failure when the proxy cannot report,
  // rather than a response claiming an enforcement nobody verified — a proxy
  // predating this feature drops the constraint silently, which is the exact
  // failure this surface exists to remove.
  if (structuredOutput === undefined) {
    return succeed({
      content: response.content,
      truncated: response.truncated === true,
      structuredOutput: 'none'
    });
  }
  if (!isStructuredOutputEnforcement(response.structuredOutput)) {
    return fail(
      `proxy did not report which structured-output constraint it applied ` +
        `(got ${JSON.stringify(response.structuredOutput)}); it may predate the feature and have ` +
        `dropped the request silently`
    );
  }
  return succeed({
    content: response.content,
    truncated: response.truncated === true,
    structuredOutput: response.structuredOutput
  });
}
