[Home](../README.md) > [IProcedure](./IProcedure.md) > getSteps

## IProcedure.getSteps() method

Gets the procedure steps with fully materialized runtime tasks.
Resolution is lazy (on first call) and cached.

**Signature:**

```typescript
getSteps(): Result<readonly IResolvedProcedureStep[]>;
```

**Returns:**

Result&lt;readonly [IResolvedProcedureStep](IResolvedProcedureStep.md)[]&gt;

Success with resolved steps, or Failure if task materialization fails
