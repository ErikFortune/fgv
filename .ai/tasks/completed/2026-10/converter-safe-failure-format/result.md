# Result: `converter-safe-failure-format`

**Shipped:** converter and validator failure messages can no longer throw. A new
`formatValueForMessage` in `@fgv/ts-utils` renders any value — cyclic, `BigInt`, symbol, Proxy,
throwing getter, huge or deep — as bounded text, and is byte-identical to `JSON.stringify` for
every value `JSON.stringify` rendered without throwing, up to its length bound. `BaseConverter` and
`GenericValidator` additionally turn any throw from the function they wrap into a `Failure`, so
`convert`, `validate` and `guard` never throw, and the recursive JSON converters fail at once on a
cycle.

Origin: personaility#714 (fgv-ask), found by personaility#713. Base / PR target: `integration/asks`.
PR: #TBD.

## The formatter

*As revised in review rounds 1 and 2 (below); the round-0 design rendered everything with its own
walker.*

`formatValueForMessage(value: unknown, options?: IFormatValueForMessageOptions): string` in
`ts-utils` `base` (`src/packlets/base/formatValue.ts`), exported from the package root with
`IFormatValueForMessageOptions` (`maxLength?`, `indent?`, `style?: 'json' | 'string'`),
`DEFAULT_FORMAT_VALUE_MAX_LENGTH` (200) and `DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH` (1000).

1. **`JSON.stringify(value, replacer, indent)` first.** The replacer intervenes only where
   `JSON.stringify` would throw: a reference back to an object on the active ancestor path becomes
   `"[Circular]"`, a `BigInt` becomes `"123n"`. It also keeps a lower bound on the output length
   (a non-null object counts 1) and abandons the call once the output must exceed `maxLength`.
2. **A reimplementation of the same serialization** when that throws (a getter, Proxy trap or
   `toJSON`, stack exhaustion), produces nothing (a top-level `undefined`, symbol or function), or is
   abandoned. It follows `SerializeJSONProperty` — `toJSON`, the two substitutions, `rawJSON`, boxed
   primitives, omitted members, `null` in arrays, `ToLength` on array lengths — contains every read
   as `[Unreadable]` in place, and stops writing at the bound.
3. **Then the `maxLength` cut**, ending in `…`.

So for every value `JSON.stringify` renders without throwing, the text is `JSON.stringify`'s, cut to
the bound, and above the bound a cut rendering is a prefix of it. The only departures are the
`"[Circular]"` and `"123n"` substitutions, `[Unreadable]`, and the top-level tokens. `style:
'string'` is `String(value)` with the JSON rendering as the fallback where `String()` throws,
bounded at 1000 by default.

