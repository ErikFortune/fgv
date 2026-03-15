[Home](../../README.md) > [LibraryData](../README.md) > [ILibraryLoadParams](./ILibraryLoadParams.md) > excluded

## ILibraryLoadParams.excluded property

Patterns to exclude. Collection names matching any pattern are excluded (takes precedence over included).
Strings are matched exactly, RegExp patterns use `.test()`.

**Signature:**

```typescript
readonly excluded: readonly FilterPattern[];
```
