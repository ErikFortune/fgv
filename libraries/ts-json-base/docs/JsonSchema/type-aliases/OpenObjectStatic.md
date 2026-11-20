[Home](../../README.md) > [JsonSchema](../README.md) > OpenObjectStatic

# Type Alias: OpenObjectStatic

The derived static type for an **open** object — one built with
`additionalProperties: true`. The declared properties keep their derived types, and every
other key carries a `JsonValue`, which is what the validator passes through for it.

## Type

```typescript
type OpenObjectStatic = ObjectStatic<P> & JsonObject
```