**Compatibility evidence** (`formatValueForMessage.test.ts`): 20 representative JSON values compared
compact and indented (2 and 4); NaN/±Infinity, null-prototype objects, `Date`s, repeated non-cyclic
references; 500 seeded generated JSON values compared at default bounds — the test asserts both
sides of the 200-char bound were exercised — plus unbounded and indented; 300 more checking that a
truncated rendering is a prefix of `JSON.stringify` plus `…`; and, from round 1, 15 values that are
not JSON-safe but rendered without throwing (the reviewer's `p2.js` set), compared compact and
indented. The reviewer's `p2.js` probe now reports `DIFF` only for values over 200 characters and,
in the `'string'` style, for the two inputs that used to throw.

## Boundary guard: added

See `state.md` D3 and D5. Short form: the formatter cannot cover a throw from the converter's own
property reads (a Proxy `get` trap inside `Converters.object`), and the guard is one place. The error
is not lost: it becomes a failure reading `converter threw: <message>` or `validator threw: <message>`.
Stack exhaustion is re-thrown below the outermost boundary so that it fails once (review round 1).

## Sweep table — every `JSON.stringify` in the two packages' non-test sources

Line numbers are on the base (`integration/asks` @ `598730f0b`).

### `@fgv/ts-utils`

| site | classification | action |
|---|---|---|
| `conversion/basicConverters.ts:59` `enumeratedValue` | failure message | fixed |
| `basicConverters.ts:105,106` `mappedEnumeratedValue` | failure message | fixed |
| `basicConverters.ts:124` `literal` (×2: `from`, expected `value`) | failure message | fixed |
| `basicConverters.ts:147` `number` | failure message | fixed |
| `basicConverters.ts:163` `boolean` | failure message | fixed |
| `basicConverters.ts:288` `isA` | failure message | fixed |
| `basicConverters.ts:348` `oneOf` | failure message | fixed |
| `basicConverters.ts:369` `arrayOf` | failure message | fixed |
| `basicConverters.ts:494` `recordOf` | failure message | fixed |
| `basicConverters.ts:589` `mapOf` | failure message | fixed |
| `basicConverters.ts:637` `validateWith` | failure message | fixed |
| `basicConverters.ts:718,720` `field` | failure message | fixed |
| `basicConverters.ts:757` `optionalField` | failure message | fixed |
| `basicConverters.ts:930,933` `discriminatedObject` | failure message | fixed |
| `conversion/baseConverter.ts:300` `withTypeGuard` | failure message | fixed |
| `baseConverter.ts:328` `withItemTypeGuard` | failure message | fixed |
| `baseConverter.ts:360` `withConstraint` | failure message | fixed |
| `conversion/advancedConverters.ts:398,403` `tuple` | failure message | fixed |
| `conversion/stringConverter.ts:82` `string` | failure message | fixed |
| `validation/validators.ts:131` `recordOf` | failure message | fixed |
| `validators.ts:189` `enumeratedValue` (`indent: 2`) | failure message | fixed |
| `validators.ts:206` `literal` (`indent: 2`) | failure message | fixed |
| `validation/field.ts:94,97` | failure message | fixed |
| `validation/genericValidator.ts:152` `withConstraint` | failure message | fixed |
| `validation/typeGuard.ts:81` | failure message | fixed |
| `collections/keyValueConverters.ts:117` `convertEntry` | failure message | fixed (its `c8 ignore` removed: reachable, now tested) |
| `base/normalize.ts:196` `normalizeLiteral` | failure message (rendered a function as `undefined`) | fixed (`c8 ignore` removed: reachable, now tested) |
| `hash/hashingNormalizer.ts:101` | failure message, protected and unreachable by type | fixed; its `c8 ignore` kept |
| `base/normalize.ts:108,110,123` (RFC 8785 canonicalize) | content | unchanged |
| `base/normalize.ts:82` | comment | unchanged |
| `logging/logger.ts:76` `stringifyLogValue` | content (log text), already `captureResult`-wrapped, cycle falls back to `String()` | unchanged; the adjacent `String(value)` threw on a null-prototype object and is fixed (`state.md` D4) |

### `@fgv/ts-json-base`

| site | classification | action |
|---|---|---|
| `validators/validators.ts:190` `literal` | failure message | fixed |
| `validators/validators.ts:220` `enumeratedValue` | failure message | fixed |
| `converters/converters.ts:264` `enumeratedValue` | failure message | fixed |
| `converters/converters.ts:146` | comment | unchanged |
| `json/common.ts:241,253` (`JSON.parse(JSON.stringify(...))` clone) | content, inside `captureResult` | unchanged |
| `json/common.ts:101` | doc example | unchanged |
| `file-tree/in-memory/inMemoryTree.ts:337,357`, `file-tree/fileItem.ts:215` | file contents, inside `captureResult` | unchanged |
| `inMemoryTree.ts:65` | comment | unchanged |
| `json-schema-builder/constraints.ts:476` `describeEnumMember` | other: string branch only, cannot throw | unchanged |
| `constraints.ts:576,581` `pattern.source` | other: a string, cannot throw | unchanged |
| `json-schema-builder/validatedOptions.ts:277` `source` | other: a pattern string, cannot throw | unchanged |
| `json-schema-builder/fromJson.ts:635` `_echo(source)` | other: `_echo` returns a string | unchanged |
| `json-schema-builder/keywordAdaptation.ts:269,275` `foldedKeywordsText` | content: tool-description text over typed `JsonValue`s, pinned downstream | unchanged |

### Same defect, not `JSON.stringify` (template-literal / `String()` failure sites)

These throw on a symbol (template literal) or on a null-prototype object / trapping Proxy
(`String()`), so they were routed through `style: 'string'`, which keeps their text.

| site | action |
|---|---|
| `ts-utils` `validation/string.ts:64`, `number.ts:64`, `boolean.ts:61`, `array.ts:82`, `oneOf.ts:76` | fixed |
| `ts-utils` `conversion/advancedConverters.ts:142` `compositeIdFromString`, `validation/compositeId.ts:144` | fixed |
| `ts-json-base` `converters/converters.ts:69`, `validators/validators.ts:64` `jsonPrimitive` | fixed |
| `ts-json-base` `json/common.ts:186` `classifyJsonValue` | fixed |
| `ts-utils` `stringConverter.ts:158-221`, `validators.ts:187`, `compositeId.ts:69-80` | unchanged: the value is already known to be a string |

### Other packages (brief: "only if a sweep finds the same pattern")

`grep -rnE "JSON\.stringify\(from\b"` over `libraries/ tools/ samples/` non-test sources:

| site | action |
|---|---|
| `ts-extras` `conversion/converters.ts:44` `templateString`, `:73` `isoDate`, `:100` `isoDateTime` | fixed |
| `ts-bcp47` `utils/validationHelpers.ts:112` `toCanonical` | fixed (not a converter, so the boundary guard did not cover it; it threw) |
| `ts-bcp47` `utils/jsonHelpers.ts:24` (clone) | content, unchanged |

## Regression tests — red first

- `ts-utils` `failureFormatSafety.test.ts`: 24 converter families and 13 validator families × 9
  hostile values (cyclic object, cyclic class instance mirroring #713's `Socket.parser.socket`,
  `BigInt`, symbol, null-prototype object, throwing getter, Proxy whose traps throw, 100 000-element
  array, 100 000-deep nesting), plus the nested `Converters.object` chain from #713 (asserting the
  field is named, the cycle renders, and `.orDefault('unknown')` now runs), `convertEntry`,
  `normalizeLiteral`, and the boundary guard. Each asserts no throw, a `Failure`, and a message of
  at most 1 500 characters.
  **Red run before the fix** (formatter present, no site routed, no guard): **240 of 333 failed**,
  among them `TypeError: Converting circular structure to JSON`. Seven of the nine table rows for the nested #713 chain (all but the symbol and the null-prototype object, which `JSON.stringify` drops or renders without throwing), and all five standalone tests (the #713 message, `convertEntry`, `normalizeLiteral`, and both boundary-guard tests), were red.
