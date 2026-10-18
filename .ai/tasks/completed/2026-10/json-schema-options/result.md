# Result: `json-schema-options`

Branch `json-schema-options`, based on `integration/asks` at `b90de8b2b`. PR: #TBD.

## What shipped

**The options are validated, not the schema. No `JsonSchema` factory throws.**

- **Validated-options factories**, each returning `Result` of a nominal instance holding a frozen copy:
  - `JsonSchema.numberOptions(opts)` → `ValidatedNumberOptions<T>`, for `number`.
  - `JsonSchema.integerOptions(opts)` → `ValidatedIntegerOptions<T>`, for `integer` (and `number`):
    the range must hold an integer.
  - `JsonSchema.stringOptions(opts)` → `ValidatedStringOptions<T>`, for `string`.
  - `JsonSchema.schemaOptions(opts)` → `ValidatedSchemaOptions<T>`, for `boolean`, `enumOf`,
    `array`, `object`, `record`, `anyValue` — the way to give those a `default` or `examples`.
- **Factories accept only validated options or plain options** (`PlainSchemaOptions` and its
  `Number` / `String` / `Object` / `Any` siblings), which hold only what cannot be wrong:
  `description`, `title`, `nullable`, and `strict` / `format` / `additionalProperties` where they
  apply. A constraint key, `default` or `examples` on a raw literal is a compile error, as is a
  misspelt key on an options factory and `numberOptions` output passed to `integer`.
- **`nullable: true` survives validation** as a literal type, so the nullable overloads still give
  `Static` = `T | null`.
- **`numberEnumOf` / `integerEnumOf` / `booleanEnumOf` return `Result<ISchemaValidator<T>>`**: what
  can be wrong there is the value list, which has no option object to validate first.
- **`fromJson`** builds through the same validated path and keeps its error messages.
- **Removed:** `validateNumberOptions`, `validateStringOptions` (superseded).
- Declarations read `JsonSchema.integer(JsonSchema.integerOptions({ minimum: 0 }).shouldNotFail('age bounds'))`.

Design reasoning (generic + `Record<…, never>` for excess-key checks, the union brand, why
`nullable` stays on the options) is in `state.md`.

## No `throw` in the builder

```
$ grep -rnE "\bthrow\b|orThrow\(" libraries/ts-json-base/src/packlets/json-schema-builder/
libraries/ts-json-base/src/packlets/json-schema-builder/fromJson.ts:1275:    // nothing in it is expected to throw — but it reads a caller-supplied value, which may carry
$ grep -rnE "@throws" libraries/ts-json-base/src/packlets/json-schema-builder/ | wc -l
0
```

The one hit is a comment on `fromJson`'s `captureResult` backstop. The former single throw site,
`_coherent(...).orThrow()`, is deleted. The table of former throws and their replacements is in
`state.md` § "Former `throw`s".

## Tests

- Each options factory: success (frozen copy, equal to its input, not the input object), every
  incoherence it detects (`toFailWith`), and through a factory (the enforcement suites now build
  their factory-side nodes from validated options, alongside `fromJson`).
- `NaN` as a `default` is refused (it type-checks as `number`).
- Integer-validated options are accepted by `number`. `nullable` survives validation, and the
  static type is `number | null`.
- `// @ts-expect-error` pins: raw `minimum` / `maxLength` / `minLength`, a raw range key beside a
  plain annotation, a raw `default` / `examples`, `numberOptions` output to `integer`, and a
  misspelt key on `numberOptions`.
- A factory handed bypassed (cast) options does not throw.
- The enum factories' failures are `toFailWith`.
- `ts-json-base` coverage: 100% in all four metrics.

## Consumer sweep

The brief estimated ~32 constraint-bearing call sites. In fact every non-test call site passing a
literal to `number` / `integer` / `string` in `libraries/`, `samples/` and `tools/` passes
`{ description }` only, which is unchanged. Swept with a parser over every file that references
`JsonSchema.` (51 files outside `ts-json-base`), then confirmed by type-checking each consumer
package and the repo-wide `rebuild`.

