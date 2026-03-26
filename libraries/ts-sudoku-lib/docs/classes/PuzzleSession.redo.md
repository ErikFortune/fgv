[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > redo

## PuzzleSession.redo() method

Redo a single move in this puzzle session.

**Signature:**

```typescript
redo(): Result<PuzzleSession>;
```

**Returns:**

Result&lt;[PuzzleSession](PuzzleSession.md)&gt;

`Success` with `this` if the redo is applied, or `Failure`
with details if an error occurs.
