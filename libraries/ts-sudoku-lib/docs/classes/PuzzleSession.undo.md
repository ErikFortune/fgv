[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > undo

## PuzzleSession.undo() method

Undo a single move in this puzzle session.

**Signature:**

```typescript
undo(): Result<PuzzleSession>;
```

**Returns:**

Result&lt;[PuzzleSession](PuzzleSession.md)&gt;

`Success` with `this` if the undo is applied, or `Failure`
with details if an error occurs.
