[Home](../README.md) > [PopulateObjectOptions](./PopulateObjectOptions.md) > order

## PopulateObjectOptions.order property

If present, specifies the order in which property values should
be evaluated.  Any keys not listed are evaluated after all listed
keys in indeterminate order.  If 'order' is not present, keys
are evaluated in indeterminate order.

**Signature:**

```typescript
order: (keyof T)[];
```
