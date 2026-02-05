[Home](../README.md) > [IEditorContextParams](./IEditorContextParams.md) > getBaseId

## IEditorContextParams.getBaseId property

Function to extract base ID from entity.
Required to support ID generation and uniqueness checking.

**Signature:**

```typescript
readonly getBaseId: (entity: T) => TBaseId | undefined;
```