- `ts-json-base` `failureFormatSafety.test.ts`: 15 families × 7 hostile values plus pinned-text
  tests. Run against the fixed `ts-utils` with `ts-json-base`'s own sources reverted: the
  cyclic-message test was red (the guard had already turned the rest into failures, with the
  `TypeError` text as the message). Green after.
- `ts-bcp47` `iana/common/validate.test.ts`: `toCanonical(cyclic)` red (`TypeError: Converting
  circular structure to JSON`), green after.
- `ts-extras` `converters.test.ts`: red (the message was the `TypeError` text instead of `Not a
  string: {…}`), green after.
- `stringifyLogValue`: `String(Object.create(null))` throws `Cannot convert object to primitive
  value` (verified directly with node). The new test was written with the fix and not run red.

## Downstream test text changes

None. No test outside the four new or extended test files was edited, in round 0 or round 1, and
the repo-wide `rush test` passed both times (below), which is the evidence for the compatibility
contract.

## Gates

Run from the repo root of the worktree, logs in `.gate-logs/`.

| gate | exit | `not met\|Operations failed\|error TS\|Jest tests? failed` | `warning` lines |
|---|---|---|---|
| `rush install` | 0 | – | – |
| `rush change --verify --target-branch origin/integration/asks` | 0 | – | – |
| `rush rebuild` | 0 | 0 | 1 (tracked-symlink notice) |
| `rush test` (39 of 39 projects, no flaky re-runs needed) | 0 | 0 | 1 (tracked-symlink notice) |
| **round 1:** `rush rebuild` | 0 | 0 | 1 (tracked-symlink notice) |
| **round 1:** `rush test` (39 of 39, no flaky re-runs) | 0 | 0 | 1 (tracked-symlink notice) |
| **round 1:** package build / lint / test, all four packages | 0 / 0 / 0 each | 0 | 0 |
| **round 1:** `change --verify`, feed `--check`, `verify-capability-docs`, prettier `--check` | 0, 0, 0, 0 | – | – |
| **round 2:** package build / lint / test, all four packages | 0 / 0 / 0 each | 0 | 0 |
| **round 2:** `rush rebuild` | 0 | 0 | 1 (tracked-symlink notice) |
| **round 2:** `rush test` (39 of 39, no flaky re-runs) | 0 | 0 | 1 (tracked-symlink notice) |
| **round 2:** `change --verify`, feed `--check`, `verify-capability-docs`, prettier `--check` | 0, 0, 0, 0 | – | – |
| `ts-utils` build / lint / test | 0 / 0 / 0 | 0 | 0 |
| `ts-json-base` build / lint / test | 0 / 0 / 0 | 0 | 0 |
| `ts-extras` build / lint / test | 0 / 0 / 0 | 0 | 0 |
| `ts-bcp47` build / lint / test | 0 / 0 / 0 | 0 | 0 |
| prettier 2.8 `--check` on changed files | 0 | – | – |
| `generate-capability-feed --check`, `verify-capability-docs` | 0, 0 | – | – |

