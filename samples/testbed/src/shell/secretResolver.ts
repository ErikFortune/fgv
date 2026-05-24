/**
 * Shared secret-resolver helper. The brief specifies KeyStore-first / env-var-fallback
 * semantics with a structured failure naming both ids. At B-1 this is a stub that returns
 * `Result.fail` with the documented sentinel message — B-3 (or whichever scenario first
 * needs secrets) fleshes out the real implementation alongside the KeyStore-on-web wiring.
 *
 * The stub is in place so the scenario contract (`IScenarioContext.resolveSecret`) is
 * already callable from scenario code; scenarios needing secrets surface the
 * not-yet-implemented message and the orchestrator commissions the work.
 *
 * @packageDocumentation
 */

import { CryptoUtils } from '@fgv/ts-extras';
import { fail, type Result } from '@fgv/ts-utils';
import type { ISecretSpec } from './index';

/**
 * Parameters consumed by {@link resolveSecret}. Bundles the spec with the (possibly-undefined)
 * KeyStore and an env-var lookup so the resolver is platform-agnostic.
 * @public
 */
export interface IResolveSecretParams {
  readonly spec: ISecretSpec;
  readonly keyStore: CryptoUtils.KeyStore.KeyStore | undefined;
  /**
   * Environment-variable lookup. Receives the env-var name and returns the value or
   * `undefined`. Injectable so web (no `process.env`) and CLI (Node `process.env`) wire it
   * differently.
   */
  readonly getEnvVar: (name: string) => string | undefined;
}

/**
 * Resolve a secret per the brief's KeyStore-first / env-var-fallback semantics.
 *
 * At B-1 this is a stub: it returns a `Failure` whose message names both the KeyStore id and
 * the env-var fallback, plus the sentinel `'B-1 stub'` token that the test suite asserts on.
 * Real KeyStore + env-var integration arrives in B-3 or whichever scenario first needs
 * secret resolution; the function shape and call signature are locked here so scenarios can
 * code against the final contract.
 * @public
 */
export async function resolveSecret(params: IResolveSecretParams): Promise<Result<string>> {
  const { spec } = params;
  return fail(
    `resolveSecret: not yet implemented (B-1 stub). ` +
      `Secret '${spec.id}' (env fallback '${spec.envVarName}') — ${spec.description}. ` +
      `See .ai/tasks/active/local-ai-exploration/brief.md.`
  );
}
