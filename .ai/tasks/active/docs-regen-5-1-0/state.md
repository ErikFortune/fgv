# docs-regen-5-1-0 — state

Worker-owned. Weakest evidence at close; see `result.md`.

## Findings so far

- `docs/api` and the root `typedoc.json` were both **added** by #652 (`0765a2068`, 2026-08-21); the
  only later touch is `5a27cbf12` (sudoku removal). No script, CI job or doc produces it. #652's
  commit message does not mention it.
- At #652, `docs/api/@fgv/` held 12 packages although `libraries/*` then had 25 entries.
- `rush install` clean.

## Progress

- [ ] rebuild
- [ ] build-docs
- [ ] root docs/api
- [ ] change files
- [ ] close-out
