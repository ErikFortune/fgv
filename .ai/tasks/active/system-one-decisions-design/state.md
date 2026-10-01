# State — `system-one-decisions-design` (Phase A)

**Status:** Phase A complete. The design and `result.md` are written. The PR goes to
`integration/system-one-decisions` (not `release`). Do **not** run `/finalize-task`: this stream
finalizes at cluster close, after Phase C.

## Where things stand

| | |
|---|---|
| brief | `brief.md`, complete |
| design | `docs/design/system-one-decisions/design.md`, complete |
| result | `result.md`, complete |
| integration branch | `integration/system-one-decisions`, off `release` HEAD (`30713277c`) |
| this branch | `claude/system-one-decisions-design` |
| ledger | `docs/WORKSTREAMS.md` § `system-one-decisions` |

## Headline decisions (detail in design §1)

1. **Pressure test overturned.** Wrap `@typesafe-ai/sdk` (the official TS SDK, MIT, zero
   dependencies, with `baseURL`/`fetch`). This is the `ts-extras-ollama` shape.
2. **No fgv interface.** The backend is chosen by `baseUrl` plus `model` at construction.
3. **CLM-8B is not viable on a laptop inner loop.** The GGUF is heads only.
4. **Refuse at a mandatory caller-declared input bound.** Upstream CLM silently cuts the question
   (derived, and corroborated).

## Network posture observed in Phase A

- Reachable: huggingface.co, raw.githubusercontent.com, PyPI, npm.
- Blocked (403): github.com web, API and codeload; typesafe.ai and docs.typesafe.ai.

## Next

Phase B triage works design §12 (OQ-1..OQ-9). OQ-1 (a committed consumer) decides between "implement"
and "not yet".

## Gate runs

- `git diff --name-only origin/integration/system-one-decisions...`: docs and task artifacts only. No
  `src/`, no `package.json`, no lockfile.
- `rush change --verify --target-branch origin/integration/system-one-decisions`: run before the
  commit; result recorded in the PR body.
