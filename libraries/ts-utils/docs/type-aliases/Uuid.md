[Home](../README.md) > Uuid

# Type Alias: Uuid

A canonical UUIDv4 string: 8-4-4-4-12 lowercase hex digits with version
nibble `4` and variant nibble in `[89ab]`. Produced by generateUuid
and validated by isValidUuid.

## Type

```typescript
type Uuid = Brand<string, "Uuid">
```
