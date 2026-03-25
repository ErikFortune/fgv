[Home](../README.md) > [PopulateObjectOptions](./PopulateObjectOptions.md) > suppressUndefined

## PopulateObjectOptions.suppressUndefined property

Specify handling of `undefined` values.  By default, successful
`undefined` results are written to the result object.  If this value
is `true` then `undefined` results are suppressed for all properties.
If this value is an array of property keys then `undefined` results
are suppressed for those properties only.

**Signature:**

```typescript
suppressUndefined: boolean | (keyof T)[];
```
