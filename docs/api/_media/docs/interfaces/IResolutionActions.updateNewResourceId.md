[Home](../README.md) > [IResolutionActions](./IResolutionActions.md) > updateNewResourceId

## IResolutionActions.updateNewResourceId property

Update the resource ID for the new resource being created

**Signature:**

```typescript
updateNewResourceId: (id: string) => Result<{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }>;
```
