[Home](../../README.md) > [Converters](../README.md) > idsWithPreferred

# Function: idsWithPreferred

Creates a converter for Model.IIdsWithPreferred | IIdsWithPreferred\<TId\> collections.
Validates that preferredId (if specified) exists in the ids array.

## Signature

```typescript
function idsWithPreferred(idConverter: Converter<TId>, context: string): Converter<IIdsWithPreferred<TId>>
```
