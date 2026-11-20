# State: `json-schema-shapes`

Worker-owned. The brief is frozen; questions and deviations are recorded here.

## Progress

| step | commit | status |
| --- | --- | --- |
| 1. nodes, `fromJson`, shape rules in `adaptSchemaKeywords` (`ts-json-base`) | `3a797e5f2` | done |
| 2. per-wire tables, refusals, Ollama, MCP end to end, docs, change files | `ff36a020e` | done |
| 3. close-out (this directory, ledger, feed) | close-out commit | done |

## Deviations from the brief, with reasons

1. **A third enum factory, `booleanEnumOf`, and `fromJson` accepts a boolean `enum`.** Decision 2
   needs a single-value boolean enum for `const: true`. The cheapest correct node was the general
   enum node with a boolean value type, so `booleanEnumOf` is a public sibling of `numberEnumOf` and
   `integerEnumOf`. Since the node exists, `fromJson` accepts `{type: 'boolean', enum: [true]}` too:
   refusing a spelling the emitter produces would break the `toJson()` → `fromJson()` round trip,
   which is what the proxy path relies on.
2. **Sibling factories, not an `enumOf` overload.** `numberEnumOf` / `integerEnumOf` keep the static
   type the literal union (`1 | 2`) and let `integer` be chosen explicitly; an overload of `enumOf`
   could not tell `number` from `integer`.
3. **`adaptSchemaKeywords` now returns a `Result`.** The `untyped: 'refuse'` rule must fail with a
   path, so the transform cannot stay infallible. `adaptSchemaKeywords` has never shipped outside
   `integration/asks` (#734), so this is not a break of a published surface. The internal tool
   formatters (`toResponsesApiTools`, `toAnthropicTools`, `toGeminiTools`, not on the barrel) return
   a `Result` for the same reason; the completion paths, which take server tools only, use new
   infallible `serverToolsTo*` siblings, so no unreachable failure branch was added there.
4. **The shape rules are two new fields on the capability table, not keywords.**
   `ISchemaShapeCapabilities` (`nonStringEnum: 'pass' | 'fold'`, `untyped: 'pass' | 'refuse'`) is
   intersected into `SchemaKeywordCapabilities`, so every table must state both — a compile error
   otherwise, the same totality #682 relies on. A string `enum` is always passed, so a keyword-style
   `enum` rule would have been wrong for the common case.
5. **A numeric constraint beside a numeric `enum` (or `const`) is refused.** The enum node carries
   no constraint, so dropping `minimum` beside `enum: [0, 5]` would accept a member the schema
   rejects — the same reasoning #682 applied to lengths beside a string enum (F9). Beside a string
   enum, `minimum` constrains nothing under JSON Schema and is still ignored.
6. **`const` beside a union `type` is refused**, not normalized. `{type: ['string', 'null'], const:
   'a'}` accepts only `'a'`; carrying a nullability nothing can reach was judged worse than a clear
   refusal. pydantic's `Optional[Literal['a']]` spelling (`anyOf [{const: 'a'}, {type: 'null'}]`)
   is accepted.
7. **An untyped `additionalProperties` is exempt from `untyped: 'refuse'`.** `record(anyValue())`
   emits `additionalProperties: {}`, which says "any value" for the undeclared keys; Gemini and
   Ollama strip `additionalProperties`, and the strict wires refuse a record already. Refusing it
   would add no safety.
8. **`const` is routed before `enum`.** The first ordering let the enum arm drop a `const` sitting
   beside an `enum`; a test caught it, and `const` beside `enum` is now refused.

## Stop-and-report conditions

- *Gemini or OpenAI strict documents that they reject an `enum` on a number.* Gemini's Schema
  documents `enum` as "Possible values of the element of Type.STRING with enum format". The brief
  already anticipates exactly that (decision 4 folds a non-string enum on Gemini), so this was read
  as the expected case, not the stop condition. OpenAI strict documents no such restriction. Not
  triggered.
- *`any` cannot be added without breaking `SchemaNodeType` consumers outside `ts-json-base`.* No
  package outside `ts-json-base` reads `_type` or `SchemaNodeType` (swept with grep). Not triggered.
- *`const` enforcement breaks an in-repo consumer.* The repo-wide `rush test` passed with no fixture
  change for it. Not triggered.

## Open questions

- **A root schema with no `type` on Anthropic tools.** The Anthropic tools table passes an untyped
  node, including at the root (`parametersSchema: anyValue()`). Anthropic's examples always give
  `input_schema` a `type: 'object'` root, and a non-object root is likely refused there; that is a
  pre-existing gap for *any* non-object root (a `string()` root is not checked either), so it was
  left alone. MCP tool roots are objects by the protocol.
- **Gemini via `parametersJsonSchema`.** Gemini's `FunctionDeclaration` has a JSON-Schema field that
  could carry `{}`. Moving the Gemini tool path to it is a provider-path change beyond this stream;
  recorded in `docs/FUTURE.md`.
- **~~A Gemini request now fails where it used to skip one tool.~~** Resolved in review round 1:
  `adaptMcpTools` admits each tool against the target wire's table (`schemaKeywords`, default
  `JsonSchema.unverifiedWireSchemaKeywords`), so a `{}` tool is skipped unless the table carries it.
