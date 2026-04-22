[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / ObservabilityProvider

# Variable: ObservabilityProvider

> `const` **ObservabilityProvider**: `React.FC`\<[`IObservabilityProviderProps`](../interfaces/IObservabilityProviderProps.md)\>

Provider component that makes observability context available to all child components.

## Example

```tsx
// Basic usage with default console logging
<ObservabilityProvider>
  <MyApp />
</ObservabilityProvider>

// Custom observability context
const customContext = ObservabilityTools.createConsoleObservabilityContext('debug', 'info');
<ObservabilityProvider observabilityContext={customContext}>
  <MyApp />
</ObservabilityProvider>

// With custom user logger that forwards to app's message system
const contextWithMessages = new ObservabilityTools.ObservabilityContext(
  new ObservabilityTools.ConsoleUserLogger('info'),
  createCallbackUserLogger((type, message) => showToast(type, message))
);
<ObservabilityProvider observabilityContext={contextWithMessages}>
  <MyApp />
</ObservabilityProvider>
```

## Param

Provider configuration

## Returns

JSX provider element
