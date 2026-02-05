[Home](../README.md) > [ICollectionFilterInitParams](./ICollectionFilterInitParams.md) > excluded

## ICollectionFilterInitParams.excluded property

Patterns to exclude. Names matching any pattern are excluded (takes precedence over included).
Strings are matched exactly, RegExp patterns use `.test()`.

**Signature:**

```typescript
readonly excluded: readonly FilterPattern[];
```
