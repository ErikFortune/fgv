# Brief — ai-assist model-alias layer (Phase A design)

**Status:** Phase A — design only. NO code ships. Deliverable is `design.md`.
**Branch:** off `release` (`claude/ai-assist-version-alias-design-m2pnhg`).
**Surface:** `@fgv/ts-extras` → `src/packlets/ai-assist` (active surface — additive/breaking OK per
`.ai/instructions/ACTIVE_DEVELOPMENT.md`).

## Mission

Design an fgv-owned **canonical model-alias layer** for the ai-assist provider registry so consumers
and `defaultModel` reference **stable aliases** that resolve, in one central place, to the current
concrete provider model — ending the recurring breakage where the registry pins dated model snapshots
that providers later retire.

Forcing function: Google is shutting down **every** Gemini model the registry currently pins. Design
the layer **generically across providers**; **apply it to Gemini now**; allow other providers to adopt
incrementally (additive).

## Authoritative deprecation facts (Gemini)

| Pinned model (role) | Shutdown | Replacement |
|---|---|---|
| `gemini-2.5-flash` (base) | 2026-10-16 | `gemini-3.5-flash` |
| `gemini-2.5-flash-image` (image) | 2026-10-02 | `gemini-3.1-flash-image-preview` |
| `gemini-2.5-pro` (thinking) | 2026-10-16 | `gemini-3.1-pro-preview` |
| `gemini-2.5-flash-lite` (thinking) | 2026-10-16 | `gemini-3.1-flash-lite` |
| all `imagen-4.0-*` | ~2026-06/08 | converge on `gemini-3.1-flash-image-preview` |
| `gemini-embedding-001` | — (NOT deprecated) | leave as-is |

Most replacements are `-preview` IDs (Google retires previews fast) — which is exactly why the alias
layer matters: insulate consumers from snapshot churn.

## Design questions to resolve (recommend + justify each)

1. **Alias scheme** — uniform fgv namespace vs. provider-native aliases; cover all four providers.
2. **Resolution model** — where the map lives, when resolution happens, how it composes with
   `ModelSpecKey` and the `idPattern` rules, and the **back-compat rule** (raw IDs MUST still work).
3. **Staleness/maintenance story** — exactly what a future Google line-bump requires (goal: one map
   edit + a testbed run, zero consumer changes); what still needs manual upkeep; testbed verification.
4. **Gemini migration map** — the concrete alias entries moving Gemini 2.5 → 3.x and retiring Imagen.
5. **Breadth** — confirm generic design + migrate Gemini now; others adopt incrementally; per-provider
   gotchas.

## Deliverable

`.ai/tasks/active/ai-assist-model-aliases/{brief.md, design.md}` — this brief + the design (scheme,
resolution model, back-compat, Gemini map, maintenance/testbed story, illustrative interface
signatures, tiered implementation plan, acceptance criteria). Interface signatures expected; **no
implementation, no registry edits**. Cite `file:path` for every registry claim.

## Conventions

`Result<T>`, no `any`, Converters for unknown→typed, additive where possible, no sibling re-exports.

## Escalation

If the alias-scheme fork can't be resolved without a product call, present BOTH with a recommendation
and flag for the orchestrator rather than guessing. *(Resolved in design.md §1 — no escalation needed.)*
