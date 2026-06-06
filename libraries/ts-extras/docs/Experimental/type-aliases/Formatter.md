[Home](../../README.md) > [Experimental](../README.md) > Formatter

# Type Alias: Formatter

Type definition for a formatting function, which takes a `string` and an
item and returns `Result<string>`.

## Type

```typescript
type Formatter = (format: string, item: T) => Result<string>
```
