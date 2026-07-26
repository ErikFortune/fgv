/**
 * Shared provider-to-secret-spec map for the web AI scenarios (`image-generation`,
 * `streaming-chat`). Reuses the exact secret ids already declared by the CLI-only
 * `modelTiers`/`*ClientTools` scenarios (`openai-api-key`, `anthropic-api-key`,
 * `gemini-api-key`/`google-api-key`, `xai-api-key`) rather than inventing parallel ids, so
 * the shell's secrets modal shows one field per provider regardless of which scenario is
 * currently active.
 *
 * @packageDocumentation
 */

import { useEffect, useState } from 'react';
import { fail, succeed, type Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import type { IScenarioContext, ISecretSpec } from '../shell';

/** A provider's primary secret spec, plus an optional alternate (Gemini accepts either). */
interface IProviderSecretSpecs {
  readonly primary: ISecretSpec;
  readonly fallback?: ISecretSpec;
}

/**
 * Providers wired into the two web AI scenarios, each mapped to the CLI-scenario secret
 * ids it already uses. Providers with no entry here (self-hosted `ollama`/`openai-compat`,
 * `copy-paste`, etc.) are treated as not requiring a secret.
 * @public
 */
export const PROVIDER_SECRET_SPECS: Partial<Record<AiAssist.AiProviderId, IProviderSecretSpecs>> = {
  openai: {
    primary: {
      id: 'openai-api-key',
      envVarName: 'OPENAI_API_KEY',
      description: 'OpenAI API key for image generation / streaming chat'
    }
  },
  anthropic: {
    primary: {
      id: 'anthropic-api-key',
      envVarName: 'ANTHROPIC_API_KEY',
      description: 'Anthropic API key for streaming chat'
    }
  },
  'google-gemini': {
    primary: {
      id: 'gemini-api-key',
      envVarName: 'GEMINI_API_KEY',
      description: 'Gemini API key for image generation / streaming chat'
    },
    fallback: {
      id: 'google-api-key',
      envVarName: 'GOOGLE_API_KEY',
      description: 'Google API key for image generation / streaming chat (alternative to GEMINI_API_KEY)'
    }
  },
  'xai-grok': {
    primary: {
      id: 'xai-api-key',
      envVarName: 'XAI_API_KEY',
      description: 'xAI API key for image generation / streaming chat'
    }
  }
};

/**
 * Collects the `requiredSecrets` list for a given set of providers — every provider's
 * primary spec, plus its fallback spec when one exists. Order-preserving, deduped by id
 * (a provider is never listed twice even if referenced more than once).
 * @public
 */
export function requiredSecretsForProviders(
  providers: readonly AiAssist.AiProviderId[]
): readonly ISecretSpec[] {
  const byId = new Map<string, ISecretSpec>();
  for (const provider of providers) {
    const specs = PROVIDER_SECRET_SPECS[provider];
    if (!specs) {
      continue;
    }
    if (!byId.has(specs.primary.id)) {
      byId.set(specs.primary.id, specs.primary);
    }
    if (specs.fallback && !byId.has(specs.fallback.id)) {
      byId.set(specs.fallback.id, specs.fallback);
    }
  }
  return Array.from(byId.values());
}

/**
 * Resolves the API key for a provider via `context.resolveSecret`, trying the primary
 * spec first and the fallback spec (if any) second. Providers with no entry in
 * {@link PROVIDER_SECRET_SPECS} (self-hosted / no-secret providers) resolve to an empty
 * string — `ts-extras`'s dispatcher omits the `Authorization` header entirely for those.
 * @public
 */
export async function resolveProviderApiKey(
  context: IScenarioContext,
  provider: AiAssist.AiProviderId
): Promise<Result<string>> {
  const specs = PROVIDER_SECRET_SPECS[provider];
  if (!specs) {
    return succeed('');
  }

  const primaryResult = await context.resolveSecret(specs.primary);
  if (primaryResult.isSuccess()) {
    return primaryResult;
  }
  if (!specs.fallback) {
    return primaryResult;
  }

  const fallbackResult = await context.resolveSecret(specs.fallback);
  if (fallbackResult.isSuccess()) {
    return fallbackResult;
  }
  return fail(`${primaryResult.message}; ${fallbackResult.message}`);
}

/**
 * Minimal `AiAssist.IAiAssistKeyStore` backed by a single resolved secret value. Mirrors
 * the shape of the `ai-image-gen-sample`'s `InMemoryKeyStore`, re-implemented here since
 * the sample itself is not a dependency and is not to be modified — see the
 * `testbed-web-scenarios` brief.
 * @public
 */
export class SingleSecretKeyStore implements AiAssist.IAiAssistKeyStore {
  public readonly isUnlocked: boolean = true;
  private readonly _secrets: ReadonlyMap<string, string>;

  public constructor(secrets: ReadonlyMap<string, string>) {
    this._secrets = secrets;
  }

  public hasSecret(name: string): Result<boolean> {
    return succeed(this._secrets.has(name));
  }

  public getApiKey(name: string): Result<string> {
    const value = this._secrets.get(name);
    if (value === undefined || value.length === 0) {
      return fail(`secret "${name}" not set`);
    }
    return succeed(value);
  }
}

/** Resolution status for {@link useProviderApiKey}. */
export type ProviderApiKeyStatus = 'loading' | 'ready' | 'missing';

/** Return value of {@link useProviderApiKey}. */
export interface IProviderApiKeyState {
  /** The resolved key, or `''` while loading/missing. */
  readonly apiKey: string;
  readonly status: ProviderApiKeyStatus;
  /** Populated when `status === 'missing'`. */
  readonly error?: string;
}

/**
 * Resolves and tracks the API key for the given provider, re-resolving whenever the
 * provider changes or the shell's secrets store updates (surfaced via a new
 * `context.resolveSecret` closure identity — see `web/App.tsx`).
 * @public
 */
export function useProviderApiKey(
  context: IScenarioContext,
  provider: AiAssist.AiProviderId
): IProviderApiKeyState {
  // Internal state is tagged with the provider it was resolved for. `provider` (the
  // hook's argument) can change one render before the effect below has a chance to
  // reset `state` to 'loading' for the new provider — without the tag, that one-frame
  // window would expose the OLD provider's resolved key/status paired with the NEW
  // provider's id (e.g. a stale OpenAI key momentarily reachable under a
  // just-selected Gemini secretName). The read-time guard below closes that window.
  const [state, setState] = useState<IProviderApiKeyState & { readonly forProvider: AiAssist.AiProviderId }>(
    { apiKey: '', status: 'loading', forProvider: provider }
  );

  useEffect(() => {
    let cancelled = false;
    setState({ apiKey: '', status: 'loading', forProvider: provider });
    (async () => {
      const result = await resolveProviderApiKey(context, provider);
      if (cancelled) {
        return;
      }
      if (result.isSuccess()) {
        setState({ apiKey: result.value, status: 'ready', forProvider: provider });
      } else {
        setState({ apiKey: '', status: 'missing', error: result.message, forProvider: provider });
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // context.resolveSecret's identity (not `context` itself) is the reactivity signal
    // for "the session secrets store changed" — see web/App.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, context.resolveSecret]);

  if (state.forProvider !== provider) {
    return { apiKey: '', status: 'loading' };
  }
  return { apiKey: state.apiKey, status: state.status, error: state.error };
}
