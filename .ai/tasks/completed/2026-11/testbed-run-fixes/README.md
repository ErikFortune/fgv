# testbed-run-fixes — fixes from the maintainer's full testbed run, plus `--all`

**Shipped**: 2026-11-20 via #801.
Package: `@fgv/testbed` (`samples/testbed`, private). No change file needed.

## Summary

The maintainer ran every CLI scenario by hand. This stream fixes what that run turned up and makes
one command do the same job.

- `safer-fetch-guard`'s size-cap step now serves an undeclared-length body, so the cap is actually
  reached.
- `wire-probe` treats an output-budget 400 as inconclusive and gives raw probes a 256-token budget.
- `--all [--skip …]` runs every CLI scenario and ends with a passed / failed / skipped summary.
- A scenario that cannot run here says why and is skipped instead of failed. `ICliScenarioImpl`
  gains `skipReason`, backed by the shared `skipWithoutSecret` / `skipWithoutProviderKey`. It is wired
  to every key-gated scenario and to `mcp-probe`.
- Model-download failures in `local-*` / `sqlite-vec-*` now name the model and the host.

## What a reader should know

- **An unkeyed `--all` now fails only on the model downloads.** Run in a sandbox, it reported
  9 passed, 14 skipped and 5 failed, all five being `huggingface.co` model loads (`result.md` § 3).
- **A skip is a typed outcome, not a message convention.** `skipReason` runs before `run`, so a
  scenario with its key set that then fails still fails.
- **The web runner panel is unchanged.** It shows secret status itself and does not consult
  `skipReason`.

## Artifacts

- `brief.md`: both kickoffs (reconstructed; the stream was delegated by message)
- `result.md`: changes, tests, gates, the `--all` summary, and what was left alone
