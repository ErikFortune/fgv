[Home](../README.md) > jsonEquals

# Function: jsonEquals

A simpler helper function that returns true if two JSON values are deeply equal.

This function provides a fast boolean check for JSON equality without the overhead
of tracking individual changes. It performs the same deep comparison logic as
Diff.jsonDiff but returns only a true/false result, making it ideal for
conditional logic and validation scenarios.

**Key Features:**
- Deep recursive comparison of all nested structures
- Handles all JSON types: objects, arrays, primitives, null
- Object property order independence
- Array order significance (index positions matter)
- Performance optimized for equality checking

**Use Cases:**
- Conditional logic based on data equality
- Input validation and testing assertions
- Caching and memoization keys
- Quick checks before expensive diff operations

## Signature

```typescript
function jsonEquals(obj1: JsonValue, obj2: JsonValue): boolean
```
