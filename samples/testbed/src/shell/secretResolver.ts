/**
 * Shared secret-resolver helper. Resolution order is KeyStore-first (the persistent,
 * password-protected store — not yet wired on either surface, but the seam is honored
 * for forward compatibility), then the web-only in-memory session secrets store, then
 * the env-var fallback (real on the CLI; a no-op on the web, since browsers have no
 * `process.env`).
 *
 * @packageDocumentation
 */

import { fail, succeed, type Result } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';
import type { ISecretSpec } from './index';

/**
 * Parameters consumed by {@link resolveSecret}. Bundles the spec with the (possibly-undefined)
 * KeyStore, an optional session-memory secrets map (web-only), and an env-var lookup so the
 * resolver is platform-agnostic.
 * @public
 */
export interface IResolveSecretParams {
  readonly spec: ISecretSpec;
  readonly keyStore: CryptoUtils.KeyStore.KeyStore | undefined;
  /**
   * Session-memory secrets captured via the web shell's secrets modal, keyed by
   * {@link ISecretSpec.id}. `undefined` on the CLI, which has no interactive secrets UI.
   */
  readonly sessionSecrets?: ReadonlyMap<string, string>;
  /**
   * Environment-variable lookup. Receives the env-var name and returns the value or
   * `undefined`. Injectable so web (no `process.env`) and CLI (Node `process.env`) wire it
   * differently.
   */
  readonly getEnvVar: (name: string) => string | undefined;
}

/**
 * Resolve a secret per the KeyStore-first / session-store-second / env-var-fallback-third
 * semantics documented on {@link IResolveSecretParams}.
 *
 * @public
 */
export async function resolveSecret(params: IResolveSecretParams): Promise<Result<string>> {
  const { spec, keyStore, sessionSecrets, getEnvVar } = params;

  if (keyStore?.isUnlocked) {
    const hasSecret = keyStore.hasSecret(spec.id);
    if (hasSecret.isSuccess() && hasSecret.value) {
      return keyStore.getApiKey(spec.id);
    }
  }

  const sessionValue = sessionSecrets?.get(spec.id);
  if (sessionValue !== undefined && sessionValue.length > 0) {
    return succeed(sessionValue);
  }

  const envValue = getEnvVar(spec.envVarName);
  if (envValue !== undefined && envValue.length > 0) {
    return succeed(envValue);
  }

  return fail(
    `Secret '${spec.id}' is not set (env fallback '${spec.envVarName}') — ${spec.description}. ` +
      `Set it via the Secrets panel (web) or the ${spec.envVarName} environment variable (CLI).`
  );
}
