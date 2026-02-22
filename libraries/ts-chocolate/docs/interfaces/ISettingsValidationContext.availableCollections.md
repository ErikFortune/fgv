[Home](../README.md) > [ISettingsValidationContext](./ISettingsValidationContext.md) > availableCollections

## ISettingsValidationContext.availableCollections property

The set of collection IDs available per sub-library.
Used to validate `defaultTargets`.

**Signature:**

```typescript
readonly availableCollections: Partial<Record<SubLibraryId, ReadonlySet<CollectionId>>>;
```
