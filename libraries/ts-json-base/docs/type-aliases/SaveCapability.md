[Home](../README.md) > SaveCapability

# Type Alias: SaveCapability

Indicates the persistence capability of a save operation.
- `persistent`: Changes are saved to durable storage (e.g., file system).
- `transient`: Changes are saved in memory only and will be lost on reload.

## Type

```typescript
type SaveCapability = "persistent" | "transient"
```
