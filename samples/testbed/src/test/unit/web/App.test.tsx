// @fgv/ts-extras-transformers imports @huggingface/transformers which uses Node-native
// modules incompatible with jsdom. Mock it here so the App component (which transitively
// imports the classifier scenario) can render in the test environment.
jest.mock('@fgv/ts-extras-transformers');

import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { App, TestbedShell } from '../../../web/App';
import { MessagesProvider, ResponsiveProvider } from '@fgv/ts-app-shell';
import type { IScenario } from '../../../shell';

const sampleScenarios: readonly IScenario[] = [
  {
    id: 'sample-a',
    title: 'Sample A',
    description: 'Synthetic scenario used by the shell tests.',
    category: 'general',
    tags: ['test']
  },
  {
    id: 'sample-b',
    title: 'Sample B',
    description: 'A second synthetic scenario.',
    category: 'general',
    tags: ['test']
  }
];

function renderInProviders(node: React.ReactElement): void {
  render(
    <ResponsiveProvider>
      <MessagesProvider>{node}</MessagesProvider>
    </ResponsiveProvider>
  );
}

describe('App (testbed web shell, B-1)', () => {
  test('App composes the full provider stack and renders the shell regions', () => {
    render(<App />);
    // getByTestId throws if missing, so a successful call equals "is in the document".
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
    // Drives the useUrlSync callbacks (setMode/setTab) so the URL-sync wiring is exercised.
    window.history.replaceState(null, '', '#/scenarios/sample-a');
    renderInProviders(<TestbedShell scenarios={sampleScenarios} />);

    // Simulate a back/forward navigation to scenario B.
    window.history.pushState(null, '', '#/scenarios/sample-b');
    window.dispatchEvent(new PopStateEvent('popstate'));

    const host = await screen.findByTestId('testbed-scenario-host');
    expect(within(host).getByText('Sample B')).not.toBeNull();
    expect(within(host).getByText('A second synthetic scenario.')).not.toBeNull();
  });
});
