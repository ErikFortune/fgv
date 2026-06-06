[Home](../README.md) > ObjectStatic

# Type Alias: ObjectStatic

The derived static type for an object built from properties `P`: required keys carry their
static type directly, optional keys carry theirs under a `?` modifier.

## Type

```typescript
type ObjectStatic = Simplify<{ [K in RequiredKeys<P>]: Static<P[K]> } & { [K in OptionalKeys<P>]?: OptionalPropertyStatic<P[K]> }>
```
