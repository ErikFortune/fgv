# Result: `json-schema-shapes`

Origin: PersonAIlity#683 (P3), the remainder after #682 — entry 6 in
`.ai/tasks/active/personality-asks-2026-10/followups.md`. Branch `json-schema-shapes`, cut from
`integration/asks` at `a00735ffe` (after #734). Commits: `3a797e5f2`, `ff36a020e`, and the
close-out commit.

## What shipped

- **Numeric and boolean enums** (`ts-json-base`).
  - New factories `numberEnumOf`, `integerEnumOf` and `booleanEnumOf`. Each emits
    `{ type: 'number' | 'integer' | 'boolean', enum: [...] }` (nullable: `type: [t, 'null']` and
    `null` in `enum`, as `enumOf` does). The validator accepts exactly the listed values, compared
    with `===`, and coerces nothing (`'1'` is not `1`). The static type is the literal union.
  - The factory throws on an empty list, a non-finite number, a non-integer member of an
    `integerEnumOf`, or a non-boolean member of a `booleanEnumOf`.
  - The node kind stays `'enum'`; the shared node now carries a `valueType`.
  - `fromJson` accepts an `enum` of strings, numbers or booleans, all of one type. A declared `type`
    must admit the members (`integer` needs every member to be an integer); with no `type`, a
    numeric enum is a `number` enum. Mixed members (`[1, 'a']`), a mismatched `type`, and a numeric
    constraint keyword beside a numeric enum are refused with the path named.
- **Scalar `const`** — `BREAKING:` in the change file.
  - `fromJson` maps a string, number or boolean `const` to the one-value enum of its type, which is
    enforced. Before this stream it was accepted and dropped, so a value it used to accept is now
    rejected.
  - `toJson()` emits `enum: [v]`, never `const`.
  - Refused: an object, array or `null` value; `const` beside `enum`; `const` beside a `type` that
    does not admit it (`type: 'integer', const: 1.5`); `const` beside a union `type`; a constraint
    keyword beside it.
- **`{}` / any.**
  - New node kind `'any'` (`SchemaNodeType` and `SCHEMA_NODE_TYPES`) and factory `anyValue(opts)`.
    Its validator is the existing `jsonValue` converter: any `JsonValue` (returned as a copy),
    `undefined` and non-JSON refused. `toJson()` emits `{}` plus annotations. Options are
    `IAnySchemaOptions` (annotations only; no `nullable`, since it already accepts `null`).
  - `fromJson` maps a schema with no `type`, no structural keyword and no `enum`/`const` — `{}`,
    `{description: …}`, `{title: …}` — to it. `additionalProperties: {}` still means an open object.
    `anyOf [{}, {type: 'null'}]` is any; `oneOf` of the same is refused (both branches admit `null`).
- **Shape rules in the #682 mechanism.**
  - `SchemaKeywordCapabilities` now also requires `ISchemaShapeCapabilities`:
    `nonStringEnum: 'pass' | 'fold'` and `untyped: 'pass' | 'refuse'`.
  - `adaptSchemaKeywords` returns a `Result`. A folded non-string enum becomes
    `Constraints: enum [1,2].` (first among the constraints), keeping the `type`. A refused untyped
    node fails with its JSON Pointer path, control characters escaped:
    `#/properties/payload: a schema with no 'type' (matching any value) cannot be sent on this wire`.
    An untyped `additionalProperties` is exempt (see `state.md` § Deviations 7).
  - `unverifiedWireSchemaKeywords` folds a non-string enum and refuses an untyped node.
- **Per-wire application** (`ts-extras` ai-assist, `ts-extras-ollama`).
  - Tool requests: the formatter fails before anything is sent, naming the tool, the path and the
    wire — `tool 'configure': #/properties/payload: … cannot be sent on this wire (Gemini)` — and the
    streaming adapter returns that `Failure`, which a client-tool turn yields as an `error` event.
  - Structured output: an untyped node is a capability mismatch under the existing `onUnsupported`
    (`'fail'` returns the message; `'degrade'` sends the request unconstrained), the OpenAI-strict
    precedent the brief names.
  - Ollama `chatStructured` folds a numeric enum and refuses an untyped node before calling the
    model.
- **MCP end to end** (`ts-extras-mcp/src/test/unit/shapes.test.ts`, a real in-memory server): a tool
  declaring `{type: 'integer', enum: [1, 2]}`, `{const: 'fast', type: 'string'}` and `{title:
  'Payload'}` is adapted; Anthropic is shown all three; an out-of-set level, a numeric string, and a
  wrong `const` are each refused as a correctable tool error before the server sees them; an
  in-set call is forwarded unchanged; and a Gemini request carrying the tool is refused naming the
  tool and the path, with no `fetch`.

## Per-wire table additions

All pages fetched 2026-10-17 with the `WebFetch` tool.

| wire | non-string `enum` | schema with no `type` |
| --- | --- | --- |
| Responses tools + OpenAI strict output (`openai`, `xai-grok`, own endpoint, not `ft:`) | **pass** [O][X] | **refuse** — not documented [O][X] |
| Anthropic tools (incl. forced-tool output) | **pass** [A1] | **pass** as `{}` [A1] |
| Anthropic JSON outputs | **pass** [A2] | **refuse** — not documented [A2] |
| Gemini (tools + `responseSchema`) | **fold**, `type` kept [G] | **refuse** — `type` is required [G] |
| Unverified (`unverifiedWireSchemaKeywords`: other OpenAI-format providers, `ft:` models, any endpoint override; Ollama) | fold | refuse |

Citations:

- **[G]** https://ai.google.dev/api/generate-content § Schema. `type`: "Required. Data type."
  `enum`: "Optional. Possible values of the element of Type.STRING with enum format." The `Type`
  enum is `TYPE_UNSPECIFIED` (which "should not be used"), `STRING`, `NUMBER`, `INTEGER`,
  `BOOLEAN`, `ARRAY`, `OBJECT`, `NULL` — no "any". `FunctionDeclaration.parametersJsonSchema`
  ("Describes the parameters to the function in JSON Schema format", mutually exclusive with
  `parameters`) exists but is not the field this adapter sends.
- **[O]** https://developers.openai.com/api/docs/guides/structured-outputs § "Supported schemas":
  supported types are String, Number, Boolean, Integer, Object, Array, **Enum** and anyOf; "A schema
  may have up to 1000 enum values across all enum properties", with a length limit stated only
  "For a single enum property with string values". No restriction of `enum` to strings. Nothing
  about a schema with no `type`; "the root level object of a schema must be an object". The
  numeric-enum pass rests on `Enum` being an unqualified supported type and the limits being
  phrased over enum values generally — weaker than an explicit "numbers supported", and the one
  entry here that is an inference rather than a quotation.
- **[X]** https://docs.x.ai/docs/guides/structured-outputs: `enum` and `const` are listed as
  supported; "Tool schemas follow the same JSON Schema support rules described on this page".
  Numeric enum values and typeless schemas are not addressed.
- **[A1]** https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools:
  `input_schema` is "A JSON Schema object". `{}` and a numeric `enum` are ordinary JSON Schema; the
  JSON-Schema limitations in [A2] apply only to "JSON outputs and strict tool use", and this adapter
  never sets `strict` on a tool. Same basis as #682's pass-everything table.
- **[A2]** https://platform.claude.com/docs/en/build-with-claude/structured-outputs § "JSON Schema
  limitations": supported "`enum` (strings, numbers, bools, or nulls only - no complex types)" and
  `const`; "If you use an unsupported feature, you'll receive a 400 error with details". A schema
  without a `type` is not addressed.

## Fixture sweep

**Touched (deliberate updates of the pins on the old refusals):**

- `ts-json-base` `fromJson.test.ts` › "rejects a missing or unknown type" became "maps {} to the any
  node, and rejects an unknown or a constraint-only missing type"; "rejects non-string and empty
  enums" became "rejects mixed, object-valued and empty enums" (`[1, 2]` and `[true]` are now
  accepted; the non-array message changed with the new member converter).
