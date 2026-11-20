[Home](../README.md) > [IAiModelCapabilityRule](./IAiModelCapabilityRule.md) > displayName

## IAiModelCapabilityRule.displayName property

Friendly display-name override for matching models. The function form
lets one rule format many ids (e.g. `(id) => id.toUpperCase()`).
If multiple matching rules supply `displayName`, the first match wins.

**Signature:**

```typescript
readonly displayName: string | ((id: string) => string);
```
