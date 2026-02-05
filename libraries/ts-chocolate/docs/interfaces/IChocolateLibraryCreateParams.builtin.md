[Home](../README.md) > [IChocolateLibraryCreateParams](./IChocolateLibraryCreateParams.md) > builtin

## IChocolateLibraryCreateParams.builtin property

LibraryData.FullLibraryLoadSpec | Specifies built-in data loading for each sub-library.

- `true` (default): Load all built-ins for all sub-libraries
- `false`: Load no built-ins
- Per-sub-library control with `ingredients`, `recipes`, or `default` keys

**Signature:**

```typescript
readonly builtin: FullLibraryLoadSpec;
```
