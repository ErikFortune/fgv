[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / useObservability

# Function: useObservability()

> **useObservability**(): [`IObservabilityContext`](../namespaces/ObservabilityTools/interfaces/IObservabilityContext.md)

Hook to access the current observability context.

Provides access to both diagnostic logging (for developers/debugging) and
user logging (for user-facing messages and feedback).

## Returns

[`IObservabilityContext`](../namespaces/ObservabilityTools/interfaces/IObservabilityContext.md)

The current observability context with diag and user loggers

## Example

```tsx
function MyComponent() {
  const observability = useObservability();

  const handleAction = () => {
    // Log diagnostic info for developers
    observability.diag.info('User clicked action button');

    try {
      performAction();
      // Show success message to user
      observability.user.success('Action completed successfully!');
    } catch (error) {
      // Log error for debugging
      observability.diag.error('Action failed:', error);
      // Show error to user
      observability.user.error('Action failed. Please try again.');
    }
  };

  return <button onClick={handleAction}>Perform Action</button>;
}
```
