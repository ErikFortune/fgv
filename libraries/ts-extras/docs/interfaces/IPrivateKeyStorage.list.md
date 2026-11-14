[Home](../README.md) > [IPrivateKeyStorage](./IPrivateKeyStorage.md) > list

## IPrivateKeyStorage.list() method

Lists every `id` currently held by the backend. Used by consumers to
garbage-collect orphans left by crashes or aborted sessions; the
keystore itself does not invoke this automatically.

**Signature:**

```typescript
list(): Promise<Result<readonly string[]>>;
```

**Returns:**

Promise&lt;Result&lt;readonly string[]&gt;&gt;
