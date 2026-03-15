[Home](../README.md) > [IEditorContextParams](./IEditorContextParams.md) > semanticValidator

## IEditorContextParams.semanticValidator property

Optional semantic validator for cross-field and business rules.
Runs on pre-validated entities.

**Signature:**

```typescript
readonly semanticValidator: (entity: T) => Result<T>;
```
