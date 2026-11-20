[Home](../../README.md) > [Helpers](../README.md) > joinResourceIds

# Function: joinResourceIds

Joins a list of ResourceId | resource ID or ResourceName | resource name with
to create a new ResourceId | resource ID. Fails if resulting ID is invalid or empty.

## Signature

```typescript
function joinResourceIds(ids: (string | undefined)[]): Result<ResourceId>
```
