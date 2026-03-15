[Home](../../README.md) > [Entities](../README.md) > [IRenderOptions](./IRenderOptions.md) > onInvalidTaskRef

## IRenderOptions.onInvalidTaskRef property

How to handle steps with invalid task references
- 'ignore': Skip rendering, use empty or placeholder description
- 'warn': Log warning, render with placeholder
- 'fail': Return Failure result
Default: 'warn'

**Signature:**

```typescript
readonly onInvalidTaskRef: ValidationBehavior;
```
