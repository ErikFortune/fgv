[Home](../README.md) > [Failure](./Failure.md) > withType

## Failure.withType() method

Re-types this Failure | Failure<T> as Failure | Failure<U> for
propagation under a different success type.

**Signature:**

```typescript
withType(): Failure<U>;
```

**Returns:**

[Failure](Failure.md)&lt;U&gt;

This same Failure instance, statically retyped as
Failure | Failure<U>.
