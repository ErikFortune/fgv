# Result — `json-schema-fromjson-widening`

**Shipped:** `JsonSchema.fromJson` now accepts pydantic's `Optional[T]` spelling (`anyOf`/`oneOf`
`[T, {type:'null'}]`), local `$ref`/`$defs`, and schema-valued `additionalProperties` (as the new
`JsonSchema.record`), each enforced by the converter and stated by `toJson()`. Numeric enums,
`pattern` and `{}` stay refused, each for a recorded reason.

Origin: ErikFortune/personaility#680, #681, #683. Commits on `json-schema-fromjson-widening`:

- `b061f5b8`: #680, nullable `anyOf`/`oneOf`;
- `6012ce5c`: #681, local `$ref` inlining;
- `bfa5b645`: #683, `record` and schema-valued `additionalProperties`;
- `47320a83`: the `code-reviewer` findings, plus `CAPABILITIES.md` and `docs/FUTURE.md`;
- plus the finalize commits.

Production source changes are confined to `@fgv/ts-json-base`, packlet `json-schema-builder`. In the
gate-review round, two other packages received test-only updates:

- `ts-extras-mcp` `endToEnd.test.ts`;
- `samples/testbed` `mcpProbe.test.ts`.

`ts-extras-mcp`'s `CAPABILITIES.md` was also updated (docs only, change file `none`).

## What shipped, per entry

### #680: `anyOf` / `oneOf` `[T, null]`: supported

- An `anyOf` or `oneOf` of exactly two members is accepted when one member is `{ type: 'null' }`
  (annotations allowed) and the other is any supported schema, in either order.
- It is normalized to the existing nullable form. The `toJson()` output is `type: [<t>, 'null']`,
  and for an enum, `null` is added to `enum` as well.
- The wrapper may carry annotations only (`description`, `title`, `default`, `examples`,
  `$comment`, `deprecated`, `readOnly`, `writeOnly`, `$schema`, `$defs`, `definitions`). A wrapper
  `description` replaces the branch's.
- Refused, each naming the keyword and its JSON Pointer path:
  - a general union;
  - one or three or more members;
  - two `null` branches;
  - a non-array value;
  - a `null` branch carrying a validation keyword;
  - a validation keyword beside the union;
  - `anyOf` and `oneOf` on the same node;
  - `oneOf` over a branch that already admits `null`.

### #681: local `$ref` / `$defs`: supported, by inlining

- Any local JSON Pointer reference resolves against the document: `#`, `#/$defs/…`,
  `#/definitions/…`, `#/properties/…`, and paths into arrays.
- Pointer tokens are percent-decoded first, then `~1` → `/`, then `~0` → `~` (RFC 6901 § 6).
- Pointers resolve own keys only, so `#/$defs/constructor` does not reach `Object.prototype`.
- A `$ref` sibling `description` replaces the target's, which is how pydantic attaches a field
  description to a model reference. Other annotations are ignored. A root `$id` may sit beside a
  root `$ref`.
- Refused, each naming `'$ref'` and the path:
  - remote references;
  - anchors (`#foo`);
  - malformed escapes;
  - unresolvable pointers;
  - non-string references;
  - a validation keyword beside `$ref`;
  - recursive schemas, both self-recursion and mutual recursion;
  - a reference under, or a pointer passing through, a subschema with its own `$id`.
- Bounds against hostile input:
  - 32 nested references;
  - 1000 total expansions;
  - 100000 schema nodes per conversion, which also counts the re-conversions that normalization
    performs;
  - 128 levels of nesting from the root, counting `items`, `properties`, `additionalProperties`,
    union branches and `$ref` expansions alike (added at gate review: a 2000-deep `items` chain
    otherwise exhausted the stack, which the node budget does not prevent);
  - the root of `jsonSchemaConverter` is wrapped in `captureResult`, as a backstop that turns any
    throw (for instance, from an accessor on a caller-supplied object) into a failure.
- Reference strings echoed in errors are cut to 120 characters.
- Previously silently ignored and now refused: `$dynamicRef` and `$recursiveRef`.

