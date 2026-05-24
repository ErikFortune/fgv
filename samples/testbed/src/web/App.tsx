/**
 * Testbed web shell — sample-browser layout (top-bar / sidebar / main / collapsible StatusBar).
 *
 * B-5: the shell now mounts scenario components and drives the `initialize` lifecycle.
 * The main area is either:
 *   - a loading spinner while `web.initialize` is pending,
 *   - an error panel if `initialize` returned a `Result` failure,
 *   - the live `web.component` once initialization succeeds, or
 *   - an informative "CLI-only" message when a scenario has no `web` impl.
 *
 * The `IScenarioContext` is built by the shell: the logger is wired to the
 * `@fgv/ts-app-shell` messages surface via `useLogReporter` so scenario logs land in
 * the StatusBar. The KeyStore and dataTree are stable per-session values derived from
 * module-level singletons.
 *
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  MessagesProvider,
  ResponsiveProvider,
  StatusBar,
  ThemeProvider,
  useLogReporter,
  useMessages,
  useTheme,
  useUrlSync,
  type IUrlSyncConfig
} from '@fgv/ts-app-shell';
import { FileTree } from '@fgv/ts-json-base';

import { dataFiles } from '../generated/dataFileTree';
import { scenarios as defaultScenarios } from '../scenarios';
import { resolveSecret } from '../shell';
import type { IScenario, IScenarioContext } from '../shell';

// ---------------------------------------------------------------------------
// Module-level singletons (stable across the session)
// ---------------------------------------------------------------------------

/**
 * In-memory data tree built from `samples/testbed/data/`. Constructed once at
 * module load so every scenario receives the same reference. The `orThrow()`
 * is intentional — this runs once at module load from a statically-known list;
 * a failure would indicate a broken build artifact.
 */
const DATA_TREE: FileTree.FileTree = FileTree.inMemory([...dataFiles]).orThrow();

// ---------------------------------------------------------------------------
// URL-sync helpers
// ---------------------------------------------------------------------------

type Mode = 'scenarios';
type Tab = string;

// The testbed has a single mode, so the URL-sync setMode is a no-op for now. Lifted to
// module scope so the lint rules against inline `() => undefined` arrows don't fire — a
// zero-arg function is assignable to `setMode: (mode: Mode) => void`.
function noopSetMode(): undefined {
  return undefined;
}

function makeUrlSyncConfig(allScenarios: readonly IScenario[]): IUrlSyncConfig<Mode, Tab> {
  const ids = allScenarios.map((s) => s.id);
  return {
    validModes: ['scenarios'],
    validTabs: { scenarios: ids },
    defaultTabs: { scenarios: ids[0] ?? '' }
  };
}

// ---------------------------------------------------------------------------
// Props + exported shape
// ---------------------------------------------------------------------------

/**
 * Props for {@link TestbedShell}.
 * @public
 */
export interface ITestbedShellProps {
  /** Override the scenario registry (used by tests). Defaults to the production list. */
  readonly scenarios?: readonly IScenario[];
}

// ---------------------------------------------------------------------------
// Theme toggle button
// ---------------------------------------------------------------------------

/**
 * A small icon button in the top bar that cycles between light and dark themes.
 * Uses {@link useTheme} from ts-app-shell and has a stable `data-testid`.
 * @public
 */
