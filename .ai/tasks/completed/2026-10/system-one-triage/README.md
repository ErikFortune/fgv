# system-one-triage — Phase B: open questions, user decisions and the implementation plan

**Shipped**: 2026-10-04 via [PR #719](https://github.com/ErikFortune/fgv/pull/719) into `integration/system-one-decisions` (finalized at the system-one-decisions cluster close, 2026-10-08).

## Summary

Phase B turned the Phase A design into something Phase C could build without re-deriving it. It
worked design §12 in place, added evidence rows E28–E35, and wrote
`docs/design/system-one-decisions/implementation-plan.md`: one slice (S1), its surface, acceptance,
revert matrix and tests, plus live checks L1–L5. It framed two decisions for the user, which the user
took on 2026-10-03. **No fact contradicts a Phase A decision**; five SDK-at-source findings refine the
§8 contract sketch. Docs only; no server answered a request.

## Files changed

- `docs/design/system-one-decisions/design.md` (§12 worked through; E28–E35; dated refinements to
  §7.1 item 5, §8 and §11).
- `docs/design/system-one-decisions/implementation-plan.md` (new).
- `docs/WORKSTREAMS.md` § `system-one-decisions`.
- `.ai/tasks/active/system-one-triage/` (`brief.md`, `state.md`, `result.md`), moved here at the
  cluster close. No `src/` file and no `package.json`.

## Decisions made during execution

- **OQ-2:** `@fgv/ts-extras-system-one` (npm `E404`, sibling-naming rule).
- **OQ-9:** `~0.6.0`, direct; patches by suite; a review gate on every minor (diff `index.d.mts`,
  re-confirm E29–E31, suite and matrix green, L1 re-run).
- **OQ-4, resolved for upstream CLM:** `maxChars = floor(B × r_min × 0.9)`; README values 2,400
  (unknown or ID-dense) and 4,400 (measured prose, Markdown, code or JSON). Measured over 388 windows
  with a tokenizer rebuilt from Qwen3-8B's non-LFS `vocab.json` / `merges.txt` (E33, derived); L3
  confirms it against the real tokenizer.
- **OQ-6:** named unit tests (U12–U14, U17, U19, U20) plus live L1 and L2.
- **OQ-12 / D10:** the harness ships as `perf/systemOneLive.js`, refuses a parity run without
  thresholds given up front, and probes first (E27a).
- **Belief 2 (D7 = personaility#672's primitive): agreed.** No adapter for v1, but Phase C needs a
  `fetch?` parameter, which §8 had omitted.
- **Other contract refinements:** `logLevel` pinned and never `debug` (a fourth `TYPESAFE_*`
  fallback); a `noul`'s candidate can be its instructions (E32); an explicit `''` key is sent as
  `Bearer `.
- **User decisions, 2026-10-03:** **U1 = A** (keep Ollama, gated on one probe round trip per
  environment; fall back to a remote vLLM-backed CLM on refusal). **U2 = (a)** (the cluster close
  waits on a recorded L1 only; L2–L5 gate the consumer's experiment).

## Followups

| item | where it went |
|---|---|
| D5 (exact token pre-measurement) now has a route via `vocab.json` / `merges.txt` | `docs/FUTURE.md`, *`ts-extras-system-one` — exact token pre-measurement (design D5)*, added at the cluster close as `result.md` asked |
| D7 (safer-fetch `fetch` adapter) | Folds into personaility#672's safer-fetch sibling; no separate entry |
| OQ-5, OQ-8, OQ-10's Olares items, E16b | Left open in design §12; OQ-8, OQ-10 and E16b folded into plan L2 / L3 |
| E27a | Plan live check L4 (decision U1) |
| Left for the implementer (file layout, message wording, fixture format, matrix patterns, read-only `model`) | Recorded only in `result.md` |

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md` (decisions for the user first)
- Plan: `docs/design/system-one-decisions/implementation-plan.md`
- PR: [#719](https://github.com/ErikFortune/fgv/pull/719)
