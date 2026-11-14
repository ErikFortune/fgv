[Home](../README.md) > joinOptionalResourceIds

# Function: joinOptionalResourceIds

Joins a list of ResourceId | resource ID or ResourceName | resource name with
to create a new ResourceId | resource ID. Returns `undefined` if no names are defined.

## Signature

```typescript
function joinOptionalResourceIds(ids: (string | undefined)[]): Result<ResourceId | undefined>
```
