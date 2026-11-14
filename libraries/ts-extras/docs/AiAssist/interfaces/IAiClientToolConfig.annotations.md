[Home](../../README.md) > [AiAssist](../README.md) > [IAiClientToolConfig](./IAiClientToolConfig.md) > annotations

## IAiClientToolConfig.annotations property

Optional host-advisory behavior annotations (read-only / destructive /
idempotent / open-world hints + display title). Consumed by the host's
tool loop; never serialized to the model. See AiAssist.IAiToolAnnotations.

**Signature:**

```typescript
readonly annotations: IAiToolAnnotations;
```