| package | files touched | what |
|---|---|---|
| `ts-json-base` (src) | `options.ts`, `factories.ts`, `constraints.ts`, `fromJson.ts` | the change |
| `ts-json-base` (tests) | `constraints.test.ts`, `shapes.test.ts`, `keywordAdaptation.test.ts` | validated options; enum `Result`s |
| `ts-extras` (tests) | `ai-assist/schemaKeywords.test.ts` (14 sites), `ai-assist/schemaShapes.test.ts` (4) | validated options; enum `Result`s |
| `ts-extras-ollama` (tests) | `chatStructured.test.ts` (2 option sites, 1 enum) | same |

**Negative results:** no source change in `ts-extras`, `ts-extras-ollama`, `ts-extras-mcp`,
`ts-agent-memory`, `ts-agent-tasks`, `samples/testbed` or `tools/` — all their factory calls pass
`{ description }` (or nothing). No consumer of `validateNumberOptions` / `validateStringOptions`
outside `ts-json-base`'s own tests. No consumer of the non-string enum factories outside tests and
`fromJson`.

## Docs

- `ts-json-base/CAPABILITIES.md`: the `json-schema-builder` row now describes validated options and
  the `Result`-returning enum factories, and no longer mentions throwing or `validate*Options`.
- `json-schema-builder` TSDoc: the `ISchemaOptions` / `INumberSchemaOptions` / `IStringSchemaOptions`
  remarks, all new types and functions, every factory (all `@throws` removed).
- `LIBRARY_CAPABILITIES.md`: no shortcut names a changed symbol, so it is unchanged.

## Gates

Logs under `../gate-logs-json-schema-options/` (per-worktree). Every log graded by grep, NUL-checked
(`wc -c` equals `tr -d '\0' | wc -c` on each).

| gate | result |
|---|---|
| `ts-json-base` `rushx test` | exit 0; coverage 100 / 100 / 100 / 100; 0 warnings |
| `ts-json-base` `rushx build` | exit 0; 0 warnings; `etc/ts-json-base.api.md` regenerated |
| `rushx fixlint` (`ts-json-base`) | no changes |
| `rushx lint` (`ts-json-base`, `ts-extras`, `ts-extras-ollama`) | exit 0, 0 warnings each |
| repo-wide `install-run-rush.js rebuild` | exit 0; `not met|FAILURE|Operations failed|error TS` = 0; `warning` (-i) = 1, the benign Git-tracked-symlink notice; 38 projects completed |
| repo-wide `install-run-rush.js test` | exit 0; `SUCCESS: 37 operations`; error grep = 0; `warning` (-i) = 1, the symlink notice; 15m10s |
| `change --verify --target-branch origin/integration/asks` | passes (change files for `ts-json-base` `minor` BREAKING, `ts-extras` and `ts-extras-ollama` `none`) |
| `verify-capability-docs` | 0 failed |
| `generate-capability-feed --check` | 0 stale, after regenerating |
| prettier | 2.8.8 (the `rush-prettier` autoinstaller) only |

## What the brief got wrong

1. **"Plain `ISchemaOptions` (annotations and `nullable`) stays accepted directly."** Two of the
   annotations, `default` and `examples`, are runtime-checked (they must be JSON, and `NaN` is a
   `number`), and every factory threw on them. Keeping them raw contradicts "factories must contain
   no `throw`", so they moved behind `schemaOptions` / the node's options factory. `description`,
   `title` and `nullable` stay raw, as intended.
2. **The example `JsonSchema.integer(JsonSchema.numberOptions({ minimum: 0 }) …)`.** An integer
   range is stricter than a number range, so integers have their own `integerOptions`, and
   `numberOptions` output passed to `integer` is a compile error.
3. **"About 32 call sites pass constraint options … update every one."** None in source. The 32
   came from the grep the brief gives, which matches `{ description }` literals too. The real
   changes were all in tests.
4. Minor: the brief names "the enum factories" as option families. Only the non-string ones could
   fail, and on their value lists rather than their options, so they took the brief's
   return-a-`Result` branch.
