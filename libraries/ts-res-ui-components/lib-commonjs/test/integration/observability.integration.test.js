'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importDefault(require('react'));
const react_2 = require('@testing-library/react');
require('@fgv/ts-utils-jest');
const contexts_1 = require('../../contexts');
const ObservabilityTools = tslib_1.__importStar(require('../../namespaces/ObservabilityTools'));
// Test component that uses observability
const TestComponent = () => {
  const o11y = (0, contexts_1.useObservability)();
  // Log some diagnostic messages
  o11y.diag.info('Test component rendered');
  o11y.diag.warn('Test warning message');
  o11y.user.success('Test user message');
  return react_1.default.createElement('div', { 'data-testid': 'test-component' }, 'Test Component');
};
describe('Observability Integration', () => {
  test('should provide observability context to components', () => {
    // Use the test observability context
    const testContext = ObservabilityTools.TestObservabilityContext;
    const { getByTestId } = (0, react_2.render)(
      react_1.default.createElement(
        contexts_1.ObservabilityProvider,
        { observabilityContext: testContext },
        react_1.default.createElement(TestComponent, null)
      )
    );
    // Verify component rendered
    expect(getByTestId('test-component')).toBeInTheDocument();
  });
  test('should work with default observability context', () => {
    // Test that components work with default context (no provider)
    const { getByTestId } = (0, react_2.render)(react_1.default.createElement(TestComponent, null));
    // Should render without errors even with default context
    expect(getByTestId('test-component')).toBeInTheDocument();
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
    const { getByTestId } = (0, react_2.render)(
      react_1.default.createElement(
        contexts_1.ObservabilityProvider,
        { observabilityContext: noOpContext },
        react_1.default.createElement(TestComponent, null)
      )
    );
    // Should render without errors
    expect(getByTestId('test-component')).toBeInTheDocument();
  });
});
//# sourceMappingURL=observability.integration.test.js.map