### #683: per sub-shape

| sub-shape | decision | why |
|---|---|---|
| record (`additionalProperties: <schema>`) | **support** | New `JsonSchema.record(values, opts?)`, typed `Record<string, Static<values>>` with a nullable overload. `fromJson` reads a schema-valued `additionalProperties` as a record when no properties are declared. Every value converts through the schema and every failure is reported by key. Non-objects are refused and `__proto__` is dropped, both as for open objects. The wire is `{ type: 'object', properties: {}, additionalProperties: <values> }`. `additionalProperties: {}`, or annotations only, now means the same as `true`. |
| numeric `enum` | **refuse with a better message; defer** | Gemini's function-declaration schema allows `enum` only on strings. An accepted MCP tool with a numeric enum would fail every Gemini request that carries it, where today it is only skipped. Fixing that needs a `toGeminiParameterSchema` decision in `ts-extras`, which the brief makes a stop condition. The message used to be `Field enum: Not a string: 1` and is now `numeric 'enum' values are not supported`. |
| `pattern` | **defer** (existing refusal kept) | Enforcing the regex is what faithful means here, and the regex is untrusted input from the MCP server, run by a backtracking engine against model-written strings. Nested or overlapping quantifiers are exponential. Adjacent overlapping ones are polynomial, and a syntactic safe-subset check does not close that class. Provider regex dialects also differ. |
| `{}` (no `type`) | **refuse with a better message; defer** | It could be represented as an "any `JsonValue`" node, but the wire would have no `type`, which Gemini function declarations and OpenAI strict mode refuse. That is the same provider-path decision as numeric enum. The message used to be `unsupported or missing 'type'` and is now `a schema with no 'type' (matching any value) is not supported`. |

Also refused, and recorded in `docs/FUTURE.md`: declared `properties` together with a
schema-valued `additionalProperties` (zod `.catchall()`). The converter would be easy; the builder
has no typing for it that avoids collapsing to `never`. Also refused beside a record: every object keyword that constrains the record's key set, which the
record converter would otherwise ignore. That covers `patternProperties`, `propertyNames`,
`unevaluatedProperties`, `dependentRequired`, `dependentSchemas`, draft-07 `dependencies`,
`minProperties` and `maxProperties`. A record that ignored any of them would be looser than its
source. The open-object form of the same looseness (these keywords beside an *open* object) stays
in the `docs/TECH_DEBT.md` P3 entry, under #682.

## Verdicts on the brief's beliefs

