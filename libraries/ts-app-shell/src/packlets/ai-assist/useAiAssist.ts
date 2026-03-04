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
 * Generic AI assist hook — parameterized by settings and keystore, no app-specific context.
 *
 * Provides a list of available AI assist actions and functions for copy-paste
 * and direct API generation flows.
 *
 * @packageDocumentation
 */

import { useCallback, useMemo, useState } from 'react';

import { AiAssist } from '@fgv/ts-extras';
import { fail, type Logging, Result, succeed } from '@fgv/ts-utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Parameters for the generic useAiAssist hook.
 * @public
 */
export interface IUseAiAssistParams {
  /** Resolved AI assist settings (provider list + default). */
  readonly settings: AiAssist.IAiAssistSettings | undefined;
  /** Keystore for API key resolution (or undefined if no keystore). */
  readonly keyStore: AiAssist.IAiAssistKeyStore | undefined;
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
}

/**
 * A single available AI assist action.
 * @public
 */
export interface IAiAssistAction {
  /** The provider identifier */
  readonly provider: AiAssist.AiProviderId;
  /** Display label (e.g. "AI Assist | Copy", "AI Assist | Grok") */
  readonly label: string;
  /** Whether this is the default (first) action */
  readonly isDefault: boolean;
  /** Whether the provider is currently available (keystore unlocked, secret present) */
  readonly isAvailable: boolean;
  /** Reason the provider is unavailable, if any */
  readonly unavailableReason?: string;
}

/**
 * Result of executing an AI assist action.
 * @public
 */
export interface IAiAssistResult<TEntity> {
  /** The generated entity */
  readonly entity: TEntity;
  /** Source indicator */
  readonly source: 'ai';
}

/**
 * Return type of the useAiAssist hook.
 * @public
 */
