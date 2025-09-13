import React from 'react';
import { render } from '@testing-library/react';
import '@fgv/ts-utils-jest';
import { ObservabilityProvider, useObservability } from '../../contexts';
import * as ObservabilityTools from '../../namespaces/ObservabilityTools';

// Test component that uses observability
const TestComponent: React.FC = () => {
  const o11y = useObservability();

  // Log some diagnostic messages
  o11y.diag.info('Test component rendered');
  o11y.diag.warn('Test warning message');
  o11y.user.success('Test user message');

  return <div data-testid="test-component">Test Component</div>;
};

describe('Observability Integration', () => {
  test('should provide observability context to components', () => {
    // Use the test observability context
    const testContext = ObservabilityTools.TestObservabilityContext;

    const { getByTestId } = render(
      <ObservabilityProvider observabilityContext={testContext}>
        <TestComponent />
      </ObservabilityProvider>
    );

    // Verify component rendered
    expect(getByTestId('test-component')).toBeInTheDocument();
  });

  test('should work with default observability context', () => {
    // Mock console methods to verify they're called instead of letting them spew
    const consoleSpy = {
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {})
    };

    try {
      // Test that components work with default context (no provider)
      const { getByTestId } = render(<TestComponent />);

      // Should render without errors even with default context
      expect(getByTestId('test-component')).toBeInTheDocument();

      // Verify console methods were called (proves default context is working)
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('Test component rendered'));
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('Test warning message'));
      // User success messages use console.info, not console.log
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('Test user message'));
    } finally {
      // Restore console methods
      Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
    }
  });

  test('should create console observability context', () => {
    // Test the observability factory
    const context = ObservabilityTools.createConsoleObservabilityContext('info', 'info');

    expect(context).toBeDefined();
    expect(context.diag).toBeDefined();
    expect(context.user).toBeDefined();
    expect(typeof context.diag.info).toBe('function');
    expect(typeof context.diag.warn).toBe('function');
    expect(typeof context.diag.error).toBe('function');
    expect(typeof context.user.info).toBe('function');
    expect(typeof context.user.warn).toBe('function');
    expect(typeof context.user.error).toBe('function');
    expect(typeof context.user.success).toBe('function');
  });

  test('should work with no-op observability context', () => {
    // Test the no-op context
    const noOpContext = ObservabilityTools.createNoOpObservabilityContext();

    const { getByTestId } = render(
      <ObservabilityProvider observabilityContext={noOpContext}>
        <TestComponent />
      </ObservabilityProvider>
    );

    // Should render without errors
    expect(getByTestId('test-component')).toBeInTheDocument();
  });
});