export function ThemeToggle(): React.ReactElement {
  const { isDark, setTheme } = useTheme();
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const handleClick = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  return (
    <button
      type="button"
      data-testid="testbed-theme-toggle"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="ml-auto rounded p-1.5 text-sm text-secondary hover:bg-hover focus:outline-none focus:ring-2 focus:ring-focus-ring transition-colors"
    >
      {isDark ? '☀' : '☾'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Scenario host (active scenario UI area)
// ---------------------------------------------------------------------------

/** Lifecycle state for the scenario host. */
type ScenarioLifecycle =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready' }
  | { readonly kind: 'no-web' };

/**
 * Renders the main area for the active scenario. Drives `initialize` when present,
 * then mounts `web.component` on success.
 */
function ScenarioHost({
  scenario,
  context
}: {
  readonly scenario: IScenario;
  readonly context: IScenarioContext;
}): React.ReactElement {
  const [lifecycle, setLifecycle] = React.useState<ScenarioLifecycle>(() =>
    scenario.web ? (scenario.web.initialize ? { kind: 'loading' } : { kind: 'ready' }) : { kind: 'no-web' }
  );

  // Run initialize() once on mount (scenario.web.initialize is stable).
  React.useEffect(() => {
    if (!scenario.web?.initialize) {
      return;
    }

    let active = true;
    scenario.web
      .initialize(context)
      .then((result) => {
        if (!active) {
          return;
        }
        if (result.isFailure()) {
          setLifecycle({ kind: 'error', message: result.message });
        } else {
          setLifecycle({ kind: 'ready' });
        }
      })
      /* c8 ignore next 5 - initialize() returns Promise<Result>; it never rejects in practice (failures become Result.fail). Guard is defensive. */
      .catch((err: unknown) => {
        if (active) {
          setLifecycle({ kind: 'error', message: String(err) });
        }
      });

    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Render the appropriate state.
  if (lifecycle.kind === 'loading') {
    return (
      <div data-testid="testbed-scenario-loading" className="p-4 text-secondary">
        <p>Loading scenario…</p>
      </div>
    );
  }

  if (lifecycle.kind === 'error') {
    return (
      <div
        data-testid="testbed-scenario-error"
        className="m-4 rounded-md border border-status-error-border bg-status-error-bg p-4"
      >
        <p className="text-status-error-text">
          <strong className="text-status-error-strong">Failed to initialize scenario:</strong>{' '}
          {lifecycle.message}
        </p>
      </div>
    );
  }

  if (lifecycle.kind === 'no-web') {
    return (
      <div
        data-testid="testbed-scenario-no-web"
        className="m-4 rounded-md border border-border bg-surface-raised p-4"
      >
        <p className="text-secondary">This scenario has no web interface. Run it from the CLI with:</p>
        <pre className="mt-2 rounded bg-surface-alt px-3 py-2 font-mono text-sm text-muted">
          node bin/testbed.js --scenario {scenario.id}
        </pre>
      </div>
    );
  }

  // lifecycle.kind === 'ready'
  const WebComponent = scenario.web!.component;
  return <WebComponent context={context} />;
}

// ---------------------------------------------------------------------------
// TestbedShell (inner shell, inside providers)
// ---------------------------------------------------------------------------

/**
 * Inner shell rendered inside the providers. Split out so tests can mount it directly
 * without re-creating the provider stack in every assertion.
 * @public
 */
export function TestbedShell(props: ITestbedShellProps = {}): React.ReactElement {
  const allScenarios = props.scenarios ?? defaultScenarios;
  const { messages, clearMessages } = useMessages();
  const [activeScenarioId, setActiveScenarioId] = useState<string>(allScenarios[0]?.id ?? '');

  // Build a logger wired to the MessagesContext so scenario logs appear in the StatusBar.
  const logger = useLogReporter();

  // Build a stable IScenarioContext. The logger reference is stable across re-renders
  // because useLogReporter memoizes on addMessage. keyStore is undefined (B-1 stub).
  const scenarioContext = useMemo<IScenarioContext>(
    () => ({
      logger,
      keyStore: undefined,
      /* c8 ignore next 2 - resolveSecret is a B-1 stub; no web scenario calls it yet */
      resolveSecret: (spec) => resolveSecret({ spec, keyStore: undefined, getEnvVar: () => undefined }),
      dataTree: DATA_TREE
    }),
    [logger]
  );

  const urlSyncConfig = useMemo(() => makeUrlSyncConfig(allScenarios), [allScenarios]);
  useUrlSync<Mode, Tab>(
    urlSyncConfig,
    { mode: 'scenarios', activeTab: activeScenarioId },
    {
      setMode: noopSetMode,
      setTab: (tab: Tab) => setActiveScenarioId(tab)
    }
  );

  const activeScenario = allScenarios.find((s) => s.id === activeScenarioId);

  const handleSelectScenario = useCallback((id: string) => {
    setActiveScenarioId(id);
  }, []);

  return (
    <div className="testbed-shell bg-surface text-primary" data-testid="testbed-shell">
      <header
        className="testbed-top-bar flex h-12 items-center gap-3 border-b border-border bg-brand-secondary px-4 shadow-sm"
        data-testid="testbed-top-bar"
      >
        <h1 className="text-base font-semibold tracking-tight text-white">fgv testbed</h1>
        <ThemeToggle />
      </header>
      <div className="testbed-body">
        <aside
          className="testbed-sidebar w-56 border-r border-border bg-surface-alt"
          data-testid="testbed-sidebar"
        >
          {allScenarios.length === 0 ? (
            <p className="p-4 text-sm text-muted" data-testid="testbed-sidebar-empty">
              No scenarios registered yet.
            </p>
          ) : (
            <ul className="py-2" data-testid="testbed-sidebar-list">
              {allScenarios.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-testid={`testbed-sidebar-btn-${s.id}`}
                    onClick={() => handleSelectScenario(s.id)}
                    aria-current={s.id === activeScenarioId ? 'page' : undefined}
                    className={
                      s.id === activeScenarioId
                        ? 'selected w-full border-l-2 border-selected-border bg-selected px-4 py-2 text-left text-sm font-medium text-brand-primary'
                        : 'w-full border-l-2 border-transparent px-4 py-2 text-left text-sm text-secondary hover:bg-hover hover:text-primary'
                    }
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <main className="testbed-main p-6" data-testid="testbed-main">
          {activeScenario ? (
            <div data-testid="testbed-scenario-host">
              <h2 className="mb-1 text-xl font-semibold text-primary">{activeScenario.title}</h2>
              <p className="mb-4 text-sm text-secondary">{activeScenario.description}</p>
              <div className="rounded-lg border border-border bg-surface-raised p-4">
                <ScenarioHost key={activeScenario.id} scenario={activeScenario} context={scenarioContext} />
              </div>
            </div>
          ) : (
            <div data-testid="testbed-empty-state" className="text-secondary">
              <p>
                The testbed is running but no scenarios are registered yet. Drop a scenario module under{' '}
                <code className="rounded bg-surface-alt px-1 text-sm">src/scenarios/</code> to get started.
              </p>
            </div>
          )}
        </main>
      </div>
      <footer
        className="testbed-status-bar border-t border-border bg-surface-raised"
        data-testid="testbed-status-bar"
      >
        <StatusBar messages={messages} onClear={clearMessages} />
      </footer>
    </div>
  );
}

/**
 * Top-level testbed web app. Provides the theme, responsive + messages contexts and mounts
 * the inner shell with the production scenario registry.
 * @public
 */
export function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <ResponsiveProvider>
        <MessagesProvider>
          <TestbedShell />
        </MessagesProvider>
      </ResponsiveProvider>
    </ThemeProvider>
  );
}
