[Home](../README.md) > [IResolutionActions](./IResolutionActions.md) > selectResourceType

## IResolutionActions.selectResourceType property

Select a resource type for the new resource

**Signature:**

```typescript
selectResourceType: (type: string) => Result<{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }>;
```
