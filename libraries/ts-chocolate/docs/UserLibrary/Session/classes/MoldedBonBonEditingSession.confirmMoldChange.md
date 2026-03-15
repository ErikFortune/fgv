[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [MoldedBonBonEditingSession](./MoldedBonBonEditingSession.md) > confirmMoldChange

## MoldedBonBonEditingSession.confirmMoldChange() method

Confirms pending mold change and rescales fillings.
Call analyzeMoldChange() first to set up the pending change.

**Signature:**

```typescript
confirmMoldChange(): Result<undefined>;
```

**Returns:**

Result&lt;undefined&gt;

Success with undefined, or Failure if no pending change or update fails