Coverage: `ts-json-base`, `ts-extras` and `ts-bcp47` 100% across the board. `ts-utils`: every touched
file 100%. The package total is 99.27%, against a configured threshold of 98%; the files under 100%
(`conversion/converters.ts`, `hash/crcNormalizer.ts`, `logging/bootLogger.ts`,
`collections/aggregatedResultMap.ts`, `readOnlyConvertingResultMap.ts`, `logReporter.ts`) are
untouched by this stream.

## Observations, not fixed

- ~~The recursive JSON converters recurse into a cycle until the stack is exhausted~~ — fixed in
  review round 1 (P1-1); the TECH_DEBT entry this stream had added was retired in the same PR.
- ~~`classifyJsonValue(proxy)` still throws~~ — fixed in review round 1 (P2-3). `isJsonObject` /
  `isJsonPrimitive` themselves still throw on a trapping Proxy; they are type guards.
- **Element-wise converters aggregate one message per element**, so a huge invalid array yields a
  huge message. That is by design and not a formatting issue; the tests skip the large-array case
  for those families.
- ~~`maxDepth` 16 is part of the contract~~ — removed in round 2; the length bound limits depth.
- **The JSON active path is module state.** A recursive JSON conversion started from inside a
  callback of another one, over an object the outer walk is still inside, reports a cycle. JSON
  cannot be cyclic, and nothing in the repo does this.
- **Two `RangeError`s that are not stack exhaustion** (an invalid array length, `toFixed(200)`) also
  propagate to the outermost boundary, losing only their nested path prefix. Detection is by
  constructor and name (`RangeError`, `InternalError`), not by message, and a check that itself throws
  counts as exhaustion.

## Review round 1

Reviewed at `fd26efbae`: one P1, three P2s, five P3s. Fixes in `610d9cf78` and `1551fd708`. "Red"
means the new test failed when run against the `fd26efbae` sources (`tsutils-red2.log`: 10 of 340
failed; `tsjb-red2.log`: 28 of 117 failed). The child-process cases were killed at their 15 s limit
(`timedOut` true), and the suite did not hang.

