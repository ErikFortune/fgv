import '@fgv/ts-utils-jest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ResponsiveProvider } from '@fgv/ts-app-shell';

import { SecretsModal } from '../../../web/SecretsModal';
import type { IScenario } from '../../../shell';

function renderInProviders(node: React.ReactElement): ReturnType<typeof render> {
  return render(<ResponsiveProvider>{node}</ResponsiveProvider>);
}

const SCENARIO_WITH_SECRETS: IScenario = {
  id: 'needs-secrets',
  title: 'Needs Secrets',
  description: 'desc',
  category: 'ai',
  tags: [],
  requiredSecrets: [
    { id: 'openai-api-key', envVarName: 'OPENAI_API_KEY', description: 'OpenAI key' },
    { id: 'anthropic-api-key', envVarName: 'ANTHROPIC_API_KEY', description: 'Anthropic key' }
  ]
};

const SCENARIO_NO_SECRETS: IScenario = {
  id: 'no-secrets',
  title: 'No Secrets',
  description: 'desc',
  category: 'general',
  tags: []
};

describe('SecretsModal', () => {
  afterEach(cleanup);

  test('renders nothing (Modal returns null) when isOpen is false', () => {
    renderInProviders(
      <SecretsModal
        isOpen={false}
        onClose={() => undefined}
        scenarios={[SCENARIO_WITH_SECRETS]}
        secrets={new Map()}
        onSetSecret={() => undefined}
      />
    );
    expect(screen.queryByTestId('testbed-secrets-modal')).toBeNull();
  });

  test('shows the empty state when no scenario declares a required secret', () => {
    renderInProviders(
      <SecretsModal
        isOpen={true}
        onClose={() => undefined}
        scenarios={[SCENARIO_NO_SECRETS]}
        secrets={new Map()}
        onSetSecret={() => undefined}
      />
    );
    expect(screen.getByTestId('testbed-secrets-empty')).not.toBeNull();
  });

  test('renders one field per deduped required secret', () => {
    renderInProviders(
      <SecretsModal
        isOpen={true}
        onClose={() => undefined}
        scenarios={[SCENARIO_WITH_SECRETS]}
        secrets={new Map()}
        onSetSecret={() => undefined}
      />
    );
    expect(screen.getByTestId('testbed-secret-field-openai-api-key')).not.toBeNull();
    expect(screen.getByTestId('testbed-secret-field-anthropic-api-key')).not.toBeNull();
  });

  test('reflects the current secret value in the input', () => {
    renderInProviders(
      <SecretsModal
        isOpen={true}
        onClose={() => undefined}
        scenarios={[SCENARIO_WITH_SECRETS]}
        secrets={new Map([['openai-api-key', 'sk-test']])}
        onSetSecret={() => undefined}
      />
    );
    const input = screen.getByTestId('testbed-secret-input-openai-api-key') as HTMLInputElement;
    expect(input.value).toBe('sk-test');
  });

  test('typing into a field calls onSetSecret with the id and new value', () => {
    const onSetSecret = jest.fn();
    renderInProviders(
      <SecretsModal
        isOpen={true}
        onClose={() => undefined}
        scenarios={[SCENARIO_WITH_SECRETS]}
        secrets={new Map()}
        onSetSecret={onSetSecret}
      />
    );
    const input = screen.getByTestId('testbed-secret-input-openai-api-key');
    fireEvent.change(input, { target: { value: 'sk-new' } });
    expect(onSetSecret).toHaveBeenCalledWith('openai-api-key', 'sk-new');
  });

  test('clicking the modal close button calls onClose', () => {
    const onClose = jest.fn();
    renderInProviders(
      <SecretsModal
        isOpen={true}
        onClose={onClose}
        scenarios={[SCENARIO_WITH_SECRETS]}
        secrets={new Map()}
        onSetSecret={() => undefined}
      />
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
