[Home](../README.md) > useSmartObservability

# Function: useSmartObservability

Smart observability hook that automatically provides the best available observability context.

This hook detects the current observability context type and:
- Uses ViewState-connected context when available (best experience)
- Auto-creates ViewState connection when only console context is available
- Preserves custom contexts provided by consumers
- Provides helpful warnings for suboptimal configurations

## Signature

```typescript
function useSmartObservability(): IObservabilityContext
```
