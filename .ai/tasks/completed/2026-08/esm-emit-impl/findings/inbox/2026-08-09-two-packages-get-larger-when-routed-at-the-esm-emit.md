# Finding — the R3 win does not generalize: two packages get *larger* routed at the ESM emit

**Found by:** `esm-emit-impl`, measuring R3 benefit per package before routing
**Severity:** not a defect — a correction to a design assumption, and the reason R3 shipped partial
**Bears on:** `.claude/project/esm-emit-design.md` §7 ("what remains inferred") and OQ-4

## What

The design measured three packages and recorded, explicitly, that it had **not** verified the wins
generalize:

> **That the R3 wins generalize** beyond the three packages measured. The mechanism … is understood
> and the direction is not in doubt, but only `ts-utils`, `ts-bcp47`, and `ts-json-base` were
> measured. R5's rollout should measure each package it touches.

Measured here for every candidate whose bundler-resolution probe came back clean — esbuild,
`platform: browser`, minified, tree shaking **on**, CJS `lib` entry versus ESM `dist` entry:

| Package | namespace import | best narrow import | ratio (CJS ÷ ESM) |
|---|---|---|---|
| `ts-app-shell` | 1,650,511 → 857,664 B | `MessagesLogger`: 1,650,526 → 227,449 B | 1.92× / **7.26×** |
| `ts-json-base` | 130,000 → 57,292 B | `isJsonObject`: 130,013 → 40,742 B | 2.27× / **3.19×** |
| `ts-extras` | 517,662 → 488,262 B | `Hash`: 517,667 → 319,858 B | 1.06× / 1.62× |
| `ts-res` | 1,079,546 → 996,976 B | 1,079,575 → 828,820 B | 1.08× / 1.30× |
| `ts-web-extras` | 567,129 → 588,421 B | 567,159 → 562,978 B | **0.96× / 1.01×** |
| `ts-json` | 170,802 → 185,212 B | 170,835 → 178,887 B | **0.92× / 0.95×** |

`ts-json-base`'s 3.19× corroborates the design's independently measured 3.48× on the published
5.1.0-47 (different symbol, same order of magnitude), so the method agrees where the two overlap.

The last two rows do not. For `ts-json` and `ts-web-extras` the ESM emit is **bigger** than the CJS
one a bundler gets today, on both a broad and a narrow import. Routing them would have shipped a
regression while satisfying every gate — the resolution probe is green for both.

## Why

Consistent with the design's own mechanism (§1): tree-shaking pays in proportion to how granular the
barrel is. Both of these re-export through namespace objects (`ts-json`'s browser entry is
`export * from './index'`), which is an all-or-nothing edge in a bundler's reachability graph. With
nothing to shake, what remains is the per-file ESM emit's overhead against a CJS bundle that
deduplicates better.

## Disposition

**Moot for now, and kept for the follow-up.** R3 was applied to the four packages with a measured
win and then reverted along with the rest of R3, because routing *anything* at the `dist` emit
breaks webpack — see the companion finding on Option B. These numbers are recorded so the eventual
Option-B-enabled R3 does not have to re-derive them, and so it knows to skip two of its candidates.

The transferable rule, which the design did not have the evidence to state: **a clean
bundler-resolution probe is a precondition for routing, not a reason to route.** The gate answers
"is this safe?"; only a size measurement answers "is this worth it?" — and for 2 of 6 candidates the
answers differed.
