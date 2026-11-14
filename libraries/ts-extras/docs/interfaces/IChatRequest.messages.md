[Home](../README.md) > [IChatRequest](./IChatRequest.md) > messages

## IChatRequest.messages property

The ordered conversation turns. Must be non-empty; the last entry is the
current `user` turn and the preceding entries are history.

**Signature:**

```typescript
readonly messages: readonly IChatMessage[];
```
