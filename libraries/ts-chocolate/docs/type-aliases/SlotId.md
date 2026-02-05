[Home](../README.md) > SlotId

# Type Alias: SlotId

Unique identifier for a filling slot within a confection or recipe
Character restrictions: alphanumeric, dashes, underscores only (no dots)
Pattern: /^[a-zA-Z0-9_-]+$/
Examples: "center", "outer-layer", "layer1"

## Type

```typescript
type SlotId = Brand<string, "SlotId">
```
