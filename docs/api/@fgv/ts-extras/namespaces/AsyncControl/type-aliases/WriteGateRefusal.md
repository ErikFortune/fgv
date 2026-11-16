[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AsyncControl](../README.md) / WriteGateRefusal

# Type Alias: WriteGateRefusal

> **WriteGateRefusal** = `"raised"` \| `"threw"`

Why a guarded write's outcome came from the gate rather than from the write:
- `'raised'` — the gate was raised, when the write asked or while it waited on a pause. The write
  was **not** run.
- `'threw'` — the write **was** run, and did not answer a `Result`: it threw, rejected, or
  resolved to something else. Its side effects may have happened. One kind covers all three
  because a caller's response is the same — the write ran and its outcome is unknown.
