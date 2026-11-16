[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskRecoveryIssueCode

# Type Alias: TaskRecoveryIssueCode

> **TaskRecoveryIssueCode** = `"manifest-missing"` \| `"manifest-invalid"` \| `"unreadable"` \| `"unknown-format-version"` \| `"record-invalid"` \| `"record-missing"` \| `"record-id-mismatch"` \| `"integrity"` \| `"unknown-kind"` \| `"unexpected-record"` \| `"pending-registration"`

The kinds of problem open and recovery report.

## Remarks

- `manifest-missing` — no `repository.json` in a root that has other content; open never
  initializes over it.
- `manifest-invalid` / `record-invalid` — valid JSON that fails the strict converters.
- `unreadable` — not strict UTF-8, or not JSON.
- `unknown-format-version` — a record written by a newer storage format; retained untouched.
- `record-missing` — the inventory names a live record that is not there.
- `record-id-mismatch` — the record's id disagrees with its filename.
- `integrity` — a cross-record invariant failed: a duplicate claim id, a dangling or cyclic
  parent edge, update identity that disagrees with its task.
- `unknown-kind` — a structurally valid task whose kind/version is not registered. Advisory:
  the record is quarantined and never rewritten.
- `unexpected-record` — a task/consumer/source-shaped file the inventory does not name.
  Advisory: registration never writes one, so this is out-of-band content, left alone.
- `pending-registration` — a pending entry whose record was never written. Advisory: its
  reservations stay held and the host may resume it by retrying the same registration.
