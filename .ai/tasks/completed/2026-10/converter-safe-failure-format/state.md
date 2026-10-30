# State: `converter-safe-failure-format`

Worker-owned. Brief is frozen; questions and decisions live here.

## Status

Implementation committed on `converter-safe-failure-format` (base `integration/asks`). Gates run;
see `result.md`. Closed out to `.ai/tasks/completed/2026-10/converter-safe-failure-format/`.

## Decisions

### D1 — the formatter: `formatValueForMessage(value, options?)` in `ts-utils` `base`

`base` because every packlet that formats a failure already imports it, and it sits beside
`captureResult` / `_errorMessage`, the other "never throws while reporting" helpers. Exported
publicly with `IFormatValueForMessageOptions` and the two default constants, because
`ts-json-base`, `ts-extras` and `ts-bcp47` need it.

- Hand-written walker rather than `JSON.stringify` with a replacer: a replacer cannot render
  `[Circular]` or `123n` without quoting them, and cannot contain a throwing getter (the read happens
  inside `stringify`, before the replacer sees the value).
- `toJSON` is **not** invoked (brief default). `Date` is rendered through the intrinsic
  `Date.prototype.toISOString`, so a `Date` still matches `JSON.stringify`.
- Getters **are** read, as `JSON.stringify` reads them, inside a `try`. Not reading them would break
  the compatibility contract for plain objects with accessors.
- Tokens (`[Circular]`, `[Unreadable]`, `undefined`, `123n`, `Symbol(x)`, `[Function f]`) are
  unquoted, so they cannot be mistaken for string data.
- Default `maxDepth` 16. The contract is stated as "within `maxLength` **and** `maxDepth`"; a JSON
  value nested more than 16 deep yet under 200 characters renders differently. Recorded rather than
  hidden. The length budget alone bounds recursion depth at `maxLength`, so depth is a second guard.

### D2 — a `'string'` style on the same primitive

The sweep found failure sites that interpolate the value directly (`"${from}": not a string`) rather
than through `JSON.stringify`. A template literal throws on a symbol, and `String()` throws on a
null-prototype object or a trapping Proxy. Routing those through the JSON rendering would change
`"[object Object]"` and `"abc"` text everywhere. So `style: 'string'` is `String(value)`, falling
back to the JSON rendering only when that throws, bounded by `maxLength`. Added as an option rather
than a second export, per CODING_STANDARDS § "Extending core libraries" priority 1.

### D3 — the boundary guard: **added**

`BaseConverter` and `GenericValidator` wrap the function they are constructed with in a
`try`/`catch` that returns `fail(_errorMessage(err))`. Every entry point (`convert`,
`convertOptional`, `optional`, `map*`, `with*`, `validate`, `validateOptional`, `guard`, and every
subclass) goes through that one stored function.

Reasoning:
- **The formatter alone cannot meet "never throws for any input".** `Converters.object` reads
  `from[key]`; on a Proxy whose `get` traps, or a throwing getter, the converter body throws before
  any message is formatted. Fixing every property read in every built-in, and every custom converter
  downstream, is unbounded. The boundary is one place.
- **The masking cost is small.** The error is not swallowed: it becomes a `Failure` whose message is
  the thrown error's message, which every caller already handles, and `orThrow` re-raises it. What is
  lost is the stack trace and the distinction between "invalid input" and "bug in my callback".
  Weighed against #713 — a throw that bypassed every combinator and became a 500 — that is the right
  trade for a published `Result` boundary.
- **Repo-wide `rush test` is the check** that no consumer relied on a throw propagating out of
  `convert`. See `result.md`.

### D4 — scope additions beyond `JSON.stringify`

- `stringifyLogValue` (logger, a diagnostics path): `String(value)` threw on a null-prototype
  object. Fixed the same way (brief decision 2 allows this for the logger). Its cyclic case never
  threw (already `captureResult`-wrapped) and is unchanged.
- `KeyValueConverters.convertEntry` and `Normalizer.normalizeLiteral` carried `c8 ignore` on their
  failure line although both are reachable through public calls; the regression tests reach them,
  so the directives were removed.
- `ts-extras` `conversion` (3 sites) and `ts-bcp47` `validationHelpers` (1 site) had the same
  pattern on a converter/validator failure path, per the brief's "other packages" clause.

## Open / for the orchestrator

- **Recursive JSON converters on cyclic input** (`ts-json-base` `jsonObject` / `jsonArray` /
  `jsonValue`, converter and validator). They recurse until the stack is exhausted. The boundary now
  turns that into a `Failure`, but its message carries one property-path prefix per level (27 KB on a
  two-key cycle). Not a formatting problem, so not fixed here. A cycle check in those converters
  would fail fast with a short message. Candidate `TECH_DEBT.md` entry.
- **`isJsonObject` / `isJsonPrimitive` throw on a Proxy whose traps throw**, so
  `classifyJsonValue(proxy)` still throws. Type guards, not failure messages; not changed.
- Element-wise converters (`arrayOf`, `recordOf`, `mapOf`, `tuple`, `Validators.arrayOf`) aggregate
  one message per element, so a 100 000-element input yields a long message. Not a formatting issue.

## Review round 1 decisions

### D5 — the boundary, revised

- **Stack exhaustion propagates to the outermost boundary.** Converting it at every level let each
  level go on to its next sibling and exhaust the stack again, which on two back-edges is
  exponential. The nesting depth is a module-level counter. Each call reads it into a local before
  incrementing, and restores it in a `finally` by arithmetic alone. A first attempt that restored it
  outside a `finally` leaked the count when the catch itself hit the stack limit, and let the
  exhaustion escape the outermost converter; the child-process tests caught that.
- **Detection is by constructor and name, not message.** `RangeError` (V8, JavaScriptCore) or
  `InternalError` (SpiderMonkey). A check that throws, because the stack is too close to its limit or
  the thrown value is a trapping Proxy, counts as exhaustion, since propagating is the safe direction.
  The cost is that a rare non-exhaustion `RangeError` loses its nested path prefix.
- **Failures are prefixed** `converter threw:` / `validator threw:`.
- **Masking, stated plainly.** A buggy callback is a failure, so whatever expects failures hides it:
  `convertOptional` with `ignoreErrors`, `oneOf` / `or` / `withAction`, `orDefault`, and `guard`
  (`false`). `orThrow` re-raises the message without the original class or stack.

### D6 — the formatter, revised (supersedes D1's "no `toJSON`")

`JSON.stringify` with a minimal replacer first; the D1 walker is now the fallback for what still
throws. Byte identity therefore extends to everything `JSON.stringify` rendered, which a hand-written
walker could only approximate. The replacer's lower-bound length and call budget keep the first
attempt bounded on a huge or exponentially shared graph. Tokens inside a `JSON.stringify` rendering
are quoted strings (`"[Circular]"`, `"123n"`), because a replacer can only return JSON values; the
fallback keeps them bare.

### D7 — the JSON cycle check

`_JsonActivePath` (internal export of `ts-json-base` `json`) is shared by the six recursive JSON
converters and validators, because they call one another. It is cleared outright when the outermost
container exits, so an exit cut short by stack exhaustion cannot leave an entry that reports a false
cycle later.

### Not done

- P3-5 (readable `Error`/`Map`/`Set` in the fallback): optional, and after D6 these render exactly as
  `JSON.stringify` does unless something in the value throws.
