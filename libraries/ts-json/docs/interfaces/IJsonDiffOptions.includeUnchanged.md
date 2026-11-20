[Home](../README.md) > [IJsonDiffOptions](./IJsonDiffOptions.md) > includeUnchanged

## IJsonDiffOptions.includeUnchanged property

If true, includes unchanged values in the result.

When enabled, the diff result will include entries with `type: 'unchanged'`
for properties that exist in both objects with identical values. This can
be useful for displaying complete side-by-side comparisons.

**Signature:**

```typescript
includeUnchanged: boolean;
```