- `ts-json-base` `smallerShapes.test.ts` › "deferred shapes stay refused" became "pattern stays
  refused" (pattern and a mixed enum only); the numeric-enum and `{}` cases moved to a new
  "numeric enum, scalar const and {} (supported)" block that checks acceptance, rejection and the
  round trip.
- `ts-json-base` `keywordAdaptation.test.ts`: every `adaptSchemaKeywords` assertion now reads its
  `Result`; the pass-everything table states the two shape rules.
- `ts-extras` `schemaKeywords.test.ts`, `toolFormats.test.ts`: the formatters' and
  `adaptSchemaKeywords`' results are read through `.orThrow()`; no expected JSON changed.
- `ts-extras-mcp` `endToEnd.test.ts`: `literal_any_tool` (numeric enum, `const`, `{}`) added to
  `ADAPTABLE_TOOLS` and to the catalog and adapted-names assertions. `UNADAPTABLE_TOOLS` is
  unchanged: `pattern_tool` remains the refused-keyword example, with `ref_tool`, `oneof_tool`,
  `anyof_tool` and `union_tool`.

**Added:** `ts-json-base` `shapes.test.ts`; `ts-extras` `schemaShapes.test.ts` (verbatim per-wire
JSON for tools and structured output, refusals, and the three streaming adapters refusing before
`fetch`); `ts-extras-mcp` `shapes.test.ts`; two tests in `ts-extras-ollama` `chatStructured.test.ts`.

