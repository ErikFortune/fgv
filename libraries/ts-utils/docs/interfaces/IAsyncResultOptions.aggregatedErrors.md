[Home](../README.md) > [IAsyncResultOptions](./IAsyncResultOptions.md) > aggregatedErrors

## IAsyncResultOptions.aggregatedErrors property

Optional aggregator to which any error messages will be appended, matching the third
parameter of the synchronous members of this family.  Each error is appended as an
individual string.

**Signature:**

```typescript
readonly aggregatedErrors: IMessageAggregator;
```
