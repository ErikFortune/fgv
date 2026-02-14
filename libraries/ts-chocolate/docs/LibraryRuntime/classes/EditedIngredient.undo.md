[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedIngredient](./EditedIngredient.md) > undo

## EditedIngredient.undo() method

Undoes the last change.
Pops from undo stack, pushes current to redo, and restores previous state.

**Signature:**

```typescript
undo(): Result<boolean>;
```

**Returns:**

Result&lt;boolean&gt;

Success with true if undo succeeded, Success with false if no history
