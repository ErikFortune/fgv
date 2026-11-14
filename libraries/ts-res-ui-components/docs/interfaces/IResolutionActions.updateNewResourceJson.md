[Home](../README.md) > [IResolutionActions](./IResolutionActions.md) > updateNewResourceJson

## IResolutionActions.updateNewResourceJson property

Update the JSON content for the new resource being created

**Signature:**

```typescript
updateNewResourceJson: (json: JsonValue) => Result<{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }>;
```
