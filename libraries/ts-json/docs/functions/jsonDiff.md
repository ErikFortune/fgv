[Home](../README.md) > jsonDiff

# Function: jsonDiff

Performs a deep diff comparison between two JSON values.

This function provides detailed change tracking by analyzing every difference
between two JSON structures. It returns a list of specific changes with paths,
making it ideal for debugging, logging, change analysis, and understanding
exactly what has changed between two data states.

**Key Features:**
- Deep recursive comparison of nested objects and arrays
- Precise path tracking using dot notation (e.g., "user.profile.name")
- Support for all JSON value types: objects, arrays, primitives, null
- Configurable array comparison (ordered vs unordered)
- Optional inclusion of unchanged values for complete comparisons

**Use Cases:**
- Debugging data changes in applications
- Generating change logs or audit trails
- Validating API responses against expected data
- Creating detailed diff reports for data synchronization

## Signature

```typescript
function jsonDiff(obj1: JsonValue, obj2: JsonValue, options: IJsonDiffOptions): Result<IDiffResult>
```
