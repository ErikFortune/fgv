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
    { id: 'provider:openai', envVarName: 'OPENAI_API_KEY', description: 'OpenAI key' },
    { id: 'provider:anthropic', envVarName: 'ANTHROPIC_API_KEY', description: 'Anthropic key' },
    {
      id: 'provider:google-gemini',
      envVarName: 'GEMINI_API_KEY',
      fallbackEnvVarNames: ['GOOGLE_API_KEY'],
      description: 'Gemini key'
    }
  ]
};

const SCENARIO_NO_SECRETS: IScenario = {
  id: 'no-secrets',
  title: 'No Secrets',
  description: 'desc',
  category: 'general',
  tags: []
};

/** The KeyStore-related props, factored out since every test below needs them. */
const KEYSTORE_PROPS = {
  keyStore: undefined,
  onKeyStoreUnlocked: () => undefined,
  onKeyStoreLocked: () => undefined
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
        {...KEYSTORE_PROPS}
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
        {...KEYSTORE_PROPS}
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
        {...KEYSTORE_PROPS}
      />
    );
    expect(screen.getByTestId('testbed-secret-field-provider:openai')).not.toBeNull();
    expect(screen.getByTestId('testbed-secret-field-provider:anthropic')).not.toBeNull();
    expect(screen.getByTestId('testbed-secret-field-provider:google-gemini')).not.toBeNull();
  });

  test('a spec with fallbackEnvVarNames lists every env var in the placeholder', () => {
    renderInProviders(
      <SecretsModal
        isOpen={true}
        onClose={() => undefined}
        scenarios={[SCENARIO_WITH_SECRETS]}
        secrets={new Map()}
        onSetSecret={() => undefined}
        {...KEYSTORE_PROPS}
      />
    );
    const input = screen.getByTestId('testbed-secret-input-provider:google-gemini') as HTMLInputElement;
    expect(input.placeholder).toBe(
      'Falls back to GEMINI_API_KEY/GOOGLE_API_KEY (CLI only — not read in the browser)'
    );
  });

  test('reflects the current secret value in the input', () => {
    renderInProviders(
      <SecretsModal
        isOpen={true}
        onClose={() => undefined}
        scenarios={[SCENARIO_WITH_SECRETS]}
        secrets={new Map([['provider:openai', 'sk-test']])}
        onSetSecret={() => undefined}
        {...KEYSTORE_PROPS}
      />
    );
    const input = screen.getByTestId('testbed-secret-input-provider:openai') as HTMLInputElement;
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
        {...KEYSTORE_PROPS}
      />
    );
    const input = screen.getByTestId('testbed-secret-input-provider:openai');
    fireEvent.change(input, { target: { value: 'sk-new' } });
    expect(onSetSecret).toHaveBeenCalledWith('provider:openai', 'sk-new');
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
        {...KEYSTORE_PROPS}
      />
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
