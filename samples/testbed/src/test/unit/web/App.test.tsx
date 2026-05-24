// The web component path (App.tsx / TestbedShell) imports scenario modules which
// transitively import @fgv/ts-web-extras-transformers (the BROWSER facade). That facade
// uses WebAssembly/ONNX internals incompatible with jsdom. Mock it here so the shell
// can render in the test environment without attempting a real model download.
// Note: @fgv/ts-extras-transformers (the NODE facade) is NOT imported by the web path —
// scenario CLI runs use a webpackIgnore dynamic import at runtime, so it never enters
// the static web graph. Only the browser facade needs mocking here.
jest.mock('@fgv/ts-web-extras-transformers');
// @fgv/ts-prompt-assist uses indirect ts-extras-transformers deps; mock to keep jsdom clean.
jest.mock('@fgv/ts-extras-transformers');

import '@fgv/ts-utils-jest';
import React from 'react';
import { render, screen, within, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { fail, succeed, type Result } from '@fgv/ts-utils';

import { App, TestbedShell, ThemeToggle } from '../../../web/App';
import { MessagesProvider, ResponsiveProvider, ThemeProvider } from '@fgv/ts-app-shell';
import type { IScenario, IScenarioContext, IWebScenarioImpl } from '../../../shell';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderInProviders(node: React.ReactElement): ReturnType<typeof render> {
  return render(
    <ThemeProvider>
      <ResponsiveProvider>
        <MessagesProvider>{node}</MessagesProvider>
      </ResponsiveProvider>
    </ThemeProvider>
  );
}

/**
 * Build a minimal synthetic scenario with no web/CLI impl (used for sidebar + URL-sync tests).
 */
function makeSyntheticScenario(id: string, title: string, description: string = 'desc'): IScenario {
  return { id, title, description, category: 'general', tags: ['test'] };
}

/**
 * Build a synthetic scenario with a web impl that has no `initialize`.
 * The component renders a div with `data-testid="synthetic-component-<id>"`.
 */
function makeWebScenario(id: string, title: string): IScenario {
  const component = ({ context }: { context: IScenarioContext }): React.ReactElement => (
    <div data-testid={`synthetic-component-${id}`} data-ctx-defined={String(context !== undefined)}>
      {title} component
    </div>
  );
  const web: IWebScenarioImpl = { component };
  return { id, title, description: `${title} description`, category: 'general', tags: ['test'], web };
}

/**
 * Build a synthetic scenario with a web impl that calls `initialize` before mounting.
 * `initResult` controls what the initialize promise resolves to.
 */
function makeInitScenario(
  id: string,
  title: string,
  initResult: 'succeed' | 'fail' | 'pending'
): { scenario: IScenario; resolveInit: () => void } {
  let resolveInit: () => void = () => undefined;

  const initPromise = new Promise<void>((resolve) => {
    resolveInit = resolve;
  });

  const component = ({ context }: { context: IScenarioContext }): React.ReactElement => (
    <div data-testid={`init-component-${id}`} data-ctx-defined={String(context !== undefined)}>
      {title} ready
    </div>
  );

  const initialize = async (context: IScenarioContext): Promise<Result<boolean>> => {
    // context is required by the interface; log it to avoid unused-var issues
    context.logger.info(`initializing ${id}`);
    await initPromise;
    if (initResult === 'fail') {
      return fail<boolean>(`init failed for ${id}`);
    }
    return succeed(true);
  };

  const web: IWebScenarioImpl = { component, initialize };
  const scenario: IScenario = {
    id,
    title,
    description: `${title} description`,
    category: 'general',
    tags: ['test'],
    web
  };
  return { scenario, resolveInit };
}

const sampleScenarios: readonly IScenario[] = [
  makeSyntheticScenario('sample-a', 'Sample A', 'Synthetic scenario used by the shell tests.'),
  makeSyntheticScenario('sample-b', 'Sample B', 'A second synthetic scenario.')
];

// ---------------------------------------------------------------------------
// App (top-level provider stack)
// ---------------------------------------------------------------------------

describe('App (testbed web shell)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '#');
  });
  afterEach(cleanup);

  test('App composes the full provider stack and renders the shell regions', () => {
    render(<App />);
    screen.getByTestId('testbed-shell');
    screen.getByTestId('testbed-top-bar');
    screen.getByTestId('testbed-sidebar');
    screen.getByTestId('testbed-main');
    screen.getByTestId('testbed-status-bar');
  });

  test('shows the empty-state branches when the registry is empty', () => {
    renderInProviders(<TestbedShell scenarios={[]} />);
    expect(screen.getByTestId('testbed-sidebar-empty')).not.toBeNull();
    expect(screen.getByTestId('testbed-empty-state')).not.toBeNull();
    expect(screen.queryByTestId('testbed-sidebar-list')).toBeNull();
    expect(screen.queryByTestId('testbed-scenario-host')).toBeNull();
  });

  test('renders the sidebar list and the active scenario host when the registry is populated', () => {
    renderInProviders(<TestbedShell scenarios={sampleScenarios} />);
    const sidebar = screen.getByTestId('testbed-sidebar-list');
    const host = screen.getByTestId('testbed-scenario-host');
    expect(within(sidebar).getByText('Sample A')).not.toBeNull();
    expect(within(host).getByText('Sample A')).not.toBeNull();
    expect(within(host).getByText('Synthetic scenario used by the shell tests.')).not.toBeNull();
    expect(screen.queryByTestId('testbed-sidebar-empty')).toBeNull();
    expect(screen.queryByTestId('testbed-empty-state')).toBeNull();
  });

  test('responds to a deep-link hash change by switching the active scenario', async () => {
    window.history.replaceState(null, '', '#/scenarios/sample-a');
    renderInProviders(<TestbedShell scenarios={sampleScenarios} />);

    window.history.pushState(null, '', '#/scenarios/sample-b');
    window.dispatchEvent(new PopStateEvent('popstate'));

    const host = await screen.findByTestId('testbed-scenario-host');
    expect(within(host).getByText('Sample B')).not.toBeNull();
    expect(within(host).getByText('A second synthetic scenario.')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ThemeToggle
// ---------------------------------------------------------------------------

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '#');
  });
  afterEach(cleanup);

  test('renders with data-testid="testbed-theme-toggle"', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    expect(screen.getByTestId('testbed-theme-toggle')).not.toBeNull();
  });

  test('starts in light mode (shows dark-mode icon)', () => {
    render(
      <ThemeProvider initialTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );
    const btn = screen.getByTestId('testbed-theme-toggle');
    expect(btn.textContent).toBe('☾');
    expect(btn.getAttribute('aria-label')).toBe('Switch to dark mode');
  });

  test('clicking the toggle switches from light to dark', () => {
    render(
      <ThemeProvider initialTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );
    const btn = screen.getByTestId('testbed-theme-toggle');
    fireEvent.click(btn);
    expect(btn.textContent).toBe('☀');
    expect(btn.getAttribute('aria-label')).toBe('Switch to light mode');
  });

  test('clicking the toggle switches from dark to light', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    );
    const btn = screen.getByTestId('testbed-theme-toggle');
    // Starts in dark mode — shows sun icon
    expect(btn.textContent).toBe('☀');
    fireEvent.click(btn);
    // Back to light mode — shows moon icon
    expect(btn.textContent).toBe('☾');
    expect(btn.getAttribute('aria-label')).toBe('Switch to dark mode');
  });

  test('top bar contains the theme toggle in the full shell', () => {
    renderInProviders(<TestbedShell scenarios={[]} />);
    const topBar = screen.getByTestId('testbed-top-bar');
    expect(within(topBar).getByTestId('testbed-theme-toggle')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Sidebar interaction
// ---------------------------------------------------------------------------

describe('TestbedShell sidebar interaction', () => {
  beforeEach(() => {
    // Reset the URL hash so the URL-sync hook starts in a clean state for each test.
    window.history.replaceState(null, '', '#');
  });
  afterEach(cleanup);

  test('each scenario is rendered as a button in the sidebar', () => {
    renderInProviders(<TestbedShell scenarios={sampleScenarios} />);
    expect(screen.getByTestId('testbed-sidebar-btn-sample-a')).not.toBeNull();
    expect(screen.getByTestId('testbed-sidebar-btn-sample-b')).not.toBeNull();
  });

  test('clicking a sidebar button switches the active scenario', async () => {
    renderInProviders(<TestbedShell scenarios={sampleScenarios} />);

    // Initially sample-a is active
    const btnB = screen.getByTestId('testbed-sidebar-btn-sample-b');
    fireEvent.click(btnB);

    const host = await screen.findByTestId('testbed-scenario-host');
    expect(within(host).getByText('Sample B')).not.toBeNull();
  });

  test('active scenario button has aria-current="page"', () => {
    renderInProviders(<TestbedShell scenarios={sampleScenarios} />);
    const btnA = screen.getByTestId('testbed-sidebar-btn-sample-a') as HTMLButtonElement;
    expect(btnA.getAttribute('aria-current')).toBe('page');
    const btnB = screen.getByTestId('testbed-sidebar-btn-sample-b') as HTMLButtonElement;
    expect(btnB.getAttribute('aria-current')).toBeNull();
  });

  test('inactive button loses aria-current after switching', async () => {
    renderInProviders(<TestbedShell scenarios={sampleScenarios} />);
    const btnB = screen.getByTestId('testbed-sidebar-btn-sample-b');
    fireEvent.click(btnB);

    await screen.findByTestId('testbed-scenario-host');
    const btnA = screen.getByTestId('testbed-sidebar-btn-sample-a') as HTMLButtonElement;
    expect(btnA.getAttribute('aria-current')).toBeNull();
    const btnBUpdated = screen.getByTestId('testbed-sidebar-btn-sample-b') as HTMLButtonElement;
    expect(btnBUpdated.getAttribute('aria-current')).toBe('page');
  });
});

// ---------------------------------------------------------------------------
// ScenarioHost: no-web-impl branch
// ---------------------------------------------------------------------------

describe('ScenarioHost — no web impl', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '#');
  });
  afterEach(cleanup);

  test('shows the no-web message for a scenario without a web impl', () => {
    const cliOnlyScenario: IScenario = {
      id: 'cli-only',
      title: 'CLI Only',
      description: 'desc',
      category: 'general',
      tags: ['test'],
      cli: {
        run: async () => succeed('ok')
      }
    };
    renderInProviders(<TestbedShell scenarios={[cliOnlyScenario]} />);
    expect(screen.getByTestId('testbed-scenario-no-web')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ScenarioHost: web impl without initialize
// ---------------------------------------------------------------------------

describe('ScenarioHost — web impl without initialize', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '#');
  });
  afterEach(cleanup);

  test('mounts the web component directly when no initialize is defined', () => {
    const scenario = makeWebScenario('instant', 'Instant Scenario');
    renderInProviders(<TestbedShell scenarios={[scenario]} />);
    expect(screen.getByTestId('synthetic-component-instant')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ScenarioHost: initialize lifecycle (loading → ready and loading → error)
// ---------------------------------------------------------------------------

describe('ScenarioHost — initialize lifecycle', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '#');
  });
  afterEach(cleanup);

  test('shows loading state while initialize is pending', async () => {
    const { scenario, resolveInit } = makeInitScenario('pending-test', 'Pending', 'pending');

    renderInProviders(<TestbedShell scenarios={[scenario]} />);

    // Should see the loading indicator immediately
    expect(screen.getByTestId('testbed-scenario-loading')).not.toBeNull();

    // Resolve the promise so the effect cleans up (avoid open handle)
    resolveInit();
    await waitFor(() => screen.getByTestId('init-component-pending-test'));
  });

  test('transitions to the component after initialize succeeds', async () => {
    const { scenario, resolveInit } = makeInitScenario('success-test', 'Success', 'succeed');

    renderInProviders(<TestbedShell scenarios={[scenario]} />);

    expect(screen.getByTestId('testbed-scenario-loading')).not.toBeNull();

    resolveInit();
    await waitFor(() => screen.getByTestId('init-component-success-test'));
    expect(screen.queryByTestId('testbed-scenario-loading')).toBeNull();
    expect(screen.queryByTestId('testbed-scenario-error')).toBeNull();
  });

  test('unmount guard: component unmounted while initialize is pending does not update state', async () => {
    // ScenarioHost is unmounted while its initialize() promise is still pending.
    // The `active = false` flag in the cleanup prevents setState after unmount.
    let resolveInitFn: () => void = () => undefined;
    const initPromise = new Promise<void>((resolve) => {
      resolveInitFn = resolve;
    });

    const component = ({ context }: { context: IScenarioContext }): React.ReactElement => (
      <div data-testid="unmount-component" data-ctx-defined={String(context !== undefined)} />
    );
    const initialize = async (ctx: IScenarioContext): Promise<Result<boolean>> => {
      ctx.logger.info('init started');
      await initPromise;
      return succeed(true);
    };

    const scenario: IScenario = {
      id: 'unmount-test',
      title: 'Unmount Test',
      description: 'desc',
      category: 'general',
      tags: ['test'],
      web: { component, initialize }
    };

    const { unmount } = renderInProviders(<TestbedShell scenarios={[scenario]} />);

    // Confirm loading state is shown
    expect(screen.getByTestId('testbed-scenario-loading')).not.toBeNull();

    // Unmount while initialize is still pending
    unmount();

    // Resolve AFTER unmount — the !active guard prevents setState
    resolveInitFn();
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Test passes if no "can't update unmounted component" React warning fires
  });

  test('shows the error panel when initialize returns a failure Result', async () => {
    const { scenario, resolveInit } = makeInitScenario('fail-test', 'Fail', 'fail');

    renderInProviders(<TestbedShell scenarios={[scenario]} />);

    expect(screen.getByTestId('testbed-scenario-loading')).not.toBeNull();

    resolveInit();
    await waitFor(() => screen.getByTestId('testbed-scenario-error'));
    const errorEl = screen.getByTestId('testbed-scenario-error');
    expect(errorEl.textContent).toContain('init failed for fail-test');
    expect(screen.queryByTestId('testbed-scenario-loading')).toBeNull();
  });

  test('remains in loading state when initialize resolves succeed(false)', async () => {
    // succeed(false) means "not ready yet" — ScenarioHost must stay in the loading state
    // and must NOT mount the web component.
    let resolveInitFn: () => void = () => undefined;
    const initPromise = new Promise<void>((resolve) => {
      resolveInitFn = resolve;
    });

    const component = ({ context }: { context: IScenarioContext }): React.ReactElement => (
      <div data-testid="false-init-component" data-ctx-defined={String(context !== undefined)} />
    );
    const initialize = async (context: IScenarioContext): Promise<Result<boolean>> => {
      // context is required by the interface; log to avoid unused-var lint error
      context.logger.info('false-init: initializing');
      await initPromise;
      return succeed(false);
    };

    const scenario: IScenario = {
      id: 'false-init-test',
      title: 'False Init Test',
      description: 'desc',
      category: 'general',
      tags: ['test'],
      web: { component, initialize }
    };

    renderInProviders(<TestbedShell scenarios={[scenario]} />);

    // While pending: loading indicator visible, component not mounted.
    expect(screen.getByTestId('testbed-scenario-loading')).not.toBeNull();
    expect(screen.queryByTestId('false-init-component')).toBeNull();

    // Resolve with succeed(false): should still show loading, not mount the component.
    resolveInitFn();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByTestId('testbed-scenario-loading')).not.toBeNull();
    expect(screen.queryByTestId('false-init-component')).toBeNull();
    expect(screen.queryByTestId('testbed-scenario-error')).toBeNull();
  });
});
