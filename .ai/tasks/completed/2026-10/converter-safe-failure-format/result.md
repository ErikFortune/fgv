# Result: `converter-safe-failure-format`

**Shipped:** converter and validator failure messages can no longer throw. A new
`formatValueForMessage` in `@fgv/ts-utils` renders any value — cyclic, `BigInt`, symbol, Proxy,
throwing getter, huge or deep — as bounded text, and is byte-identical to `JSON.stringify` for
JSON-safe values within its bounds. `BaseConverter` and `GenericValidator` additionally turn any
throw from the function they wrap into a `Failure`, so `convert`, `validate` and `guard` never throw.

Origin: personaility#714 (fgv-ask), found by personaility#713. Base / PR target: `integration/asks`.
PR: #TBD.

## The formatter

`formatValueForMessage(value: unknown, options?: IFormatValueForMessageOptions): string` in
`ts-utils` `base` (`src/packlets/base/formatValue.ts`), exported from the package root with
`IFormatValueForMessageOptions` (`maxLength?`, `maxDepth?`, `indent?`, `style?: 'json' | 'string'`),
`DEFAULT_FORMAT_VALUE_MAX_LENGTH` (200) and `DEFAULT_FORMAT_VALUE_MAX_DEPTH` (16).

| input | rendering |
|---|---|
| JSON-safe, within bounds | exactly `JSON.stringify(value, undefined, indent)` |
| top-level `undefined` | `undefined` (what `${JSON.stringify(undefined)}` produced) |
| reference back to an ancestor | `[Circular]` |
| `BigInt` / symbol / function / nested `undefined` | `5n` / `Symbol(s)` / `[Function f]` / `undefined` |
| class instance | `Socket {"connecting":false,"parser":{"socket":[Circular]}}` |
| typed array | `Uint8Array [1,2,3]` |
| throwing getter, Proxy trap, revoked Proxy | `[Unreadable]` (per property, or for the whole object) |
| `Date` | as `JSON.stringify`, through the intrinsic `Date` methods |
| user `toJSON` | **not invoked** |
| over `maxLength` | cut to `maxLength` ending in `…`; walk stops once the budget is spent |
| options whose accessors throw, stack exhaustion with bounds lifted | `[Unreadable]` |

`style: 'string'` is `String(value)` (template-literal text), falling back to the JSON rendering when
that throws, bounded by `maxLength`. It exists so the sites that always interpolated the value
directly keep their text. Decisions and reasoning are in `state.md` D1–D2.

**Compatibility evidence** (`formatValueForMessage.test.ts`): 20 representative JSON values compared
compact and indented (2 and 4); NaN/±Infinity, null-prototype objects, `Date`s, repeated non-cyclic
references; 500 seeded generated JSON values (strings with escapes, astral and lone-surrogate
characters, `-0`, exponents, numeric keys) compared at default bounds — the test asserts both sides
of the 200-char bound were exercised — plus unbounded and indented; 300 more checking that a
truncated rendering is a prefix of `JSON.stringify` plus `…`.

## Boundary guard: added

See `state.md` D3. Short form: the formatter cannot cover a throw from the converter's own property
reads (a Proxy `get` trap inside `Converters.object`), the guard is one place, and the error is not
lost — it becomes the `Failure` message.

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

None. No test outside the four new or extended test files was edited, and the repo-wide `rush test`
passed (below), which is the evidence for the compatibility contract.

## Gates

Run from the repo root of the worktree, logs in `.gate-logs/`.

| gate | exit | `not met\|Operations failed\|error TS\|Jest tests? failed` | `warning` lines |
|---|---|---|---|
| `rush install` | 0 | – | – |
| `rush change --verify --target-branch origin/integration/asks` | 0 | – | – |
| `rush rebuild` | 0 | 0 | 1 (tracked-symlink notice) |
| `rush test` (39 of 39 projects, no flaky re-runs needed) | 0 | 0 | 1 (tracked-symlink notice) |
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

- **The recursive JSON converters** (`ts-json-base` `jsonObject` / `jsonArray` / `jsonValue`, both
  families) recurse into a cycle until the stack is exhausted. The guard makes that a `Failure`, but
  the message carries one path prefix per level (27 KB measured on a two-key cycle). A cycle check
  there would fail fast. Recorded in `docs/TECH_DEBT.md`.
- **`isJsonObject` / `isJsonPrimitive` throw on a Proxy whose traps throw**, so
  `classifyJsonValue(proxy)` still throws. These are type guards, outside this stream.
- **Element-wise converters aggregate one message per element**, so a huge invalid array yields a
  huge message. That is by design and not a formatting issue; the tests skip the large-array case
  for those families.
- **`maxDepth` 16 is part of the contract.** A JSON value nested more than 16 deep but under 200
  characters renders with `[…]` where `JSON.stringify` would not. No downstream test hit it.
