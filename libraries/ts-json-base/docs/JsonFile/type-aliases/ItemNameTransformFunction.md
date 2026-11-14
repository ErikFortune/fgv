[Home](../../README.md) > [JsonFile](../README.md) > ItemNameTransformFunction

# Type Alias: ItemNameTransformFunction

Function to transform the name of a some entity, given an original name
and the contents of the entity.

## Type

```typescript
type ItemNameTransformFunction = (name: string, item: T) => Result<string>
```
