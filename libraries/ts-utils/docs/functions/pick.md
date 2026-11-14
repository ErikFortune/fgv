[Home](../README.md) > pick

# Function: pick

Simple implicit pick function, which picks a set of properties from a supplied
object.  Ignores picked properties that do not exist regardless of type signature.

## Signature

```typescript
function pick(from: T, include: K[]): Pick<T, K>
```