export interface IUseAiAssistResult {
  /** Available actions based on settings + keystore state */
  readonly actions: ReadonlyArray<IAiAssistAction>;
  /** Whether a direct assist call is in progress */
  readonly isWorking: boolean;
  /**
   * Execute a copy-paste action: copies the combined prompt to clipboard.
   * @returns Success with `'copied'`, or failure.
   */
  readonly copyPrompt: (prompt: AiAssist.AiPrompt) => Promise<Result<'copied'>>;
  /**
   * Execute a direct API action: calls the provider, validates the response, returns the entity.
   * @returns Success with the validated entity, or failure.
   */
  readonly generateDirect: <TEntity>(
    provider: AiAssist.AiProviderId,
    prompt: AiAssist.AiPrompt,
    convert: (from: unknown) => Result<TEntity>
  ) => Promise<Result<IAiAssistResult<TEntity>>>;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Checks whether a parsed AI response is an error object (with an "error" field)
 * rather than a valid entity. AI prompts instruct the model to return
 * `{ "error": "...", "term": "..." }` when it cannot confidently generate the entity.
 *
 * @param parsed - The parsed JSON from the AI response
 * @returns A failure Result with the error message if it's an error object, or undefined if not
 */
export function checkForAiErrorObject(parsed: unknown): Result<never> | undefined {
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'error' in parsed &&
    typeof (parsed as Record<string, unknown>).error === 'string'
  ) {
    const errorObj = parsed as Record<string, unknown>;
    const term = typeof errorObj.term === 'string' ? ` (term: "${errorObj.term}")` : '';
    return fail(`AI declined to generate${term}: ${errorObj.error}`);
  }
  return undefined;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Generic hook providing AI assist actions based on supplied settings and keystore.
 * @param params - Settings and keystore to use (typically from a workspace or app context)
 * @returns Available actions and execution functions
 * @public
 */
export function useAiAssist(params: IUseAiAssistParams): IUseAiAssistResult {
  const { settings, keyStore, logger } = params;
  const [isWorking, setIsWorking] = useState(false);

  const actions = useMemo((): ReadonlyArray<IAiAssistAction> => {
    const providers = settings?.providers ?? [{ provider: 'copy-paste' as AiAssist.AiProviderId }];
    const enabledSet = new Set(providers.map((p) => p.provider));
    const defaultProvider: AiAssist.AiProviderId =
      settings?.defaultProvider && enabledSet.has(settings.defaultProvider)
        ? settings.defaultProvider
        : providers[0]?.provider ?? ('copy-paste' as AiAssist.AiProviderId);

    return providers.map((config) => {
      let isAvailable = true;
      let unavailableReason: string | undefined;

      if (config.provider !== 'copy-paste') {
        // API-based providers need a secret name and unlocked keystore with that secret
        if (!config.secretName) {
          isAvailable = false;
          unavailableReason = 'No API key secret configured';
        } else if (!keyStore) {
          isAvailable = false;
          unavailableReason = 'No keystore available';
        } else if (!keyStore.isUnlocked) {
          isAvailable = false;
          unavailableReason = 'Keystore is locked';
        } else {
          const hasSecret = keyStore.hasSecret(config.secretName);
          if (hasSecret.isFailure() || !hasSecret.value) {
            isAvailable = false;
            unavailableReason = `API key "${config.secretName}" not found in keystore`;
          }
        }
      }

      const label =
        AiAssist.getProviderDescriptor(config.provider).orDefault()?.buttonLabel ?? config.provider;
      return {
        provider: config.provider,
        label,
        isDefault: config.provider === defaultProvider,
        isAvailable,
        unavailableReason
      };
    });
  }, [settings, keyStore]);

  const copyPrompt = useCallback(async (prompt: AiAssist.AiPrompt): Promise<Result<'copied'>> => {
    try {
      await navigator.clipboard.writeText(prompt.combined);
      return succeed('copied' as const);
    } catch {
      return fail('Failed to copy prompt to clipboard');
    }
  }, []);

  const generateDirect = useCallback(
    async <TEntity>(
      provider: AiAssist.AiProviderId,
      prompt: AiAssist.AiPrompt,
      convert: (from: unknown) => Result<TEntity>
    ): Promise<Result<IAiAssistResult<TEntity>>> => {
      // Find the provider config and descriptor
      const providerConfig = settings?.providers.find((p) => p.provider === provider);

      if (!providerConfig) {
        return fail(`Provider "${provider}" not configured`);
      }

      const descriptorResult = AiAssist.getProviderDescriptor(provider);
      if (descriptorResult.isFailure()) {
        return fail(descriptorResult.message);
      }
      const descriptor = descriptorResult.value;

      if (!providerConfig.secretName) {
        return fail(`Provider "${provider}" has no secret name configured`);
      }
      if (!keyStore) {
        return fail('No keystore available');
      }

      // Get API key from keystore
      const apiKeyResult = keyStore.getApiKey(providerConfig.secretName);
      if (apiKeyResult.isFailure()) {
        return fail(`Failed to get API key: ${apiKeyResult.message}`);
      }

      setIsWorking(true);
      try {
        const maxAttempts = 3;
        const correctionMessages: Array<AiAssist.IChatMessage> = [];

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          // Call the API (with any correction messages from previous attempts)
          const responseResult = await AiAssist.callProviderCompletion({
            descriptor,
            apiKey: apiKeyResult.value,
            prompt,
            additionalMessages: correctionMessages.length > 0 ? correctionMessages : undefined,
            modelOverride: providerConfig.model,
            logger
          });
          if (responseResult.isFailure()) {
            logger?.error(`AI completion failed: ${responseResult.message}`);
            return fail(responseResult.message);
          }

          const { content: rawResponse, truncated } = responseResult.value;
          logger?.detail(`AI response received (${rawResponse.length} chars, truncated=${truncated})`);

          // Truncated responses are almost certainly malformed JSON — fail early
          if (truncated) {
            logger?.warn('AI response truncated due to token limits');
            return fail('AI response was truncated due to token limits — try a shorter prompt');
          }

          // Strip markdown code fences and parse JSON
          const stripped = rawResponse
            .trim()
            .replace(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/, '$1')
            .trim();

          let parsed: unknown;
          try {
            parsed = JSON.parse(stripped);
          } catch (err: unknown) {
            const detail = err instanceof Error ? err.message : String(err);
            // JSON parse failures are not retryable — the model isn't producing valid JSON at all
            return fail(`AI returned invalid JSON: ${detail}`);
          }

          // Check for AI error object (model declined to generate)
          const aiError = checkForAiErrorObject(parsed);
          if (aiError !== undefined) {
            return aiError;
          }

          // Validate with the provided converter
          const entityResult = convert(parsed);
          if (entityResult.isSuccess()) {
            return succeed({ entity: entityResult.value, source: 'ai' as const });
          }

          // Validation failed — if we have retries left, send a correction
          logger?.warn(
            `AI response validation failed (attempt ${attempt + 1}/${maxAttempts}): ${entityResult.message}`
          );
          if (attempt < maxAttempts - 1) {
            correctionMessages.push(
              { role: 'assistant', content: rawResponse },
              {
                role: 'user',
                content: `The JSON you returned failed validation with the following error:\n\n${entityResult.message}\n\nPlease fix the JSON and return ONLY the corrected JSON object, nothing else.`
              }
            );
          } else {
            // Out of retries
            return fail(
              `AI response validation failed after ${maxAttempts} attempts: ${entityResult.message}`
            );
          }
        }

        // Unreachable, but TypeScript needs it
        return fail('AI generation failed');
      } finally {
        setIsWorking(false);
      }
    },
    [settings, keyStore, logger]
  );

  return { actions, isWorking, copyPrompt, generateDirect };
}