| finding | fix | test | red on `fd26efbae` |
|---|---|---|---|
| **P1-1** guard turns a fast stack overflow into an exponential hang (`a.k0 = a; a.k1 = a`, the socket shape, a 100k-deep DAG) | (1) `_atResultBoundary` in `ts-utils` `base/boundary.ts`: shared depth counter read into a local and restored in `finally` by arithmetic; below the outermost boundary a `RangeError`/`InternalError` (by constructor and name; a check that throws counts) is re-thrown, so it fails once. (2) `_JsonActivePath` in `ts-json-base` `json/activePath.ts`: `jsonObject`/`jsonArray`/`jsonValue`, converter and validator, fail at once with `circular reference at $.k0`; state is cleared outright when the outermost container exits. (4) TECH_DEBT P3 retired. | ts-utils: 4 child-process cases (two back-edges, converter and validator; socket shape; 20 000-deep DAG), each with a 15 s hard kill; in-process single-edge and propagation tests. ts-json-base: 5 child-process cases (two back-edges converter/validator, socket shape converter/validator, 20 000-deep DAG), a child-process path-message test, in-process single-edge, DAG-without-cycle, and "no state left behind" tests. | yes, except the ts-utils validator two-back-edge case, which finished in time on the old code; the ts-json-base validator cases were red |
| **P2-1** failure text changed for inputs that rendered before | `JSON.stringify` with a minimal replacer first, the rich renderer only as the fallback, then the cut; `maxDepth` applies to the fallback only; top-level `undefined`/symbol/function render as tokens | 15 `p2.js`-style values asserted byte-identical, compact and indented; `toJSON` invoked once; existing compatibility tests | the byte-identity rows are new-contract tests and not meaningful against the old renderer; the reviewer's `p2.js` is the before/after evidence |
| **P2-2** guard masks errors silently | failures read `converter threw: …` / `validator threw: …`; masking documented in both constructors' TSDoc, `CAPABILITIES.md` and `state.md` D5 (`ignoreErrors`, `oneOf`/`or`/`withAction`, `orDefault`, `guard`; `orThrow` loses class and stack) | `^converter threw: callback exploded$`, `^validator threw: validator exploded$` | yes (both) |
| **P2-3** `classifyJsonValue` throws on a trapping Proxy | classification wrapped in `captureResult`, failure `Invalid JSON: <value>: <error>` | `classifyJsonValue › fails instead of throwing for a Proxy whose traps throw` | yes |
| **P3-1** symbol-fallback wording; say what runs | option and function TSDoc rewritten: getters, Proxy traps and `toJSON` run (as in `JSON.stringify`); `toString` in the `'string'` style | – | – |
| **P3-2** `'string'` style truncates at 200 | own default `DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH` (1000). Unbounded was rejected: `String()` of the 100 000-element fixture is 588 KB. Text changes only above 1000 characters, which is documented | `'y'.repeat(500)` unchanged; `'y'.repeat(5000)` cut at 1000; the large-array rows of the hostile table stay under 1500 | – |
| **P3-3** `stringifyLogValue` fallback and marker | the `String()`-throws fallback renders with `formatValueForMessage` at limit + 1 and is cut with the same `...` as the JSON path; a `toJSON` returning `undefined` (which threw `TypeError` inside `onSuccess`) falls back to `[object Object]`. The established `[object Object]` fallback for cycles is kept: it is pinned in `logger.test.ts` and is not a throw | null-prototype long value ends in `...` at 40; `toJSON` → `undefined` case | – |
| **P3-4** "costs about as much as a small one" overclaim | replaced by the actual bound: proportional to `maxLength` plus omitted members, capped at max(10 000, 50 × maxLength) calls | 2^64-path DAG returns at the bound; 20 000 omitted members capped | – |
| **P3-5** `Error`/`Map`/`Set` readability in the fallback (optional) | not done: these now render exactly as `JSON.stringify` does unless something in the value throws | – | – |

## Review round 2

Reviewed at `3fdbb7a4b`: P1-1, P2-2 and P2-3 confirmed fixed, three P2s and five P3s remaining. Fixes
in `9d57cf017`. "Red" means the new test failed against the `3fdbb7a4b` sources
(`tsutils-red3.log`: 20 of 2235 failed). No downstream test outside this stream's own was changed
except the `[object Object]` pins in `logger.test.ts`, below.