**Swept, no change needed:**

- `samples/testbed` `mcpProbe`: its skip fixtures (`mcpProbe.test.ts`) are `$ref`, `oneOf`, `anyOf`,
  `pattern` and union-type reasons — none of the newly accepted shapes — and the report text
  ("Each skipped tool names a JSON Schema feature `JsonSchema.fromJson` does not yet support")
  stays true. No testbed file mentions numeric enums, `const` or `{}`.
- `ts-extras-mcp` `mcp.test.ts`: its refusals are `pattern`.
- No package outside `ts-json-base` reads `_type` or `SchemaNodeType`.
- The repo-wide `rush test` passed: no other consumer pinned a refused shape or relied on `const`
  being dropped.

## Gate counts

Run from the repo root, logs in `../gate-logs-json-schema-shapes/` (outside the tree).

| gate | result |
| --- | --- |
| `install-run-rush.js rebuild` (on `ff36a020e`) | exit 0; `not met\|FAILURE\|Operations failed\|error TS` = 0; `warning` (case-insensitive) = 1, Rush's "Git-tracked symlinks" notice only; 38 projects completed |
| `install-run-rush.js test` (on `ff36a020e`) | exit 0; error grep = 0; `warning` = 1 (the same notice); 37 completed (`SUCCESS: 37 operations`); log not NUL-padded (8286 = 8286 bytes) |
| per-package `rushx test` (`ts-json-base`, `ts-extras`, `ts-extras-ollama`, `ts-extras-mcp`) | 100% statements, branches, functions and lines; no warnings |
| `rushx fixlint` then `rushx lint` in the same four | exit 0; fixlint changed nothing; lint warning and error counts 0 |
| `change --verify --target-branch origin/integration/asks` | exit 0; four change files found |
| `verify-capability-docs.mjs` | exit 0; 0 failed; router at 22,778/24,000 characters (after the feed regeneration) |
| `generate-capability-feed.mjs --check` (after regenerating) | exit 0 |

## What the brief got wrong or left open

- **Decision 2 implied a boolean node only for `const`.** The node exists, so a boolean `enum`
  through `fromJson` comes with it (otherwise `toJson()` would emit what `fromJson` refuses).
- **Decision 4's "fails the request loudly" needed a `Result` through the formatters and
  `adaptSchemaKeywords`**, which the brief did not mention. Both were internal or unshipped, so the
  change is contained; it is called out in the change files.
- **The stop condition on "Gemini documents that it rejects an `enum` on a number"** is met
  literally by the page decision 4 already plans around. Read as anticipated, not as a stop.
- **Gemini has `parametersJsonSchema`**, which might carry `{}`; the brief's "unless their
  JSON-Schema parameter form accepts it" pointed at it. Adopting it would move the whole Gemini tool
  path off the OpenAPI subset and is left in `docs/FUTURE.md`.
- **Consequence worth stating:** a tool that used to be skipped on every provider is now adapted,
  and on Gemini (and any refusing wire) every request carrying it fails loudly instead. That is the
  brief's decision; it is visible to a host only as a request failure, not on the approval screen.
- **`samples/testbed` `mcpProbe` comments** were listed as a known pin; none mentions these shapes.
