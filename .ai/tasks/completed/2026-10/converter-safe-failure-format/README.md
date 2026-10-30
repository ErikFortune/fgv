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

`formatValueForMessage(value, options?)` now formats every such message. It never throws, renders
cycles, `BigInt`s, symbols, functions, class instances and throwing getters or Proxy traps as
readable tokens, and is bounded by length (200) and depth (16). For JSON-safe values within those
bounds it is byte-identical to `JSON.stringify`, so existing failure text and the tests that pin it
are unchanged.

`BaseConverter` and `GenericValidator` also catch a throw from the function they wrap and return it
as a `Failure`. So `convert`, `validate` and `guard` never throw, including when the converter's own
property read hits a Proxy trap.

## What a reader should know

- **The boundary guard was a decision, not a default.** The brief asked for a weighed call. It was
  added because the formatter alone cannot cover a throw from a converter's own reads, and because
  the error is kept as the failure message rather than swallowed (`state.md` D3).
- **`style: 'string'`** exists because the sweep found failure sites that interpolate the value
  directly and throw on a symbol or a null-prototype object. It keeps their text and only falls back
  to the JSON rendering where `String()` throws.
- **Every `JSON.stringify` site in both packages is classified** in `result.md`: fixed, content
  (hash, canonicalize, clone, file contents, tool-description text) left alone, or other with a
  reason.
- **Red first.** 240 of 333 hostile-input cases failed before the fix. The repo-wide `rush test`
  passed with no downstream test text changed.
- **Left open:** the recursive `ts-json-base` JSON converters walk a cycle to stack exhaustion and
  now fail with a very long message (P3 in `docs/TECH_DEBT.md`). `classifyJsonValue` still throws on
  a trapping Proxy, because the type guards it calls do.

## Artifacts

- `brief.md` — the frozen contract
- `result.md` — the formatter's behaviour, the sweep table, the red-first evidence, the gates, and
  observations
- `state.md` — decisions D1–D4 (formatter design, `'string'` style, boundary guard, scope
  additions) and open items
- `meta.yaml` — the index record
