[Home](../README.md) > [ResourceBuilder](./ResourceBuilder.md) > resourceType

## ResourceBuilder.resourceType property

Supplied or inferred ResourceTypes.ResourceType | type of the resource being built.
If no type is supplied, the type will be inferred from the candidates - at least one candidate must
define resource type and all candidates must be of the same type.

**Signature:**

```typescript
readonly resourceType: ResourceType<unknown> | undefined;
```
