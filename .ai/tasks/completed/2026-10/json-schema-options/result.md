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

## Review round 1

The deep review required changes. Every finding is resolved.

| finding | resolution |
|---|---|
| **P1a** A spread kept the brand on an unchecked copy (`number({ ...v, maximum: -1 })`) | Validated options are now **nominal classes** whose options sit in an ES `#private` field. A spread's type lacks the private member, and it carries the class's `kind` discriminant, which plain options declare `never`. Pinned with `@ts-expect-error`. At run time a spread copies only `kind` (pinned with `toEqual`). |
| **P1b** A literal with `__brand` forged validation | No literal is assignable to a class with a `#private` member. Two forge shapes are pinned: a fake `kind`, and an instance-shaped literal. Factories read options only through `instanceof`, so a cast forgery is read as plain, and nothing throws (pinned). |
| P1 constraints: keep literal inference, integer→number, number→integer refusal | The classes are generic and covariant in `T`. The overloads take `Validated…Options<{ nullable: true }>`, and the existing `number \| null` test still type-checks. `ValidatedIntegerOptions extends ValidatedNumberOptions` and adds its own `#integer`. Both directions are pinned. |
| **P2** index-signature bypass | No cheap type-level close. Documented on `PlainSchemaOptions` (and in `CAPABILITIES.md`) as a known limitation, and pinned by a test: a `Record<string, unknown>` with `minimum: 5, maximum: 1` is accepted, its constraints are applied as given, and nothing throws. |
| **P2** missing pins | Added for a wide `INumberSchemaOptions`, `Partial<IStringSchemaOptions>`, `as const`, a spread of a raw object, spread and forge, and string options passed to `number`. |
| **P2** stale `fromJson` comment | Now names `numberOptions` / `integerOptions` (and `stringOptions` on its sibling). |
| P3 formatting | `fixlint` and prettier 2.8 run in `ts-json-base`, `ts-extras` and `ts-extras-ollama`. The remaining >110-column lines are pre-existing strings and imports that prettier does not break. |
| P3 `default` remark | Reworded into two sentences without stacked dashes. |
| P3 `.shouldNotFail` | 53 options steps in tests now use `.shouldNotFail('<kind> options')`. |

Why `#private` rather than a `unique symbol` or TypeScript `private`: see `state.md` § "Review round
1". In short, it is the only one of the three that closes the hole both in the type system and at
run time.

### Gates, round 1

All logs were checked for NUL padding, and none was found.

| gate | result |
|---|---|
| `ts-json-base` build / test | exit 0; coverage 100% (4/4); the only build notice is the API-signature update |
| `fixlint` + `lint` in `ts-json-base`, `ts-extras`, `ts-extras-ollama` | exit 0, 0 warnings each |
| repo-wide `rebuild` | exit 0; error grep 0; `warning` (-i) 1, the symlink notice; 38 completed |
| repo-wide `test` | 36 of 37 ops passed. `@fgv/ts-res-cli` timed out at 5000 ms in `cli-configuration.test.ts` "building same input twice", a timing test that does not touch `JsonSchema` (1m18s, against 35s normally, while a sibling worker shared the machine). The re-run with `test --from @fgv/ts-res-cli` gave `SUCCESS: 9 operations`, error grep 0, `warning` 1 (symlink). Nothing was blocked behind the failure. |
| `change --verify`, `verify-capability-docs`, `generate-capability-feed --check` | pass, 0 failed, 0 stale |

## Review round 2

| finding | resolution |
|---|---|
| **P1** non-instance options were applied unchecked, so the validator and the wire disagreed | A factory now keeps only the **plain keys** of anything that is not its own validated instance: `description`, `title`, `nullable`, `strict`, `format`, `additionalProperties`, each kept only if it has its declared type. Documented on `PlainSchemaOptions` and in `CAPABILITIES.md`. One test per traced case (`NaN` minimum, `'5'` minimum, `multipleOf: 0`, function `default`) shows that the node is `{ type: 'number' }`, that it validates the value, and that `toJson()` → `fromJson` gives the same node. The index-signature and cast pins were re-pinned: constraints are now ignored, and only typed plain keys survive. |
| **P2** subclass forgery | Constructors take a module-private `unique symbol` token. An outside `super({ minimum: NaN })` is a compile error (pinned). At run time, an instance built without the token holds `{}`, so it applies nothing and nothing throws (pinned). |
| **P2** two installed copies | Instances carry a non-enumerable `Symbol.for('@fgv/ts-json-base.validated-options')` marker. A marked value, or any validated instance not built for this factory, has its `options` (read through the prototype getter) **re-validated** with the same converters and checks as `fromJson`. On success the re-validated options are used; on failure, plain keys only. Tested with hand-built marked objects (own property and prototype getter; number, string and schema options; pass and fail) and with a marked value that has no options. The marker is documented as a convenience, not a security boundary. |
| P3 `integer()` given `ValidatedNumberOptions` at run time | Re-validated as an integer range, and used if it holds an integer (both directions pinned). |
| P3 comment at `factories.ts:~656` | Replaced; the cast now cites the `isOwn` guard that justifies it. |
| P3 deep freeze | `checkAnnotations` deep-freezes its copies of `default` and `examples` (pinned). |

Refactor: the `fromJson` field converters moved to `constraints.ts`, so re-validation and `fromJson`
share them. `fromJson` wraps them with its printable-message formatting, so its messages are
unchanged.

### Gates, round 2

All logs were checked for NUL padding, and none was found.

| gate | result |
|---|---|
| `ts-json-base` build / fixlint / lint / test | exit 0; 0 warnings on the second build; coverage 100% (4/4) |
| repo-wide `rebuild` | exit 0; error grep 0; `warning` (-i) 1, the symlink notice; 38 completed |
| repo-wide `test` | exit 0; `SUCCESS: 37 operations`; error grep 0; `warning` (-i) 1, the symlink notice; no timing flake this run |
| `change --verify`, `verify-capability-docs`, `generate-capability-feed --check` | pass, 0 failed, 0 stale |
