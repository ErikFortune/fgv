[Home](../README.md) > [IResolutionActions](./IResolutionActions.md) > startNewResource

## IResolutionActions.startNewResource property

Start creating a new resource (enhanced with optional pre-seeding)

**Signature:**

```typescript
startNewResource: (params?: IStartNewResourceParams<unknown, JsonValue>) => Result<{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }>;
```
