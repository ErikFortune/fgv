[Home](../../README.md) > [ObservabilityTools](../README.md) > createViewStateObservabilityContext

# Function: createViewStateObservabilityContext

Creates an observability context that forwards user messages to viewState.addMessage().
This bridges the observability system with React component state management.

## Signature

```typescript
function createViewStateObservabilityContext(addMessage: (type: "error" | "success" | "info" | "warning", message: string) => void, diagLogLevel: ReporterLogLevel, userLogLevel: ReporterLogLevel): IObservabilityContext
```
