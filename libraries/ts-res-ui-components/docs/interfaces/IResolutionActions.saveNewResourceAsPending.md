[Home](../README.md) > [IResolutionActions](./IResolutionActions.md) > saveNewResourceAsPending

## IResolutionActions.saveNewResourceAsPending property

Add the new resource to pending resources (not applied yet)

**Signature:**

```typescript
saveNewResourceAsPending: () => Result<{ pendingResources: Map<string, ILooseResourceDecl>; diagnostics: string[] }>;
```
