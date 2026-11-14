[Home](../README.md) > [IResourceDeclarationOptions](./IResourceDeclarationOptions.md) > filterForContext

## IResourceDeclarationOptions.filterForContext property

If provided, filters resource candidates to only include those that can match the
specified validated context. This provides strongly-typed context filtering.

Use resourceManager.validateContext() to create a validated context from an IContextDecl.

**Signature:**

```typescript
filterForContext: IValidatedContextDecl;
```
