import '@fgv/ts-utils-jest';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Logging, fail, succeed, type Result } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { ScenarioRunnerPanel } from '../../../web/ScenarioRunnerPanel';
import type { ICliScenarioImpl, IScenario, IScenarioContext, ISecretSpec } from '../../../shell';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECRET_A: ISecretSpec = { id: 'secret-a', envVarName: 'SECRET_A', description: 'Secret A' };
const SECRET_B: ISecretSpec = { id: 'secret-b', envVarName: 'SECRET_B', description: 'Secret B' };

function makeContext(resolveSecret: IScenarioContext['resolveSecret']): IScenarioContext {
  return {
    logger: new Logging.LogReporter<unknown>({ logger: new Logging.InMemoryLogger() }),
    keyStore: undefined,
    resolveSecret,
    dataTree: FileTree.inMemory([]).orThrow()
  };
}

function makeScenario(run: ICliScenarioImpl['run'], requiredSecrets?: readonly ISecretSpec[]): IScenario {
  return {
    id: 'runner-probe',
    title: 'Runner Probe',
    description: 'desc',
    category: 'ai',
    tags: ['test'],
    requiredSecrets,
    cli: { run, webRunnable: true }
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScenarioRunnerPanel', () => {
  afterEach(cleanup);

  test('shows "no secrets required" for a scenario with no requiredSecrets', () => {
    const scenario = makeScenario(async () => succeed('ok'));
    const context = makeContext(async () => fail<string>('unused'));
    render(<ScenarioRunnerPanel scenario={scenario} context={context} />);
    expect(screen.getByTestId('testbed-runner-no-secrets')).not.toBeNull();
  });

  test('resolves and shows a "ready" status for a configured secret', async () => {
    const scenario = makeScenario(async () => succeed('ok'), [SECRET_A]);
    const context = makeContext(async () => succeed('configured-value'));
    render(<ScenarioRunnerPanel scenario={scenario} context={context} />);
    await waitFor(() =>
      expect(screen.getByTestId('testbed-runner-secret-secret-a').textContent).toMatch(/configured/)
    );
  });

  test('resolves and shows a "missing" status with the open-Secrets affordance', async () => {
    const scenario = makeScenario(async () => succeed('ok'), [SECRET_A]);
    const context = makeContext(async (spec) => fail<string>(`${spec.id} not set`));
    render(<ScenarioRunnerPanel scenario={scenario} context={context} />);
    await waitFor(() =>
      expect(screen.getByTestId('testbed-runner-secret-secret-a').textContent).toMatch(/not set/)
    );
    expect(screen.getByTestId('testbed-runner-secret-secret-a').textContent).toMatch(/Secrets/);
  });

  test('resolves multiple secrets independently', async () => {
    const scenario = makeScenario(async () => succeed('ok'), [SECRET_A, SECRET_B]);
    const context = makeContext(async (spec) =>
      spec.id === 'secret-a' ? succeed('a-value') : fail<string>(`${spec.id} not set`)
    );
    render(<ScenarioRunnerPanel scenario={scenario} context={context} />);
    await waitFor(() =>
      expect(screen.getByTestId('testbed-runner-secret-secret-a').textContent).toMatch(/configured/)
    );
    expect(screen.getByTestId('testbed-runner-secret-secret-b').textContent).toMatch(/not set/);
  });

  test('re-resolves secret statuses when the resolveSecret identity changes', async () => {
    const scenario = makeScenario(async () => succeed('ok'), [SECRET_A]);
    const context1 = makeContext(async () => fail<string>('secret-a not set'));
    const { rerender } = render(<ScenarioRunnerPanel scenario={scenario} context={context1} />);
    await waitFor(() =>
      expect(screen.getByTestId('testbed-runner-secret-secret-a').textContent).toMatch(/not set/)
    );

    const context2 = makeContext(async () => succeed('now-configured'));
    rerender(<ScenarioRunnerPanel scenario={scenario} context={context2} />);
    await waitFor(() =>
      expect(screen.getByTestId('testbed-runner-secret-secret-a').textContent).toMatch(/configured/)
    );
  });

  test('clicking Run shows the running state, then the success report', async () => {
    let resolveRun: (result: Result<string>) => void = () => undefined;
    const runPromise = new Promise<Result<string>>((resolve) => {
      resolveRun = resolve;
    });
    const scenario = makeScenario(async () => runPromise);
    const context = makeContext(async () => fail<string>('unused'));
    render(<ScenarioRunnerPanel scenario={scenario} context={context} />);

    const runBtn = screen.getByTestId('testbed-runner-run-btn') as HTMLButtonElement;
    fireEvent.click(runBtn);

    expect(runBtn.disabled).toBe(true);
    expect(runBtn.textContent).toBe('Running…');
    expect(screen.getByTestId('testbed-runner-elapsed')).not.toBeNull();

    resolveRun(succeed('scenario report text'));
    await waitFor(() => screen.getByTestId('testbed-runner-success'));
    expect(screen.getByTestId('testbed-runner-success').textContent).toContain('scenario report text');
    expect((screen.getByTestId('testbed-runner-run-btn') as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByTestId('testbed-runner-elapsed')).toBeNull();
  });

  test('the elapsed-time display ticks while a run is in flight', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    try {
      let resolveRun: (result: Result<string>) => void = () => undefined;
      const runPromise = new Promise<Result<string>>((resolve) => {
        resolveRun = resolve;
      });
      const scenario = makeScenario(async () => runPromise);
      const context = makeContext(async () => fail<string>('unused'));
      render(<ScenarioRunnerPanel scenario={scenario} context={context} />);

      fireEvent.click(screen.getByTestId('testbed-runner-run-btn'));
      expect(screen.getByTestId('testbed-runner-elapsed').textContent).toBe('0.0s elapsed');

      act(() => {
        jest.advanceTimersByTime(450);
      });
      expect(screen.getByTestId('testbed-runner-elapsed').textContent).not.toBe('0.0s elapsed');

      resolveRun(succeed('done'));
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });
    } finally {
      jest.useRealTimers();
    }
  });

  test('clicking Run shows the failure report when the scenario fails', async () => {
    const scenario = makeScenario(async () => fail<string>('boom: the scenario failed'));
    const context = makeContext(async () => fail<string>('unused'));
    render(<ScenarioRunnerPanel scenario={scenario} context={context} />);

    fireEvent.click(screen.getByTestId('testbed-runner-run-btn'));
    await waitFor(() => screen.getByTestId('testbed-runner-failure'));
    expect(screen.getByTestId('testbed-runner-failure').textContent).toContain('boom: the scenario failed');
  });

  test('running again after a completed run replaces the previous report', async () => {
    let call = 0;
    const scenario = makeScenario(async () => {
      call += 1;
      return call === 1 ? succeed('first run') : succeed('second run');
    });
    const context = makeContext(async () => fail<string>('unused'));
    render(<ScenarioRunnerPanel scenario={scenario} context={context} />);

    fireEvent.click(screen.getByTestId('testbed-runner-run-btn'));
    await waitFor(() => screen.getByTestId('testbed-runner-success'));
    expect(screen.getByTestId('testbed-runner-success').textContent).toContain('first run');

    fireEvent.click(screen.getByTestId('testbed-runner-run-btn'));
    await waitFor(() =>
      expect(screen.getByTestId('testbed-runner-success').textContent).toContain('second run')
    );
  });

  test('unmounting while a run is in flight does not update state after unmount', async () => {
    let resolveRun: (result: Result<string>) => void = () => undefined;
    const runPromise = new Promise<Result<string>>((resolve) => {
      resolveRun = resolve;
    });
    const scenario = makeScenario(async () => runPromise);
    const context = makeContext(async () => fail<string>('unused'));
    const { unmount } = render(<ScenarioRunnerPanel scenario={scenario} context={context} />);

    fireEvent.click(screen.getByTestId('testbed-runner-run-btn'));
    unmount();

    // Resolve AFTER unmount — the mountedRef guard prevents setState on an unmounted component.
    resolveRun(succeed('too late'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Test passes if no "can't update unmounted component" React warning fires.
  });
});

describe('ScenarioRunnerPanel under React.StrictMode', () => {
  afterEach(cleanup);

  // Regression: same StrictMode cleanup-only mounted-ref hazard as KeyStoreSection — a run
  // completion must still reach state when the app renders inside <React.StrictMode>.
  test('a run completes to the success report when rendered inside StrictMode', async () => {
    const scenario = makeScenario(async () => succeed('strict-mode report'));
    const context = makeContext(async () => fail<string>('unused'));
    render(
      <React.StrictMode>
        <ScenarioRunnerPanel scenario={scenario} context={context} />
      </React.StrictMode>
    );

    fireEvent.click(screen.getByTestId('testbed-runner-run-btn'));
    await waitFor(() => screen.getByTestId('testbed-runner-success'));
    expect(screen.getByTestId('testbed-runner-success').textContent).toContain('strict-mode report');
  });
});
