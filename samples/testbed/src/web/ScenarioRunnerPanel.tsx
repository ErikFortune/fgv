/**
 * Shell-generic runner panel (Phase B) — renders for a scenario whose `cli.webRunnable` is
 * `true` and which declares no `web` impl. Shows the scenario's `requiredSecrets` status
 * (resolved via `context.resolveSecret`, mirroring Phase A's "open Secrets" affordance), a
 * Run button that invokes `cli.run(context)` directly in the browser, an in-flight state, and
 * the `Result<string>` report (success as a monospace block, failure in the error styling).
 *
 * No bespoke per-scenario React component is involved — this is the single shared panel for
 * every opted-in CLI scenario (see the `testbed-web-scenarios` Phase B brief).
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { IScenario, IScenarioContext, ISecretSpec } from '../shell';

// ---------------------------------------------------------------------------
// Secret status
// ---------------------------------------------------------------------------

type SecretStatus = 'loading' | 'ready' | 'missing';

interface ISecretStatusEntry {
  readonly spec: ISecretSpec;
  readonly status: SecretStatus;
  readonly error?: string;
}

/** Stable empty array so scenarios with no `requiredSecrets` don't retrigger the effect below. */
const EMPTY_SECRETS: readonly ISecretSpec[] = [];

/**
 * Resolves the status of every `requiredSecrets` entry via `context.resolveSecret`,
 * re-resolving whenever the resolver's identity changes (the session secrets store updated —
 * see `web/App.tsx`) or the scenario's own secret list changes. Mirrors the re-resolve-on-
 * identity-change pattern of `useProviderApiKey` in `../scenarios/aiProviderSecrets.ts`.
 */
function useSecretStatuses(
  context: IScenarioContext,
  specs: readonly ISecretSpec[]
): readonly ISecretStatusEntry[] {
  const [statuses, setStatuses] = useState<readonly ISecretStatusEntry[]>(() =>
    specs.map((spec) => ({ spec, status: 'loading' as const }))
  );

  useEffect(() => {
    let cancelled = false;
    setStatuses(specs.map((spec) => ({ spec, status: 'loading' as const })));
    (async () => {
      const resolved = await Promise.all(
        specs.map(async (spec) => {
          const result = await context.resolveSecret(spec);
          return result.isSuccess()
            ? { spec, status: 'ready' as const }
            : { spec, status: 'missing' as const, error: result.message };
        })
      );
      if (!cancelled) {
        setStatuses(resolved);
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // context.resolveSecret's identity (not `context` itself) is the reactivity signal for
    // "the session secrets store changed" — see web/App.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specs, context.resolveSecret]);

  return statuses;
}

/** Renders one secret's status line. */
function SecretStatusLine({ entry }: { readonly entry: ISecretStatusEntry }): React.ReactElement {
  if (entry.status === 'loading') {
    return (
      <span data-testid={`testbed-runner-secret-${entry.spec.id}`} className="text-muted">
        Checking {entry.spec.id}…
      </span>
    );
  }
  if (entry.status === 'ready') {
    return (
      <span data-testid={`testbed-runner-secret-${entry.spec.id}`} className="text-status-success-text">
        ✓ {entry.spec.id} configured
      </span>
    );
  }
  return (
    <span data-testid={`testbed-runner-secret-${entry.spec.id}`} className="text-status-warning-text">
      ✗ {entry.spec.id} not set. Open <strong className="font-semibold">Secrets</strong> (top bar) to add one.
    </span>
  );
}

// ---------------------------------------------------------------------------
// Run state
// ---------------------------------------------------------------------------

type RunState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'running'; readonly startedAt: number }
  | { readonly kind: 'success'; readonly report: string }
  | { readonly kind: 'failure'; readonly message: string };

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * Props for {@link ScenarioRunnerPanel}.
 * @public
 */
export interface IScenarioRunnerPanelProps {
  /** The active scenario. Must declare `cli.webRunnable === true` and no `web` impl. */
  readonly scenario: IScenario;
  readonly context: IScenarioContext;
}

/**
 * Shell-generic runner panel for browser-clean CLI scenarios. See the packlet doc comment.
 * @public
 */
export function ScenarioRunnerPanel({ scenario, context }: IScenarioRunnerPanelProps): React.ReactElement {
  // ScenarioHost only mounts this panel when `scenario.cli` is defined (webRunnable === true
  // implies a cli impl) — matches the established `scenario.web!.component` non-null pattern
  // used for the analogous "ready" branch.
  const cli = scenario.cli!;
  const secretStatuses = useSecretStatuses(context, scenario.requiredSecrets ?? EMPTY_SECRETS);
  const [runState, setRunState] = useState<RunState>({ kind: 'idle' });
  const [elapsedMs, setElapsedMs] = useState(0);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  // Tick the elapsed-time display while a run is in flight.
  useEffect(() => {
    if (runState.kind !== 'running') {
      return;
    }
    const startedAt = runState.startedAt;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 200);
    return () => clearInterval(interval);
  }, [runState]);

  const handleRun = useCallback(() => {
    setElapsedMs(0);
    setRunState({ kind: 'running', startedAt: Date.now() });
    cli
      .run(context)
      .then((result) => {
        if (!mountedRef.current) {
          return;
        }
        if (result.isSuccess()) {
          setRunState({ kind: 'success', report: result.value });
        } else {
          setRunState({ kind: 'failure', message: result.message });
        }
      })
      /* c8 ignore next 5 - run() returns Promise<Result>; it never rejects in practice (failures become Result.fail). Guard is defensive, mirrors ScenarioHost's initialize() catch. */
      .catch((err: unknown) => {
        if (mountedRef.current) {
          setRunState({ kind: 'failure', message: String(err) });
        }
      });
  }, [cli, context]);

  const isRunning = runState.kind === 'running';

  return (
    <div data-testid="testbed-scenario-runner" className="space-y-4">
      <section data-testid="testbed-runner-secrets" className="space-y-1">
        <h3 className="text-sm font-semibold text-primary">Secrets</h3>
        {secretStatuses.length === 0 ? (
          <p data-testid="testbed-runner-no-secrets" className="text-sm text-secondary">
            This scenario requires no secrets.
          </p>
        ) : (
          <ul className="space-y-1">
            {secretStatuses.map((entry) => (
              <li key={entry.spec.id} className="text-sm">
                <SecretStatusLine entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          data-testid="testbed-runner-run-btn"
          onClick={handleRun}
          disabled={isRunning}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? 'Running…' : 'Run'}
        </button>
        {isRunning && (
          <span data-testid="testbed-runner-elapsed" className="text-sm text-secondary">
            {(elapsedMs / 1000).toFixed(1)}s elapsed
          </span>
        )}
      </div>

      {runState.kind === 'success' && (
        <div data-testid="testbed-runner-success">
          <h3 className="mb-1 text-sm font-semibold text-primary">Result</h3>
          <pre className="whitespace-pre-wrap rounded bg-surface-alt px-3 py-2 font-mono text-sm text-primary">
            {runState.report}
          </pre>
        </div>
      )}

      {runState.kind === 'failure' && (
        <div
          data-testid="testbed-runner-failure"
          className="rounded-md border border-status-error-border bg-status-error-bg p-4 text-sm text-status-error-text"
        >
          <strong className="font-semibold text-status-error-strong">Run failed:</strong> {runState.message}
        </div>
      )}
    </div>
  );
}
