/**
 * Testbed web shell — sample-browser layout (top-bar / sidebar / main / collapsible StatusBar).
 *
 * At B-1 the shell renders against an empty `scenarios` array; the main area shows an
 * "empty state" panel describing where the first scenario will live. The shell composes
 * `@fgv/ts-app-shell` primitives (`MessagesProvider`, `ResponsiveProvider`, `StatusBar`,
 * `useUrlSync`) rather than re-implementing them — per the brief's gap-then-fix tenet.
 *
 * The `TestbedShell` component accepts the scenario list as a prop (defaulting to the
 * production registry from `../scenarios`) so tests can drive both the empty-registry
 * branches (the B-1 reality) and the populated-registry branches (the B-3 target shape)
 * without having to mock module-level state.
 *
 * @packageDocumentation
 */

import React, { useMemo, useState } from 'react';
import {
  MessagesProvider,
  ResponsiveProvider,
  StatusBar,
  useMessages,
  useUrlSync,
  type IUrlSyncConfig
} from '@fgv/ts-app-shell';

import { scenarios as defaultScenarios } from '../scenarios';
import type { IScenario } from '../shell';

// The url-sync hook is two-tier (mode/tab). The testbed has a single "mode" (`scenarios`)
// and treats the scenario id as the tab — so deep links become `#/scenarios/<id>`. When
// the registry is empty we still need a syntactically-valid config; the placeholder mode
// + empty tab list keeps the hook happy.
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

/**
 * Props for {@link TestbedShell}.
 * @public
 */
export interface ITestbedShellProps {
  /** Override the scenario registry (used by tests). Defaults to the production list. */
  readonly scenarios?: readonly IScenario[];
}

/**
 * Inner shell rendered inside the providers. Split out so tests can mount it directly
 * without re-creating the provider stack in every assertion.
 * @public
 */
export function TestbedShell(props: ITestbedShellProps = {}): React.ReactElement {
  const allScenarios = props.scenarios ?? defaultScenarios;
  const { messages, clearMessages } = useMessages();
  const [activeScenarioId, setActiveScenarioId] = useState<string>(allScenarios[0]?.id ?? '');

  const urlSyncConfig = useMemo(() => makeUrlSyncConfig(allScenarios), [allScenarios]);
  useUrlSync<Mode, Tab>(
    urlSyncConfig,
    { mode: 'scenarios', activeTab: activeScenarioId },
    {
      // The testbed has a single mode, so the URL-sync setMode is a no-op for now.
      setMode: noopSetMode,
      setTab: (tab: Tab) => setActiveScenarioId(tab)
    }
  );

  const activeScenario = allScenarios.find((s) => s.id === activeScenarioId);

  return (
    <div className="testbed-shell" data-testid="testbed-shell">
      <header className="testbed-top-bar" data-testid="testbed-top-bar">
        <h1>fgv testbed</h1>
      </header>
      <div className="testbed-body">
        <aside className="testbed-sidebar" data-testid="testbed-sidebar">
          {allScenarios.length === 0 ? (
            <p data-testid="testbed-sidebar-empty">No scenarios registered yet.</p>
          ) : (
            <ul data-testid="testbed-sidebar-list">
              {allScenarios.map((s) => (
                <li key={s.id}>{s.title}</li>
              ))}
            </ul>
          )}
        </aside>
        <main className="testbed-main" data-testid="testbed-main">
          {activeScenario ? (
            <div data-testid="testbed-scenario-host">
              <h2>{activeScenario.title}</h2>
              <p>{activeScenario.description}</p>
            </div>
          ) : (
            <div data-testid="testbed-empty-state">
              <p>
                The testbed is scaffolded but no scenarios are registered yet. The first scenario lands in
                phase B-3 of the <code>local-ai-exploration</code> cluster.
              </p>
            </div>
          )}
        </main>
      </div>
      <footer className="testbed-status-bar" data-testid="testbed-status-bar">
        <StatusBar messages={messages} onClear={clearMessages} />
      </footer>
    </div>
  );
}

/**
 * Top-level testbed web app. Provides the responsive + messages contexts and mounts the
 * inner shell with the production scenario registry.
 * @public
 */
export function App(): React.ReactElement {
  return (
    <ResponsiveProvider>
      <MessagesProvider>
        <TestbedShell />
      </MessagesProvider>
    </ResponsiveProvider>
  );
}
