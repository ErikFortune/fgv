[Home](../README.md) > [ProducedConfectionBase](./ProducedConfectionBase.md) > redo

## ProducedConfectionBase.redo() method

Redoes the last undone change.
Pops from redo stack, pushes current to undo, and restores future state.

**Signature:**

```typescript
redo(): Result<boolean>;
```

**Returns:**

Result&lt;boolean&gt;

Success with true if redo succeeded, Success with false if no future
