[Home](../../README.md) > [Editing](../README.md) > [ValidatingEditorContext](./ValidatingEditorContext.md) > validating

## ValidatingEditorContext.validating property

Access validating methods that accept raw input.
Methods on this property validate using converters before delegating to base methods.

Usage:
- context.create(baseId, entity) - base method, requires pre-validated TBaseId and T
- context.validating.create(rawId, rawEntity) - validates string and unknown, then delegates

**Signature:**

```typescript
readonly validating: IEditorContextValidator<T, TBaseId, TId>;
```