- **Layer-1 review.** The kickoff forbids sub-agents, so no independent `code-reviewer` ran; the
  gate-time review is the only independent one. Inline self-review applied: the unreachable branch
  in the member-type helper was removed by construction (a non-empty tuple), JSON Pointer tokens in
  refusal paths escape control characters, a dynamic `RegExp` in a test was replaced, and the
  completion paths got infallible server-tool formatters instead of an untestable failure branch.

## Review round 1

The coordinator's decisions on the gate-time deep review, applied on top of the `integration/asks`
merge `6b36067cf` (which includes #735). Detail in `result.md` § Review round 1.

- **P1:** `adaptMcpTools({ schemaKeywords })`, default conservative, admission-only; public
  `AiAssist.clientToolSchemaKeywords(descriptor, { model, endpoint })` to get the table. The
  `endToEnd` fixture `literal_any_tool` became `literal_tool` (adaptable) plus `any_tool` (skipped
  by default). The skip warning now reads `inputSchema cannot be adapted: <reason>`, since a skip is
  no longer only a subset miss; no test pinned the old wording.
- **P2:** inferences labelled in `result.md`; OpenAI-tools `untyped: refuse` commented as
  undocumented and conservative; duplicate members accepted as string `enumOf` accepts them, and
  `-0`, pinned; MCP end to end on the OpenAI wire; `docs/FUTURE.md` states the direct-vs-MCP
  trade-off.
- **P3:** `resolveStructuredOutput` adaptation is a `Result` chain; `_convertConst` uses a rest
  destructure.
- `samples/testbed` `mcp-probe` footer now says a skip may be a wire refusal (the package is private,
  so no change file).

### Gate counts (round 1)

Run from the repo root on the tree with #735 restored (see the note below), logs in
`../gate-logs-json-schema-shapes/`.

| gate | result |
| --- | --- |
| `install-run-rush.js rebuild` | exit 0; error grep 0; `warning` 1 (Rush's Git-tracked symlinks notice only); 38 completed |
| `install-run-rush.js test` | exit 0; error grep 0; `warning` 1 (the same notice); 37 completed (`SUCCESS: 37 operations`); log not NUL-padded (8282 = 8282 bytes) |
| per-package `rushx test` (`ts-json-base`, `ts-extras`, `ts-extras-mcp`) | 100% on all four metrics, no warnings |
| `rushx fixlint` then `rushx lint` (`ts-json-base`, `ts-extras`, `ts-extras-ollama`, `ts-extras-mcp`, testbed) | exit 0; 0 warnings, 0 errors; fixlint changed nothing |
| `change --verify --target-branch origin/integration/asks` | exit 0 |
| `verify-capability-docs.mjs` | 0 failed (router 22,778/24,000) |
| `generate-capability-feed.mjs --check` | 0 stale |

**Note: a process slip, fixed.** The local branch ref had been advanced to the `integration/asks`
merge `6b36067cf` without the worktree being updated, so the round-1 commit `d69ac6716`
(`git add -A`) staged the pre-merge content of #735's files and reverted them. `change --verify`
caught it (`@fgv/ts-agent-memory` had no change file). The next commit re-applies exactly the diff
from `6b36067cf` for those seven paths; afterwards the branch differs from `origin/integration/asks`
only in this stream's files, and the gates above ran on that tree.
