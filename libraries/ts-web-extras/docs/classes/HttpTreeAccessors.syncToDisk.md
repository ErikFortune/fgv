[Home](../README.md) > [HttpTreeAccessors](./HttpTreeAccessors.md) > syncToDisk

## HttpTreeAccessors.syncToDisk() method

Synchronizes all dirty files to the HTTP backend.

Uses a concurrency guard: if a sync is already in progress, callers
await the existing operation rather than starting a parallel one.
This prevents the thundering herd that occurs when autoSync fires
for every file written during a bulk operation (e.g. restore).

**Signature:**

```typescript
syncToDisk(): Promise<Result<void>>;
```

**Returns:**

Promise&lt;Result&lt;void&gt;&gt;

A promise that resolves to a result indicating success or failure.