| finding | fix | test | red on `3fdbb7a4b` |
|---|---|---|---|
| **P2-A** byte identity breaks above `maxLength`: the length budget switched to a renderer with different semantics (`p6.js`: 23k of 57k cut renderings were not a prefix of `JSON.stringify`) | The fallback is now a reimplementation of `JSON.stringify`'s serialization with the same replacer behaviour: `toJSON` in a `try` (`[Unreadable]` on a throw), `undefined`/function/symbol omitted from objects and `null` in arrays, boxed primitives unwrapped (a boxed `BigInt` as `"7n"`), `JSON.rawJSON` honoured, `ToLength` on array lengths, no class prefixes, so typed arrays, `Map`s and errors render as `JSON.stringify` renders them. `"[Circular]"` and `"123n"` are quoted in both paths. `maxDepth` and its default constant are removed, since a depth cut is a further deviation and the length bound already limits depth. P3-1: the lower bound counts a non-null object as 1 (a boxed number renders as `5`). P3-2: the call budget is removed, because members `JSON.stringify` omits are leaves, so the walk is bounded by the visited objects' own keys, and any cap would change the text of an object with many omitted members. | A seeded property test over `p6.js`'s generator: 4 000 values × `maxLength` 20/50/200, plus indent 2 at 60, each asserting `f(v, { maxLength }) === truncate(JSON.stringify(v))`. The test asserts more than 1 000 cases are over the bound. Also the nine `p6.js` shapes, compact and indented; a member-by-member parity test of the fallback (forced by a throwing sibling) against `JSON.stringify`; array-length `ToLength`; `rawJSON`; and 40 000 omitted members rendering exactly. `p6.js` now reports `random 56712 diffs 0`. | yes |
| **P2-B** `_isStackExhaustion` matched every `RangeError` (`p7.js`) | Stack exhaustion only: `name === 'InternalError'`, or `name === 'RangeError'` with a message containing `call stack` or `too much recursion`. Judged by `name`, which also works across realms. "Check throws ⇒ yes" is kept. **The message is matched by substring, not by the suggested `RegExp`.** V8 compiles a regular expression on first use, and compiling one with the stack nearly exhausted aborts the process (`FATAL ERROR: RegExpCompiler Allocation failed`), which is exactly when the check runs. The first version used a `RegExp` and crashed the Jest worker. The doc claiming this "loses nothing but nested path context" is replaced. | An ordinary `RangeError` (`new Date('bad').toISOString()`) keeps its nested path; is dropped by `arrayOf(…, 'ignoreErrors')`; is skipped by `oneOf`; is absorbed by `optional('ignoreErrors')` and `convertOptional(…, 'ignoreErrors')`; and a nested `guard` answers `false`. A `RangeError` reading as exhaustion is still propagated. `p7.js` now shows every `ignoreErrors`/`oneOf`/`optional`/`guard` row as `OK`. | yes (3 tests) |
| **P2-C** two closures per call; hot path about 1.5× slower | The boundary is written out in each wrapper (`baseConverter.ts`, `genericValidator.ts`), passing the arguments straight through, with no per-call allocation. The shared depth lives in an internal `_resultBoundary` object, aliased to a module-local `const` in each file. Read through the package's `export *` chain, every access was a getter call: with the inlined wrapper alone the benchmark got *slower* (object median ≈ 900 ms), and with the alias it reached the baseline. | `p5b.js`, below | – |
| **P3-1** getters can run twice | Documented in the `formatValueForMessage` TSDoc and in `CAPABILITIES.md`. | – | – |
| **P3-2** `_JsonActivePath` false positive | Documented on the class: a JSON conversion started *during* another one, such as from a getter, over an object the outer walk is still inside reports a cycle. `p8.js` "getter re-enters on ancestor" shows it. | – | – |
| **P3-3** mutable singleton exported from the package root | Each of the `converters` and `validators` packlets now holds its own instance in a file its index does not export (`converters/activePath.ts`, `validators/activePath.ts`). Their three recursive members call only each other, so nothing needs a shared instance. Only the stateless class `_JsonActivePath` is still exported, because the packlet rule allows a cross-packlet import only through the `json` index, and the root re-exports that index wholesale. `p8.js` reports `_jsonActivePath` as `undefined` on the package. | `ts-json-base` suite | – |
| **P3-4** `stringifyLogValue`'s `[object Object]` case | Routed through `formatValueForMessage` for a cyclic, `BigInt` or partly unreadable object. `[object Object]` is kept only where the rendering is nothing at all (a throwing `toJSON`, or one returning `undefined`). The three `logger.test.ts` pins, and three `stringifyLogValue.test.ts` pins, were changed. The new text is strictly better: `{"name":"test","self":"[Circular]"}` instead of `[object Object]` names the content and the cycle. The `...` marker and the 40-character limit are unchanged. | the changed pins and a `BigInt` case | yes |
| **P3-5** `captureResult` between nested levels | One sentence in both constructors' TSDoc and in `CAPABILITIES.md`. | the propagated exhaustion is caught by a `captureResult` between two converters | – |

**Coverage directive.** `_rawJsonText` has a `c8 ignore` on the branch for engines without
`JSON.isRawJSON`, which the Node the suite runs on always has. `jest.replaceProperty` refuses to
replace a function, and a hand-rolled save/restore of a global is a named anti-pattern here. **This
needs your approval**, per the testing guidelines; the alternative is to drop `rawJSON` support,
which would break parity on runtimes that have it.

### `p5b.js`, same machine, back to back

Runs alternated base / round 1 / round 2, six iterations each per invocation. `base` is the
pre-guard `ts-utils` (`88c3f0172`), `round1` is `3fdbb7a4b`, and `round2` is this commit.

| build | `arrayOf(object)` over 1M (median ms) | `arrayOf(number)` over 3M (median ms) |
|---|---|---|
| base (no guard) | 516 | 190 |
| round 1 (two closures per call) | 782 | 312 |
| round 2 | 528 | 213 |

Round 2 is within noise on the object case (+2%) and about 12% on the 3M-number case, where the
per-call work is smallest and the `try`/`finally` is the largest share.

