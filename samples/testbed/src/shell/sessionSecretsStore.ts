/**
 * Web-side session secrets store — the in-memory secret source `resolveSecret` consults
 * before falling back to env vars (which are a no-op in the browser). Values live only in
 * React state for the current session; nothing is persisted or encrypted (that's a possible
 * future extension, not this phase — see the `testbed-web-scenarios` brief).
 *
 * This module intentionally lives under `shell/` (not `web/`) because it is the "secret
 * store" half of the contract the brief calls out; the modal *UI* that renders it is a
 * `web/` concern (browsers have secrets UI, the CLI does not).
 *
 * @packageDocumentation
 */

import { useCallback, useState } from 'react';
import type { IScenario, ISecretSpec } from './index';

/**
 * Collects the union of `requiredSecrets` across every registered scenario, deduped by
 * {@link ISecretSpec.id} (provider keys are shared across scenarios, e.g. every scenario
 * touching OpenAI declares the same `provider:openai` id). First occurrence wins; ids are
 * expected to carry the same `envVarName`/`description` everywhere they're declared.
 * @public
 */
export function dedupeRequiredSecrets(scenarios: readonly IScenario[]): readonly ISecretSpec[] {
  const byId = new Map<string, ISecretSpec>();
  for (const scenario of scenarios) {
    for (const spec of scenario.requiredSecrets ?? []) {
      if (!byId.has(spec.id)) {
        byId.set(spec.id, spec);
      }
    }
  }
  return Array.from(byId.values());
}

/**
 * Return value of {@link useSessionSecretsStore}.
 * @public
 */
export interface ISessionSecretsStore {
  /** Current secret values, keyed by {@link ISecretSpec.id}. */
  readonly secrets: ReadonlyMap<string, string>;
  /** Set (or clear, via an empty string) the value for a given secret id. */
  readonly setSecret: (id: string, value: string) => void;
}

/**
 * React hook holding the session-memory secrets map. A new `Map` identity is produced on
 * every update so consumers that key a `useMemo`/effect dependency on `secrets` (or on a
 * `resolveSecret` closure built from it) re-run when a value changes.
 * @public
 */
export function useSessionSecretsStore(): ISessionSecretsStore {
  const [secrets, setSecrets] = useState<ReadonlyMap<string, string>>(new Map());

  const setSecret = useCallback((id: string, value: string): void => {
    setSecrets((prev) => {
      const next = new Map(prev);
      next.set(id, value);
      return next;
    });
  }, []);

  return { secrets, setSecret };
}
