# `retaining-logger-ring-buffer-refactor` — stream brief

**Status:** queued — commission after the `ts-prompt-assist-observability` cluster closes to `release`
**Workflow shape:** `stream` (refactor, well-specified, no design exploration)
**Branch base:** current `release` HEAD at commission time
**PR target:** `release` (single-stream, direct-to-release per L36)

---

## Why this stream exists

The `ts-prompt-assist-observability` Phase A spike chose **hybrid C-minimal + D**: ship a generic `RetainingRingBuffer<T>` primitive in `@fgv/ts-utils` and let `@fgv/ts-prompt-assist` compose it for `PromptObservationStore`. The Q1 falsifiability argument required an **existing** (not speculative) second consumer of `RetainingRingBuffer` — and `RetainingLogger` itself is that consumer: it already builds exactly the `{ seq, timestamp, level, message, args }`-shaped record the buffer would assign.

Phase C of the observability stream deliberately kept that refactor **out of scope** to preserve additive blast radius. That deferral is only sound if the refactor actually lands soon — otherwise the codebase carries two parallel ring implementations that drift, and the Phase A falsifiability argument retroactively degrades.

This stream is the commitment that makes the deferral sound. Commission it immediately after the observability cluster closes to `release`.

---

## Mission

Refactor `RetainingLogger`'s internals to compose `RetainingRingBuffer<ILogRecord>`. **Public surface (the `ILogger` / `LogReporter` / `getRecords` API) does not change.** Retire the duplicated ring implementation that currently lives inside `RetainingLogger`.

This is a pure internal refactor — no behavior change, no API change, no consumer impact.

---

## In scope

- `libraries/ts-utils/src/packlets/logging/retainingLogger.ts` (or equivalent path) — replace the hand-rolled ring with `RetainingRingBuffer<ILogRecord>` composition.
- Any internal helpers within the logging packlet that touched the old ring.
- Tests: update internal-state tests if they referenced the old ring fields; preserve all public-API tests verbatim.

## Out of scope

- Any `RetainingLogger` public-API surface change.
- Any `RetainingRingBuffer` API change (locked from the observability stream).
- Any consumer-facing impact (`MultiLogger`, `LoggerBase`, `getRecords` contract).
- Any non-`@fgv/ts-utils` package.

---

## Package surface

| Path | May modify |
|------|---|
| `libraries/ts-utils/src/packlets/logging/retainingLogger.ts` | ✅ (internal refactor) |
| `libraries/ts-utils/src/test/unit/logging/retainingLogger.test.ts` | ✅ (only if internal-state tests are affected; public-API tests stay verbatim) |
| `libraries/ts-utils/src/packlets/logging/*` other files | ⚠️ read-only unless a real dependency forces a tiny change |
| `libraries/ts-utils/etc/ts-utils.api.md` | ✅ (regenerate; commit the output — should be a no-op if the public surface truly didn't change) |
| Anything outside `@fgv/ts-utils` | ❌ |

The `etc/ts-utils.api.md` regeneration being a **no-op** is the load-bearing check that the public surface didn't drift. If API Extractor reports any change, investigate before committing.

---

## Required reading

1. `.ai/tasks/completed/2026-06/ts-prompt-assist-observability/` (assuming it's archived by the time this commissions) — the Q1 reasoning + the `RetainingRingBuffer<T>` API contract. Specifically the `design.md` Q1 + Q3 sections.
2. `libraries/ts-utils/src/packlets/logging/retainingLogger.ts` — current internals.
3. `libraries/ts-utils/src/packlets/logging/retainingLogger.test.ts` (or equivalent) — the test contract that must survive verbatim.
4. The `RetainingRingBuffer<T>` source as it landed in `@fgv/ts-utils` from the observability cluster.
5. `.ai/instructions/CODING_STANDARDS.md` § "Extending Core Libraries Over Working Around Them" — this stream is the canonical example of the principle in action: existing primitive composes new primitive once the latter ships.

---

## Skills to load

- `/published-primitives-reflex` — the whole point of this stream is consolidating onto the published primitive.
- `/result-pattern`.
- `/result-tests`.
- `/ts-utils-logging`.

---

## Phases

1. Read the current `RetainingLogger` internals + the `RetainingRingBuffer<T>` API.
2. Refactor `RetainingLogger` to compose the buffer. Preserve every field/method on the public surface.
3. Run the existing test suite — every public-API test must pass verbatim. If a test fails, that's a behavior change — investigate before adjusting.
4. Verify `etc/ts-utils.api.md` regenerates clean (no diff).
5. `code-reviewer` agent run on the diff BEFORE 100%-coverage closure (per L37). Findings resolved or dispositioned.
6. Coverage closure: should be trivial since this is a refactor — the existing test coverage should carry over.

---

## Acceptance criteria

- [ ] `RetainingLogger` internals compose `RetainingRingBuffer<ILogRecord>`.
- [ ] Public surface (`ILogger`, `LogReporter`, `getRecords`, `lastSeq`, `clear`, all existing exports) unchanged.
- [ ] `etc/ts-utils.api.md` regenerates as no-op (the load-bearing public-surface-stability check).
- [ ] Every public-API test passes verbatim — no expected-behavior edits.
- [ ] `rushx build` / `rushx lint` (no warnings) / `rushx test` (100% coverage) PASS in `@fgv/ts-utils`.
- [ ] `rushx fixlint` run before final commit.
- [ ] `code-reviewer` run on the diff BEFORE coverage closure; findings addressed.
- [ ] Internal duplication retired — no remaining hand-rolled ring inside `RetainingLogger`.

---

## Exit artifact shape

Standard direct-to-release stream:
- `state.md` — phase progress + decisions
- `result.md` — what changed, files, code-reviewer pass summary
- Artifact migration in the same PR (per the PR #452 codification): active → completed/<YYYY-MM>/ with polished README.

---

## Branching

Direct-to-release stream (per L36's single-stream-no-integration-branch path):

- **Branch base:** current `release` HEAD at commission time.
- **Branch name:** `chore/retaining-logger-ring-buffer-refactor`
- **PR target:** `release`.
- **Single PR, single squash commit on release.**

---

## Resume protocol

Standard: read `state.md`, resume at the next phase boundary.
