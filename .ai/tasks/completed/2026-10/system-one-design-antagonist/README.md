# system-one-design-antagonist — verification pass over the Phase A design

**Shipped**: 2026-10-02 via [PR #715](https://github.com/ErikFortune/fgv/pull/715) into `integration/system-one-decisions` (finalized at the system-one-decisions cluster close, 2026-10-08).

## Summary

A verification pass, not a redesign: every §2 row of `docs/design/system-one-decisions/design.md`
was re-read at a named ref and the design amended in place. Every citation now names its ref; E16
and E27 are split so each link carries its own marker; OQ-7 is resolved (`'unchecked'` stays, with a
stated correctness condition); and §8 now **omits `confidence`** from the boundary's answers. **No
fact contradicts decisions 1–6, and no row was downgraded.** The result also lists every citation
checked and left alone, as evidence the pass was systematic. Docs only.

## Files changed

- `docs/design/system-one-decisions/design.md` (amended in place, including the inspected-checkout
  header, now `16ec1622b` carrying `release` `febf0b2b4`).
- `.ai/tasks/active/system-one-design-antagonist/` (`brief.md`, `state.md`, `result.md`), moved here
  at the cluster close. No `src/` file changed by this stream; the PR diff's 253 `src/` files came
  from the promoted-`release` merge made before handover.

## Decisions made during execution

- **The brief's F1 was corrected, and its conclusion kept.** `renderers/params.py` exists from vLLM
  `v0.16.0` through `v0.30.0`, and `v0.6.6` cannot launch CLM (`--runner` first appears at
  `v0.10.1`). The mechanism and F2's refusal were re-verified at `v0.10.1` and `v0.30.0`.
- **E27a added (derived):** on Ollama `v0.35.0` with base `qwen3:8b`, `llama-server` is probably
  started without `--embedding`, so the Ollama leg likely fails loudly (`clm-serve` 502 → `server`).
  Carried as a precondition in OQ-12, not resolved.
- **E16 split:** E16a (vLLM half) verified; E16b derived, with `tokenizer.json`'s `truncation` section
  an unverified link behind the blocked HF LFS CDN. Upgrades: E21 (openjev's `confidence` formula),
  E25 (Ollama drops `truncate_prompt_tokens`), E16c (CLM PR #6 read via `refs/pull/6/head`).
- **OQ-7 resolved:** keep `'unchecked'`; it is correct only when every backend a call site can reach
  refuses (e.g. `clm-serve --max-tokens 0`, whose refusal arrives as `server`). Under the decided
  topology that does not hold today, so the driving consumer uses `{ maxChars }`.
- **`confidence` omitted** (option 2 of four): both known definitions are pure functions of
  `probabilities`; openjev serves CLM's weights under a different formula; options 3 and 4 need to
  know which server answered, which the boundary cannot.

## Followups

| item | where it went |
|---|---|
| E27a (Ollama leg probably refused) | Precondition in design OQ-12; framed as user decision U1 by `system-one-triage` |
| E16b (`tokenizer.json` truncation section) | Design §2; plan live check L3 would close it (`system-one-triage`) |
| OQ-5, OQ-8, OQ-10's Olares items | Left open in design §12, as the brief required |
| Unverifiable-from-here vs in-principle split | Recorded only in `result.md` |

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md` (citations corrected, citations left alone, egress refinements)
- PR: [#715](https://github.com/ErikFortune/fgv/pull/715)
