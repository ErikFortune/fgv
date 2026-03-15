[Home](../../README.md) > [Entities](../README.md) > [ITaskRefEntity](./ITaskRefEntity.md) > params

## ITaskRefEntity.params property

Parameter values to pass to the task template.
Keys are variable names, values can be primitives or nested objects.
Common values are flat (e.g., temp: 45)
Complex data can be dotted (e.g., ingredient: name: 'chocolate', type: 'dark')

**Signature:**

```typescript
readonly params: Record<string, unknown>;
```
