[Home](../README.md) > FillingVersionId

# Type Alias: FillingVersionId

Globally unique filling recipe version identifier (composite)
Format: "fillingId@versionSpec" where fillingId is "collectionId.baseFillingId"
Examples: "user.ganache@2026-01-03-01", "felchlin.truffle@2026-01-03-02-less-sugar"

## Type

```typescript
type FillingVersionId = Brand<string, "FillingVersionId">
```
