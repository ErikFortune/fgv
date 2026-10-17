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
- **A Gemini request now fails where it used to skip one tool.** A server with one `{}` parameter
  used to lose that tool at adaptation (visible on the approval screen); now the tool is adapted and
  every Gemini request carrying it fails loudly. That is decision 4 as written. A host that wants the
  old behaviour on Gemini would need a per-provider filter at tool-selection time, which nothing
  offers today.
- **Layer-1 review.** The kickoff forbids sub-agents, so no independent `code-reviewer` ran; the
  gate-time review is the only independent one. Inline self-review applied: the unreachable branch
  in the member-type helper was removed by construction (a non-empty tuple), JSON Pointer tokens in
  refusal paths escape control characters, a dynamic `RegExp` in a test was replaced, and the
  completion paths got infallible server-tool formatters instead of an untestable failure branch.
