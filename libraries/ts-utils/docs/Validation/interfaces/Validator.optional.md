[Home](../../README.md) > [Validation](../README.md) > [Validator](./Validator.md) > optional

## Validator.optional() method

Creates an Validation.Validator | in-place validator
which is derived from this one but which also matches `undefined`.

**Signature:**

```typescript
optional(): Validator<T | undefined, TC>;
```

**Returns:**

[Validator](../../interfaces/Validator.md)&lt;T | undefined, TC&gt;
