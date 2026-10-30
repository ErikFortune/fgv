# converter-safe-failure-format — failure messages that cannot throw

**Shipped**: 2026-10-30 into `integration/asks` via #TBD.
Packages: `@fgv/ts-utils` (`base`, `conversion`, `validation`, `collections`, `hash`, `logging`),
`@fgv/ts-json-base` (`converters`, `validators`, `json`), and the same pattern in `@fgv/ts-extras`
(`conversion`) and `@fgv/ts-bcp47` (`utils`). Origin: personaility#714 (fgv-ask), found by
personaility#713. Change files: `minor` for `ts-utils`, `patch` for the other three.

## Summary

Converters built their failure text with `JSON.stringify(from)`. On a cyclic input — #713's live
Node socket, where `Socket.parser.socket` closes the loop — that threw. The throw escaped `convert`,
skipped `.orDefault('unknown')` and every other combinator, and turned a correct failure into a 500.

`formatValueForMessage(value, options?)` now formats every such message. It never throws. It
calls the real `JSON.stringify` with a replacer that only turns an active-path cycle into
`"[Circular]"` and a `BigInt` into `"123n"`, so every value `JSON.stringify` rendered without
throwing renders byte-identically, up to a length bound of 200. A fallback renderer handles what
still throws (a getter, Proxy trap or `toJSON`) with readable tokens, and failure text and the tests
that pin it are otherwise unchanged.

`BaseConverter` and `GenericValidator` also catch a throw from the function they wrap and return it
as a `Failure` reading `converter threw: …` / `validator threw: …`. So `convert`, `validate` and
`guard` never throw, including when the converter's own property read hits a Proxy trap. Stack
exhaustion in nested converters unwinds to the outermost one and fails once there, and the recursive
JSON converters and validators fail at once on a cycle with `circular reference at $.path`.

## What a reader should know

- **The boundary guard was a decision, not a default.** The brief asked for a weighed call. It was
  added because the formatter alone cannot cover a throw from a converter's own reads. Review round 1
  found that, as first written, it turned a fast stack overflow into an exponential hang on graphs
  with two or more back-edges; it now re-throws stack exhaustion to the outermost boundary
  (`state.md` D3, D5). Its masking is documented: anything that expects failures (`ignoreErrors`,
  `oneOf`, `orDefault`, `guard`) hides a buggy callback.
- **Review round 1 changed the formatter's design**: from a hand-written walker that matched
  `JSON.stringify` for JSON-safe values only, to `JSON.stringify` itself with the walker as fallback
  (`state.md` D6). The finding → fix → test → red table is in `result.md`.
- **`style: 'string'`** exists because the sweep found failure sites that interpolate the value
  directly and throw on a symbol or a null-prototype object. It keeps their text, bounded at 1000.
- **Every `JSON.stringify` site in both packages is classified** in `result.md`: fixed, content
  (hash, canonicalize, clone, file contents, tool-description text) left alone, or other with a
  reason.
- **Red first.** Round 0: 240 of 333 hostile-input cases failed before the fix. Round 1: the hang
  cases were killed at a 15 s limit on the old code, in a child process so the suite could not wedge.
  Neither round changed any existing downstream test.

## Artifacts

- `brief.md` — the frozen contract
- `result.md` — the formatter's behaviour, the sweep table, the red-first evidence, the gates, and
  observations
- `state.md` — decisions D1–D4 (formatter design, `'string'` style, boundary guard, scope
  additions), D5–D7 from review round 1, and open items
- `meta.yaml` — the index record
