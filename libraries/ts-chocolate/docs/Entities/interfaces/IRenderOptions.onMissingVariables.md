[Home](../../README.md) > [Entities](../README.md) > [IRenderOptions](./IRenderOptions.md) > onMissingVariables

## IRenderOptions.onMissingVariables property

How to handle missing variables during template rendering
- 'ignore': Render with empty values for missing variables
- 'warn': Log warning, render with empty values
- 'fail': Return Failure result
Default: 'warn'

**Signature:**

```typescript
readonly onMissingVariables: ValidationBehavior;
```
