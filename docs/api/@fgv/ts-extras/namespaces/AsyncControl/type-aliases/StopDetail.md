[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AsyncControl](../README.md) / StopDetail

# Type Alias: StopDetail

> **StopDetail** = `"aborted"` \| `"deadline"` \| `"failed"`

Why a `raceStopConditions` race ended without the work's own success:
- `'aborted'` — the caller's signal aborted, before or while the work ran.
- `'deadline'` — the deadline expired while the work ran.
- `'failed'` — the work failed, threw or rejected, or the conditions themselves were invalid.
