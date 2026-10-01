# ts-random: a weighted pick on `PseudoRandomGenerator`

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#669](https://github.com/ErikFortune/personaility/issues/669) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-09-27T16:31:09Z. No comments.
- **Long form:** [`.ai/notes/fgv-share/ASK-2026-09-26-weighted-pick.md`](https://github.com/ErikFortune/personaility/blob/working/.ai/notes/fgv-share/ASK-2026-09-26-weighted-pick.md) on `working` (issue says "landed at `edf35eb4`").

## The request, in their terms

> "give `@fgv/ts-random`'s `PseudoRandomGenerator` a weighted pick: choose one of a list of candidates with probability proportional to each one's weight, and ideally the same pick as a pure function of a unit float so a caller whose randomness comes from elsewhere (a hash) can share it."

Proposed shape (note, "What we would like"):

> "- `pickWeighted<T>(candidates: ReadonlyArray<{ item: T; weight: number }>): T | undefined` on `PseudoRandomGenerator` — non-positive weights never chosen, `undefined` (or a `Result` failure, matching the package's conventions) when nothing has a positive weight.
> - A pure `pickWeightedAt<T>(unit: number, candidates)` beside it (`unit` in `[0, 1)`) that the method delegates to …
> - Optionally a weighted-without-replacement variant (`pickWeightedSequence`), which the quirk draw would want if its catalog outgrows the free slots"

## Stated motivation

> "two places in `@fgv/personaility` hand-roll the same cumulative-weight walk and their edge rules have already drifted:
> - `libraries/personaility/src/packlets/quirks/surprise.ts` (`_pickWeighted`, over `nextFloat()`), driving "surprise me".
> - `libraries/personaility/src/packlets/avatars/appearanceSampler.ts` (`_pickWeighted`, over a CRC32 unit float), so a stored actor's appearance draws the same value every time."

Note on the drift: "the avatar sampler returns the first option when every weight is zero, while the quirk draw filters to positive weights and requires its callers to supply at least one."

## Stated constraints or acceptance

- > "Needed back: the primitive and its edge rules (zero weights, all-zero, the last candidate winning by elimination)."
- Note: "the last candidate winning by elimination so a point at the top of the range cannot fall off the end".
- Adoption plan (note): "`appearanceSampler.ts` calls the pure form with its hash ratio, keeping its stored draws stable."
- Verified against `@fgv/ts-random` 5.1.0-57: "`pickNext` / `pickRandom` / `pickSequential` are uniform; no method takes weights."
- No priority stated.

## Package(s) it appears to touch

`@fgv/ts-random`.

## Stated dependencies

None.

## Observations (intake agent's, not the requester's)

- `grep -rn "weight" libraries/ts-random/src` returns nothing on `integration/agent-tasks-v1` @ `2a95fbb2`; no weighted pick exists yet.
