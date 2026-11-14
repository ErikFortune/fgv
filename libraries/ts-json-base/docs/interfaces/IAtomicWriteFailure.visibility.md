[Home](../README.md) > [IAtomicWriteFailure](./IAtomicWriteFailure.md) > visibility

## IAtomicWriteFailure.visibility property

What a subsequent reader can now see for the destination path.
- `unchanged`: the destination still holds whatever it held before this
  call — nothing was mutated.
- `replaced`: the destination was already replaced when the failure
  occurred (a failure during a later stage, such as directory flush).
- `unknown`: the underlying operation's outcome could not be determined
  (for example, an ambiguous system-call result).

**Signature:**

```typescript
readonly visibility: "unknown" | "unchanged" | "replaced";
```
