[Home](../README.md) > [IValidatingEditorContext](./IValidatingEditorContext.md) > validating

## IValidatingEditorContext.validating property

Access validating methods that accept raw input.
Methods on this property validate using converters before delegating to base methods.

**Signature:**

```typescript
readonly validating: IEditorContextValidator<T, TBaseId, TId>;
```
