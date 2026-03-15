[Home](../README.md) > LocationId

# Type Alias: LocationId

Globally unique location identifier (composite)
Format: "collectionId.baseLocationId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/

## Type

```typescript
type LocationId = Brand<string, "LocationId">
```
