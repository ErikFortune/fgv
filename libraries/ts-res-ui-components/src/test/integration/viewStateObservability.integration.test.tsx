import React from 'react';
import { render } from '@testing-library/react';
import '@fgv/ts-utils-jest';
import { ObservabilityProvider, useObservability } from '../../contexts';
import * as ObservabilityTools from '../../namespaces/ObservabilityTools';
import type { IMessage } from '../../types';

// Test component that uses observability to send user messages
const TestViewStateComponent: React.FC<{ onMessage: (type: IMessage['type'], message: string) => void }> = ({
  onMessage
}) => {
  const o11y = useObservability();

  // Test all user logger methods
  React.useEffect(() => {
    o11y.user.info('Test info message');
    o11y.user.warn('Test warning message');
    o11y.user.error('Test error message');
    o11y.user.success('Test success message');

    // Also test diagnostic logging (should go to console, not onMessage)
    o11y.diag.info('Test diagnostic message');
  }, [o11y]);

  return <div data-testid="test-component">ViewState Integration Test</div>;
};

describe('ViewState Observability Integration', () => {
  test('should forward user messages to viewState while keeping diagnostics in console', () => {
    // Track messages sent to viewState
    const mockAddMessage = jest.fn();

    // Mock console methods to verify diagnostic messages
    const consoleSpy = {
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {})
    };

    try {
      // Create ViewState-connected observability context
      const viewStateContext = ObservabilityTools.createViewStateObservabilityContext(mockAddMessage);

      const { getByTestId } = render(
        <ObservabilityProvider observabilityContext={viewStateContext}>
          <TestViewStateComponent onMessage={mockAddMessage} />
        </ObservabilityProvider>
      );

      // Verify component rendered
      expect(getByTestId('test-component')).toBeInTheDocument();

      // Verify user messages were forwarded to viewState
      expect(mockAddMessage).toHaveBeenCalledWith('info', 'Test info message');
      expect(mockAddMessage).toHaveBeenCalledWith('warning', 'Test warning message');
      expect(mockAddMessage).toHaveBeenCalledWith('error', 'Test error message');
      expect(mockAddMessage).toHaveBeenCalledWith('success', 'Test success message');

      // Verify we got the expected user message calls
      expect(mockAddMessage).toHaveBeenCalledTimes(4);

      // Verify diagnostic messages went to console
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('Test diagnostic message'));
    } finally {
      // Restore console methods
      Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
    }
  });

  test('should work with default context when no viewState integration is needed', () => {
    // Mock console methods
    const consoleSpy = {
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {})
    };

    try {
      // Use default context (no viewState integration)
      const { getByTestId } = render(<TestViewStateComponent onMessage={() => {}} />);

      // Should render without errors
      expect(getByTestId('test-component')).toBeInTheDocument();

      // With default context, user messages should go to console
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('Test info message'));
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('Test warning message'));
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Test error message'));
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('Test success message'));
    } finally {
      // Restore console methods
      Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
    }
  });

  test('should properly export ViewStateUserLogger for custom implementations', () => {
    // Verify the new exports are available
    expect(ObservabilityTools.ViewStateUserLogger).toBeDefined();
    expect(ObservabilityTools.createViewStateObservabilityContext).toBeDefined();

    // Test creating a custom ViewStateUserLogger
    const mockAddMessage = jest.fn();
    const logger = new ObservabilityTools.ViewStateUserLogger(mockAddMessage);

    // Test that it implements the IUserLogger interface
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.success).toBe('function');

    // Test that messages are forwarded
    logger.info('test message');
    logger.success('success message');

    expect(mockAddMessage).toHaveBeenCalledWith('info', 'test message');
    expect(mockAddMessage).toHaveBeenCalledWith('success', 'success message');
  });
});
