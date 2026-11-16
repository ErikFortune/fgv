[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / StopTargetState

# Type Alias: StopTargetState

> **StopTargetState** = `"unexamined"` \| `"pending"` \| `"confirmed"` \| `"unsupported"` \| `"denied"` \| `"unavailable"` \| `"refused"` \| `"indeterminate"`

Where one target of a cascade stop stands.

## Remarks

- `unexamined` — captured, not yet visited by a pump pass.
- `pending` — a stop command was accepted, or is on its way, and quiescence is not yet confirmed.
  **A receipt is not a stop**: an accepted command stays here until authority confirms the state.
- `confirmed` — authoritative state satisfies the mode, and holds: a native state is held by the
  admission latch, an external one by its source's declared stable-stop contract.
- `unsupported` — the target cannot give the stop guarantee: an observation-only external task,
  a source that does not declare the mode, or one whose pause is only sampled. A present
  `confirmedRevision` means the stopped state was observed but is not held.
- `denied` — current host authority does not permit stopping (or establishing the state of) it.
- `unavailable` — its source is not attached or cannot be reached, it is an unresolved
  registration, or a fresh attempt could not be admitted.
- `refused` — its source definitively refused the stop for a reason a retry cannot change.
- `indeterminate` — the outcome is not known: an uncertain dispatch, or a stable stop the source
  later contradicted (see `violation`).

Every state but `unexamined`, `pending` and `confirmed` is a **blocker**: the intent cannot be
satisfied while one stands, and it is never skipped.
