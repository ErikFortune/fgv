[Home](../../README.md) > [Diff](../README.md) > jsonThreeWayDiff

# Function: jsonThreeWayDiff

Performs a three-way diff comparison between two JSON values, returning separate
objects containing the differences and similarities.

This function provides an alternative to Diff.jsonDiff that focuses on actionable
results rather than detailed change analysis. Instead of a list of individual changes,
it returns three objects that can be directly used for merging, UI display, or
programmatic manipulation.

**Key Features:**
- **Actionable Results**: Returns objects ready for immediate use in merging operations
- **Simplified Array Handling**: Arrays are treated as atomic values for cleaner results
- **Structural Preservation**: Maintains original JSON structure rather than flattened paths
- **UI-Optimized**: Perfect for side-by-side diff displays and change visualization
- **Merge-Friendly**: Designed specifically for three-way merge scenarios

**Array Handling:**
Unlike Diff.jsonDiff, this function treats arrays as complete units. If arrays differ,
the entire array appears in the appropriate result object rather than computing
element-by-element deltas. This approach is simpler and more predictable for most
use cases involving data updates and synchronization.

**Use Cases:**
- Applying configuration updates while preserving unchanged settings
- Creating side-by-side diff displays in user interfaces
- Building three-way merge tools for data synchronization
- Implementing undo/redo functionality with granular control
- Generating patch objects for API updates

## Signature

```typescript
function jsonThreeWayDiff(obj1: JsonValue, obj2: JsonValue): Result<IThreeWayDiff>
```
