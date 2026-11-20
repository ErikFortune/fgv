[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / useSmartObservability

# Function: useSmartObservability()

> **useSmartObservability**(): [`IObservabilityContext`](../namespaces/ObservabilityTools/interfaces/IObservabilityContext.md)

Smart observability hook that automatically provides the best available observability context.

This hook detects the current observability context type and:
- Uses ViewState-connected context when available (best experience)
- Auto-creates ViewState connection when only console context is available
- Preserves custom contexts provided by consumers
- Provides helpful warnings for suboptimal configurations

## Returns

[`IObservabilityContext`](../namespaces/ObservabilityTools/interfaces/IObservabilityContext.md)

The most appropriate observability context for the current component tree

## Example

```tsx
// In a component that needs user feedback in the UI
const MyComponent = () => {
  const o11y = useSmartObservability();

  const handleAction = () => {
    o11y.user.success('Action completed successfully!');
  };

  return <button onClick={handleAction}>Do Something</button>;
};
```
