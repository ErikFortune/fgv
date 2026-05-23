# Stream state: `prompt-assist-screeners`

**Status:** 🟢 ready to commission — substrate prep in flight
**Branch base:** `release`
**Last updated:** 2026-05-22 (orchestrator — substrate prep)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation | 🟢 ready | Single-PR breaking-change feature. Spec fully locked in brief; fresh-agent commissionable. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Standalone stream off `release`, not folded into `local-ai-exploration` | Genuine ts-prompt-assist API improvement; benefits any consumer wanting custom screeners; independent of the local-ai experiment's outcome (which may abandon the transformers facade at B-4b). Breaking change to a shipped library deserves its own clean PR + changelog. |
| `IScreener` / `IScreenerContext` shapes (Erik-supplied) | Full `IPromptSlot` + `promptId` in context gives richer attribution than slotName-only. `value` is post-binding/pre-render — the correct screening point. |
| Source-aware skipping moves into the screener | `source?` in context; replaces policy-level `screenedSources`. Screener owns the skip decision. |
| Open finding kind: `BuiltInFindingKind \| (string & {})` | Keeps built-in autocomplete; allows custom screeners to emit arbitrary kinds. |
| Per-slot-value, pre-render screening point only | Whole-prompt / post-render screening is a different mechanism (like `antiJailbreakPreface`). Explicit scope boundary to prevent over-generalization. |
| Sequential screener execution; reject short-circuits | Deterministic traces; matches current regex-screener reject behavior. Parallel execution explicitly out of scope. |
| Per-finding disposition (not policy-global) | Lifts the warn/reject decision from policy to finding; matches today's semantics but more flexible. |
| Length-cap + antiJailbreakPreface stay policy-level | Structurally different (pre-screen / post-render); not screeners. |
| Breaking change; no compat shims | `ts-prompt-assist` is an active-development surface (per ACTIVE_DEVELOPMENT.md); breaking changes cheap. Consumers reproduce today's behavior via `createPatternScreener` explicitly. |

---

## Dependency relationship

- **Upstream gap-fix for `local-ai-exploration` B-3.** B-3 (local classifier → `IPromptSafetyPolicy`) cannot be built against today's regex-only sync surface. This stream fixes the primitive first per the gap-then-fix tenet.
- **Runs parallel to `local-ai-exploration` B-2** (transformers facade) — independent surfaces.
- **Sequencing:** this stream → `release` → merge `release` → `local-ai-exploration` (absorb) → B-3 builds against new screener surface.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-22 | Stream requested + specced | Erik supplied a near-complete brief (goal / problem / required shape / acceptance / out-of-scope) + the locked `IScreener` / `IScreenerContext` interface. |
| 2026-05-22 | Substrate prep | brief.md + state.md + WORKSTREAMS entry. This PR. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open |
| Implementation | TBD | not yet commissioned |