1. **`FORBIDDEN_KEYWORDS` (`fromJson.ts:34-44`) refuses `$ref`, `oneOf`, `anyOf`, `allOf`, `not`,
   `if`/`then`/`else` and `pattern`: correct, but incomplete as a description of what is refused.**
   - The list matched exactly.
   - `$dynamicRef` and `$recursiveRef` were in neither the list nor any handler. They were silently
     ignored, which loosened the converter whenever a node also had a `type`. They are now refused.
   - The header comment claims that dropping a keyword is never allowed to produce a looser
     converter. That does not hold for constraint keywords: `const`, `minimum`, `maximum`,
     `minLength`, `maxLength`, `multipleOf`, `minItems`, `uniqueItems` and `min`/`maxProperties` are
     all accepted and neither enforced nor emitted. This is pre-existing and out of scope here
     (it belongs to #682). It is now stated in `CAPABILITIES.md` and `docs/FUTURE.md`.
2. **Nullability exists only as `type: [T, 'null']` via `_splitNullableType`, plus the nullable
   enum: correct.**
   - `oneOf` and `anyOf` coincide when `T` rejects `null`, as believed.
   - They diverge when `T` admits `null`: `null` then matches both branches and `oneOf` rejects it.
     That case is refused rather than mis-normalized.
3. **Most of #683 is a builder extension: correct, all four gaps are real.**
   - Only record was built, as a new sibling factory, so the change is additive (see
     `etc/ts-json-base.api.md`: `+record`).
   - The other three are deferred, so no builder change was needed for them.
4. **Record has a seam already: correct.**
   - The undeclared-key converter now takes the value converter (`jsonValue` for an open object,
     the value schema for a record), exactly where the #720 docstring said it would.
   - The refusal at `fromJson.ts:371-373` is replaced by the record path.
5. **Check the wire constraints before emitting: the concern was right, the citation was not.**
   - `structuredOutput.ts:151` is a comment in `jsonObjectWire` explaining why no schema-less
     stand-in exists for Anthropic. Nothing in `ts-extras` checks `additionalProperties`.
   - The paths I checked:
     - OpenAI Chat and Responses tools and Anthropic tools send the raw `toJson()` with no strict
       flag.
     - Gemini tools and the Gemini response schema go through `toGeminiParameterSchema`, which
       strips `additionalProperties` and `$schema` and translates the nullable union.
     - OpenAI strict, Anthropic `output_config.format` and Anthropic forced-tool structured output
       send the raw `toJson()`.
     - The proxy path (`completionClient.ts:1162-1167`) sends `toJson()`, and the server rebuilds
       it with `fromJson`. So every emitted shape must re-parse, and every new shape has a
       round-trip test.
     - Ollama's `sanitizeFormatSchema` strips `additionalProperties`.

## Design calls, with what was rejected

- **#680: normalize through the wire form.**
  - `_reshape` re-emits the parsed branch with `null` added and parses it again. That is the one
    representation every node shares, and it is the form the nullable reader already handles.
  - Rejected:
    - a per-node "make nullable" method on the builder, which would add internal surface on every
      class for one caller;
    - rewriting the raw branch JSON, which would have to replicate the enum arm's two-place
      nullability rules.
- **#681: inline, and do not preserve `$defs` in `toJson()`.**
  - Inlining puts no new keyword on any wire.
  - Preserving `$defs` would need a reference node in the builder. It would also send `$defs` to
    Gemini's OpenAPI subset and to Ollama's grammar converter, neither of which I could show
    accepts it.
  - **A recursive schema is refused**, because it has no finite inline form. Supporting it would
    need the reference node above.
  - Rejected: an expansion-count bound alone. The review showed that a wide definition referenced
    1000 times builds about 10M nodes, which is why the node budget exists.
  - Rejected: interpreting siblings of `$ref` (draft-07 ignores them, 2019-09 and later apply
    them). Validation siblings are refused instead.
- **#683:** see the table. For record, rejected:
  - widening `IObjectSchemaOptions.additionalProperties` to accept a schema. The static type of
    declared properties plus a value schema would be `never` whenever the two disagree, or else
    loosened to `JsonValue`.
  - a new `SchemaNodeType` member. That would widen an exported union that consumers may switch
    over. A record is an `object` node.

## Wire behaviour per new shape

| shape | `toJson()` emits | OpenAI / Anthropic tools | Gemini (after its sanitizer) | strict structured output |
|---|---|---|---|---|
| `anyOf`/`oneOf` `[T, null]` | `type: [t, 'null']` (+ `null` in `enum`) | unchanged from today's nullable | already translated to `nullable: true` | unchanged from today's nullable |
| local `$ref` | the inlined target; no `$ref` or `$defs` | only existing shapes | only existing shapes | only existing shapes |
| record | `{type:'object', properties:{}, additionalProperties:<schema>}` | accepted as arbitrary JSON Schema (non-strict) | `{type:'object', properties:{}}`: Gemini (and Ollama) strip `additionalProperties`, so the provider sees an unconstrained object. **Accepted, not deferred, and the distinction from numeric enum / `{}` is what happens to the request.** There, the provider rejects the request, so the whole turn fails. Here, the request succeeds and the model is only less guided. `executeClientToolTurn` still validates the arguments against the full record schema at call time, so a wrong value comes back to the model as a tool error it can correct, and never reaches the tool. (Separately, and unverified: `docs/TECH_DEBT.md` P3 records that Gemini has historically refused an `OBJECT` with empty `properties`. That applies equally to the open objects `fromJson` accepted before this stream, and is not specific to records.) | refused by providers, exactly like an open object (pre-existing, not refused locally) |

The Gemini facts above (string-only `enum`, `type` required) come from the documented Gemini
`Schema` object. They were **not probed live**, and they are the reason for two deferrals.

## Revert matrix

Each protection was reverted alone in the source, the `json-schema-builder` tests were run, and the
file was restored. Measured on a clean tree: R1–R23 on `47320a83`, all 28 again on the
gate-review changes, all 30 again on the Copilot round 1 changes, and all 32 again on the Copilot round 2 changes. Every count was the same in both runs, except R10, which also reddens the new
truncation test. Several mutants (`if (false)`) also
trip TS7027 (unreachable code), a warning; the tests still ran on the emitted code.

| # | protection reverted | red | named tests |
|---|---|---|---|
| R1 | `oneOf` over a null-admitting branch refused | 1 | refuses oneOf over a schema that already admits null |
| R2 | validation keyword beside the union refused | 1 | refuses a validation keyword beside the union |
| R3 | `null` branch must be annotation-only | 1 | refuses a null branch carrying a validation keyword |
| R4 | `_reshape` adds `null` to `type` | 14 | every normalization test, both verbatim pydantic tests, the pydantic nested-model test, two record tests |
| R5 | `_reshape` adds `null` to `enum` | 1 | a nullable enum normalizes to the type-union form |
| R6 | `$ref` cycle detection | 3 | recursive pydantic model; mutual recursion; reference to the whole document |
| R7 | nesting limit (32) | 1 | a chain deeper than the nesting limit |
| R8 | expansion limit (1000) | 1 | an exponential expansion |
| R9 | node budget (100000) | 1 | a wide definition inlined many times |
| R10 | remote-ref refusal | 3 | a remote reference; a relative remote reference; a very long reference |
| R11 | `$ref` under a nested `$id` | 1 | a reference under a nested $id |
| R12 | pointer passing through a nested `$id` | 1 | a pointer passing through a subschema with its own $id |
| R13 | own-key pointer resolution | 1 | a pointer naming an inherited property |
| R14 | validation keyword beside `$ref` refused | 1 | a validation keyword beside $ref |
| R15 | `__proto__` property refused | 1 | rejects a property named __proto__ rather than losing its schema |
| R16 | record key-set keywords refused (the whole check) | 8 | one parameterized row per keyword (3 at first; 8 since Copilot round 2) |
| R17 | record + declared properties refused | 1 | refuses declared properties beside a value schema |
| R18 | record converts values through its schema | 7 | z.record verbatim; nullable record; record values; factory convert; per-key errors; openObject "is a record, not an open object"; a plain record still adapts (since round 2) |
| R19 | record wire states its value schema | 5 | z.record verbatim; nullable record; record values; factory emits; a plain record still adapts (since round 2) |
| R20 | `{}` `additionalProperties` reads as `true` | 2 | empty / annotation-only additionalProperties means true |
| R21 | numeric-enum message | 4 | zod number enum; pydantic Literal[1, 2]; mixed enum; fromJson "rejects non-string and empty enums" |
| R22 | `{}` message | 3 | pydantic Any (spike); Any with title; fromJson "rejects a missing or unknown type" |
| R23 | `$dynamicRef` forbidden | 1 | refuses $dynamicRef |
| R24 | depth bound (128) | 3 | one level past the limit; the 20000-deep chain; nesting through `$ref` |
| R25 | `captureResult` backstop at the root | 1 | an accessor that throws becomes a failure, not an exception |
| R26 | percent-decode the fragment before splitting | 2 | `%2F` decoded before splitting (RFC 6901 § 6); a malformed escape (with the mutant, the decode throws outside the per-reference `captureResult`, and the backstop's message no longer matches) |
| R27 | `~1` unescaped before `~0` | 1 | `~01` names the literal key `~1` |
| R28 | echoed reference truncated | 2 | a very long reference, echoed truncated; a long local reference to an invalid target (since round 2) |
| R29 | invalid `~` escape refused | 2 | an invalid '~' escape (`a~2b`); a trailing '~' (`a~`) |
| R30 | property key escaped as a pointer token in error paths | 1 | escapes a property key as a JSON Pointer token in the reported path |
| R31 | the five key-set keywords added in round 2 (`dependentRequired`, `dependentSchemas`, `dependencies`, `minProperties`, `maxProperties`) | 5 | their five parameterized rows |
| R32 | `$ref` error path truncated (`path: _echo(target)`) | 1 | a long local reference to an invalid target, echoed truncated in the nested path |

## Tests changed

**In other packages** (added at gate review, kept minimal because `mcp-client-cancellation` touches
the same files):

- `ts-extras-mcp` `endToEnd.test.ts`: the header comment now describes what is refused, and a new
  adaptable fixture `pydantic_tool` (a local `$ref` plus an `anyOf [T, null]` field) is added to the
  catalog and the adapted list.
- `samples/testbed` `mcpProbe.test.ts`: the mocked skip reasons are refreshed to the strings
  `fromJson` produces now, and the mocked `union_tool` schema is changed from `['string','null']`,
  which has been adaptable since nullable support, to `['string','number']`.

Before gate review, no test outside `ts-json-base` needed to change. `ts-extras-mcp`'s boundary
fixtures still hold, because each one still refuses:

- `ref_tool` uses `#/$defs/Foo` with no `$defs` (unresolvable);
- `oneof_tool` and `anyof_tool` are string|number unions;
- `pattern_tool` uses `pattern`.

**In `ts-json-base`**, these pre-existing tests pinned the old boundary and were updated:

- `fromJson.test.ts` "rejects a missing or unknown type": `{}` now has its own message.
- `fromJson.test.ts` "rejects non-string and empty enums": `[1, 2]` now has the numeric message;
  `[true]` keeps "not a string".
- `fromJson.test.ts` "rejects malformed object metadata": schema-valued `additionalProperties` is
  now accepted. The assertion now covers a non-boolean, non-object value.
- `openObject.test.ts` "schema-valued additionalProperties is still refused" became "… is a record,
  not an open object".

New tests in `fromJson.test.ts`: the converter context path, a non-string object description, and the `__proto__` property refusal. New test files: `nullableUnion.test.ts`, `refDefs.test.ts`, `smallerShapes.test.ts`. The requester's
spike shapes are included verbatim.

## `code-reviewer` (layer 1), on `bfa5b645`, before coverage closure

The run was read-only. Applied in `47320a83`:

- **P1, record loosening via `patternProperties` / `propertyNames` / `unevaluatedProperties`:**
  fixed by refusing them on the record path (R16). The same keywords beside an *open* object are a
  pre-existing gap, left alone.
- **P1, amplification:** the expansion bound did not limit nodes. Fixed with a 100000-node budget
  shared across the conversion, including `_reshape` (R9).
- **P1, stale `CAPABILITIES.md`:** updated. I had already drafted the fix; it landed in the same
  commit.
- **P2, pointer through a nested `$id`:** refused (R12).
- **P2, comment drift from the context refactor:** fixed.
- **P2, a `c8 ignore` on a reachable branch with a false comment:** removed, and a test added.
- **P2, `__proto__` property silently losing its schema** (pre-existing, newly reachable): refused
  (R15).
- **P3, annotation-only `additionalProperties`:** now reads as `true` (R20).
- **P3, root `$id` beside root `$ref`:** allowed, with a test.
- **P3, record TSDoc on `__proto__`, and a comment on the factory cast:** applied.
- **P3, constraint keywords silently ignored:** documented. Fixing it is #682.
- **Advisory, not applied:** collapsing the three pre-existing stacked extractions in
  `_parseObjectBody` into one chain. That code predates this stream, and the touched part was
  chained.

## Copilot round 1 (PR #723), applied

Five threads, verified against `f2a96f57`:

1. **Malformed `~` escapes.** `_pointerTokens` now refuses any token with a `~` not followed by `0`
   or `1`, or a `~` at the end, with `malformed reference: invalid '~' escape`. It does this after
   percent-decoding and splitting and before unescaping. Tests cover `a~2b` and `a~`; `~01` still
   decodes to `~1`. Revert row R29.
2. **Type-safe node guard.** `_convertNode` now checks the node with `_plainObjectField.convert(from)`,
   keeping the `expected a JSON Schema object` message, and chains into `_convertSchemaObject`. The
   enum arm takes the converted `Record<string, unknown>` instead of casting `unknown` at its two
   former sites. One `as Record<string, unknown>` remains, inside `_plainObjectField` itself, and it
   is safe: that converter is where the narrowing is established, directly after its
   `typeof === 'object' && !Array.isArray && !== null` guard. Every other reader receives its
   output.
3. **Property paths.** A property key is escaped as a JSON Pointer token in child paths: `~` → `~0`
   first, then `/` → `~1`, using the helper that builds the `$ref` cycle key. So a failing property
   named `a/b` is reported at `#/properties/a~1b`. Revert row R30.
4. **README row count:** corrected to 30 rows.
5. **Scope statement:** the opening of this file and the "formerly stale" paragraph now say that
   production source changes are confined to `ts-json-base`, and that the two other packages
   received test-only updates in the gate-review round.

## Copilot round 2 (PR #723), applied

Two threads, verified against `c4494de1` (the branch with `integration/asks`, including #722, merged in):

1. **Record key-set keywords.** `RECORD_KEY_KEYWORDS` now also holds `dependentRequired`,
   `dependentSchemas`, `dependencies` (draft-07), `minProperties` and `maxProperties`. Each is refused
   with the existing "unsupported JSON Schema keyword '…' beside a schema-valued
   'additionalProperties'" message. There is one parameterized test per keyword (8 in all), and a test
   confirms a plain record still adapts. Revert row R31. The open-object form of this looseness stays
   in the TECH_DEBT entry, under #682.
2. **`$ref` diagnostic path.** The full target stays in `refs` for cycle identity. The resolved node's
   error path is now `_echo(target)`, so a long local reference is cut to 120 characters there too,
   not only where the reference itself is quoted. A test uses a 200-character local `$ref` to an
   invalid target and checks that the message holds the truncated form and never the full name.
   Revert row R32.

## Known exceptions and over-refusals

Recorded so they are not rediscovered as surprises:

- **A record drops an own `"__proto__"` key without validating it**, inherited from #720's
  open-object rule. So `record(number)` accepts `{"__proto__": "x"}`, which the source schema
  rejects, and the tool receives the arguments minus that key. Nothing invalid reaches the output.
  It is still an exception to "a value the source rejects is rejected".
- **Some refusals name the path but no keyword:**
  - the node budget: "the schema exceeds the limit of 100000 nodes";
  - the `__proto__` property refusal;
  - `{}`: "a schema with no 'type'";
  - a `null` branch carrying a validation keyword, which names `anyOf` at the wrapper's path rather
    than the offending keyword in the branch.
- **Over-refusals, all safe:**
  - `_resolvePointer` refuses a pointer that passes through any map with a key named `$id`, including
    a `$defs` entry or a property named `$id`, not only a schema `$id`;
  - a root `$id` beside a nullable `anyOf` wrapper is refused, while a root `$id` beside `$ref` is
    allowed.
- **Not detected:**
  - draft-04 `id` rebasing; refs under a draft-04 nested `id` resolve against the document root;
  - (fixed at gate review) nesting depth is now bounded at 128 levels, `$ref` expansions included.
- **Validating keywords that `fromJson` ignores,** which make the converter looser than its schema
  (constraint keywords, object-key keywords beside an *open* object, and array keywords such as
  `prefixItems`): pre-existing, now listed in `docs/TECH_DEBT.md` (P3). The comments on
  `FORBIDDEN_KEYWORDS` and on `fromJson` that claimed otherwise are softened.
- **Formerly stale, refreshed at gate review:**
  - `ts-extras-mcp` `endToEnd.test.ts`'s header comment. Its `ref_tool` fixture is refused only
    because `#/$defs/Foo` does not resolve, and the comment now says so.
  - `samples/testbed` `mcpProbe.test.ts`'s mocked reason strings.

  Both received test-only updates in the gate-review round (see *Tests changed*). The edits were
  kept minimal because the concurrent `mcp-client-cancellation` stream touches the same
  `ts-extras-mcp` test file. No production source outside `ts-json-base` changed.
  `ts-extras-mcp`'s `CAPABILITIES.md` was updated as well (docs only, change file `none`).

## Gates

- **After Copilot round 1, repo-wide `node common/scripts/install-run-rush.js test` on `2967fed4`, from
  the repo root:** `SUCCESS: 36 operations`, `exit 0`, 11m23s.
  - 0 error lines.
  - 36 projects completed, none from cache.
  - No NUL padding.
  - The only `warning` line is the Git-tracked-symlink notice.
  - `ts-json-base`: 1308 passed, coverage 100%, 0 warnings in build, lint and test.
  - `change --verify` passes.

- **After gate review, repo-wide `node common/scripts/install-run-rush.js test` on `2ef7dd99`, from the
  repo root:** `SUCCESS: 36 operations`, `exit 0`, 9m18s.
  - 0 error lines.
  - 36 projects completed, none from cache, including `ts-json-base`, `ts-extras-mcp` and `testbed`.
  - The log has no NUL padding.
  - The only `warning` line is the Git-tracked-symlink notice.
- **Same round, per package:** `ts-json-base` (1305 passed, coverage 100%) and `ts-extras-mcp`
  (52 passed) each had a clean build, lint and test with 0 warnings. `change --verify` passes. The
  capability-docs check reports 0 failures.

Before gate review:

- **Repo-wide `node common/scripts/install-run-rush.js test`, run on the code at `47320a83` from the
  repo root:** `SUCCESS: 36 operations`, `exit 0`.
  - 0 error lines (`not met|FAILURE|Operations failed|Error:|error TS`).
  - 36 projects completed, none from cache.
  - The log has no NUL padding (8050 bytes either way).
  - The only case-insensitive `warning` line is Rush's existing "1 Git-tracked symlinks" notice,
    the same as #720's baseline.
  - `integration/asks` has not advanced since the branch point, so this is the combined tree.
- **`ts-json-base`, after the comment-only softening in the finalize commit:**
  - `heft build --clean`: 0 warnings, 0 errors.
  - `eslint src`: 0.
  - `heft test --clean`: **1297 passed, 0 failed, coverage 100/100/100/100, 0 warnings.**
  - `etc/ts-json-base.api.md`: additive only (`+record`).
  - The build-time lint caught one `no-unsafe-regexp` warning in a test during the review fixes, and
    I fixed it before committing.
- **`rush test --to @fgv/ts-extras-mcp`** (after `bfa5b645`): 6 operations, green.
- **`rushx fixlint`:** `eslint --fix` was run after each entry. Prettier ran on every touched file,
  and the pre-commit `rush prettier` passed on every commit.
- **`change --verify --target-branch origin/integration/asks`:** passes. It finds three
  `ts-json-base` change files (`minor`) and one `ts-extras-mcp` change file (`none`, docs only).
- **`verify-capability-docs.mjs`:** 0 failed. `generate-capability-feed.mjs` was re-run and added
  the headline without a PR link. Re-run it once the PR number is in `meta.yaml`.

## What the brief got wrong

- **Belief 5's citation:** `structuredOutput.ts:151` is a comment, not a check. Nothing downstream
  inspects `additionalProperties`.
- **Belief 1's completeness:** `$dynamicRef`/`$recursiveRef` and the constraint keywords were
  silently ignored, so the subset was already looser than its header claimed.
- **Implicit framing:** "faithful" turned out to be a provider question for two of the four #683
  shapes (numeric enum, `{}`), not just a converter question.
