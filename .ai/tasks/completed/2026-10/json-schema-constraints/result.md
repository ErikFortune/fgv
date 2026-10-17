# Result: `json-schema-constraints`

Origin: PersonAIlity#682 (P2). It also closes the constraint class of the `docs/TECH_DEBT.md` P3
"`fromJson` silently ignores validating keywords". Branch `json-schema-constraints`, cut from
`release` at `575ba2ad`. Commits: `043f56acb`, `a204da3f6`, `60d96f869`, `a21d378f9`, and the
close-out commit.

## What shipped

- **The node carries the keywords** (`ts-json-base`).
  - `number`/`integer` take `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` (numeric
    form) and `multipleOf`.
  - `string` takes `minLength`, `maxLength` (counted in code points) and `format`.
  - Every factory takes `title`, `default` and `examples`. These are typed options, with no
    passthrough bag.
- **Validating keywords are enforced.** The failure names the keyword and the bound, for example
  `expected a value >= 1 (minimum), got 0`. That is the text a model reads on the tool path.
  `multipleOf` uses a relative tolerance of 1e-9 on the quotient. A nullable node accepts `null`
  unconstrained.
- **Annotations are emitted, never enforced.** `format` values are not checked. `default` and
  `examples` must be JSON values but are not checked against the node.
- **Incoherent options are refused.** The checks, in the internal `constraints.ts`, are shared by
  both paths: a factory throws at construction (`JsonSchema.number: minimum 5 is greater than
  maximum 1`), and `fromJson` returns a `Failure` naming the path. The conditions are:
  - a non-finite bound;
  - `minimum > maximum`;
  - exclusive bounds that leave no number in range (for `integer`, no integer);
  - `multipleOf <= 0`;
  - a length that is not a non-negative integer;
  - `minLength > maxLength`.

  `fromJson` also refuses mistyped values, such as `minimum: "5"`, `format: 5` or a non-array
  `examples`.
- **`toJson()` stays provider-neutral.** It emits every carried keyword in a fixed order, and each
  one round-trips through `fromJson`. `title`, `default` and `examples` beside a `$ref` or a
  nullable `anyOf`/`oneOf` replace the inner node's, as `description` already did.
- **`JsonSchema.adaptSchemaKeywords(json, capabilities)`** (`ts-json-base`) is the one shared
  transform. Each keyword is passed, translated, or folded. Alongside it:
  - `SchemaKeywordCapabilities` is a total `Record`, so a new keyword is a compile error in every
    table;
  - `foldAllSchemaKeywords` is the table that folds everything;
  - `foldedConstraintsSentence` builds the fold sentence;
  - `schemaConstraintKeywords` gives the fold order.
- **Per-format tables** are in `ts-extras` `ai-assist/schemaKeywords.ts`, applied on every path:
  - Responses tools, both completion and streaming;
  - Anthropic tools;
  - Gemini tools;
  - every structured-output format, adapted before the optional-property hoist and guard;
  - Ollama `chatStructured` (`ts-extras-ollama`), which folds everything.

  The proxy path is unchanged. It sends neutral `toJson()`, and the server's `fromJson` rebuilds
  the constraints and adapts them.

## Belief verdicts

1. **True.** `SchemaValidatorBase` stored `_type`, `description` and `nullable` (`factories.ts`),
   and the options were as listed.
2. **True.** The scalar arms read only `description`, and the header (`fromJson.ts:28-39`) admitted
   it.
3. **Partly true.** The two named pins existed: `fromJson.test.ts` "ignores harmless annotations"
   and `refDefs.test.ts` "$ref sibling description…". Two more pinned the same dropping, both in
   `nullableUnion.test.ts`: pydantic `Optional[str] = None` drops `default: null` and `title`. All
   four are updated.
4. **True.** `_reshape` re-parses `node.toJson()`, and the proxy sends `schema.toJson()`
   (`completionClient.ts:~1159`). Every emitted keyword round-trips; each has a test.
5. **True as far as it went, with three omissions.**
   - The Responses wire is shared by **every** `apiFormat: 'openai'` provider (Groq, Mistral,
     openai-compat, Ollama's compatibility endpoint), not only OpenAI and xAI.
   - Mistral also declares `openai-json-schema` structured output.
   - `toGeminiParameterSchema` recursed into data-valued keywords, so a passed `default` object
     holding a key named `additionalProperties`, or a `type` array, would have been rewritten. It
     now copies `default`, `examples` and `const` verbatim.
6. **Confirmed, with refinements.**
   - OpenAI strict supports the numeric ranges, `format` and `pattern`, and does not list string
     length. It also supports `multipleOf`, and `format` is limited to nine values.
   - Anthropic JSON outputs reject numeric and length constraints with a 400.
   - Gemini has `minimum`, `maximum`, `minLength`, `maxLength` and `format`, and has no `exclusive*`.
     It also has `title` and `default`, and lacks `multipleOf` and `examples`.
7. **True.** `adaptMcpTools` builds the validator with `fromJson`, so the constraint now refuses an
   out-of-range call before the server sees it. `ts-extras-mcp/src/test/unit/constraints.test.ts`
   runs this end to end against a real in-memory MCP server.

## Capability table

All pages were fetched on 2026-10-17. `{v…}` means the keyword passes only for the listed values
and folds otherwise.

| keyword | Responses tools + OpenAI strict output (`openai`, `xai-grok`) | same wires, any other provider | Anthropic tools (incl. forced-tool output) | Anthropic JSON outputs | Gemini (tools + responseSchema) | Ollama |
| --- | --- | --- | --- | --- | --- | --- |
| minimum | pass [O][X] | fold | pass [A1][A2] | fold [A2] | pass [G] | fold |
| exclusiveMinimum | pass [O][X] | fold | pass | fold | translate on integer (`minimum ⌊b⌋+1`), else fold [G] | fold |
| maximum | pass [O][X] | fold | pass | fold | pass [G] | fold |
| exclusiveMaximum | pass [O][X] | fold | pass | fold | translate on integer (`maximum ⌈b⌉−1`), else fold [G] | fold |
| multipleOf | fold (xAI silent) | fold | pass | fold | fold | fold |
| minLength / maxLength | fold (OpenAI does not list them) | fold | pass | fold | pass [G] | fold |
| format | {date-time, time, date, email, ipv4, ipv6, uuid} [O][X] | fold | pass | {date-time, time, date, duration, email, hostname, uri, ipv4, ipv6, uuid} [A2] | pass ("Any value is allowed") [G] | fold |
| title | fold | fold | pass | fold | pass [G] | fold |
| default | fold | fold | pass | pass ("for all supported types") [A2] | pass ("documentation-only") [G] | fold |
| examples | fold | fold | pass | fold | fold (`example` is root-only) | fold |

Citations:

- [O] https://developers.openai.com/api/docs/guides/structured-outputs § "Supported schemas" (number
  properties `multipleOf`, `maximum`, `exclusiveMaximum`, `minimum`, `exclusiveMinimum`; string
  `pattern` and `format` with nine values; `minLength`/`maxLength` named only as unsupported for
  fine-tuned models). Also https://developers.openai.com/api/docs/guides/function-calling: Responses
  tools without `strict` are "normalize[d] … into strict mode when possible".
- [X] https://docs.x.ai/docs/guides/structured-outputs: `minimum`/`maximum`/`exclusive*` enforced;
  `minLength`/`maxLength` enforced up to 2048; eight `format` values; "Tool schemas follow the same
  JSON Schema support rules".
- [A1] https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools: `input_schema` is
  "A JSON Schema object".
- [A2] https://platform.claude.com/docs/en/build-with-claude/structured-outputs § "JSON Schema
  limitations": the limitations apply to "JSON outputs and strict tool use"; numeric and string
  constraints are unsupported, and "you'll receive a 400"; `default` and ten formats are supported.
  The adapter never sets `strict` on a tool.
- [G] https://ai.google.dev/api/generate-content § Schema: `minimum`/`maximum`,
  `minLength`/`maxLength`, `format`, `title` and `default` are fields; there is no
  `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf` or `examples`.

**Folded because unverifiable:**

- **Mistral:** `docs.mistral.ai` is refused by the egress proxy (CONNECT 403 / DNS failure).
- **Groq and openai-compat:** not attempted, since there is no single documented server.
- **Ollama:** https://github.com/ollama/ollama/blob/main/docs/api.md documents `format` only as "a
  JSON schema", and `docs.ollama.com` was unreachable.

**No provider was found documenting rejection of a schema that contains a folded keyword**, because
the fold removes it. Anthropic JSON outputs documents a 400 for these keywords *if sent*, which is
why they fold. That is the stop-and-report condition's intended case, not a breach of it.

## Fold sentence format

`Constraints: <keyword> <JSON value>; <keyword> <JSON value>.`, for example
`Constraints: minimum 1; maximum 10.` or `Constraints: format "email"; default null.`.

- Keywords appear in `schemaConstraintKeywords` order: `minimum`, `exclusiveMinimum`, `maximum`,
  `exclusiveMaximum`, `multipleOf`, `minLength`, `maxLength`, `format`, `title`, `default`,
  `examples`.
- Values are written with `JSON.stringify`.
- The sentence is appended after an existing description with a single space, or becomes the
  description. An existing `description` key keeps its position.
- The sentence is pinned verbatim in `keywordAdaptation.test.ts`.

Safety argument (in TSDoc on `adaptSchemaKeywords` and `schemaKeywords.ts`): folding loosens the
wire, never the validator. `StructuredOutputEnforcement`'s `'schema'` TSDoc states that folded
constraints are not provider-enforced.

## Fixture sweep

**Touched** (deliberate updates of the old dropping pins):

- `ts-json-base` `fromJson.test.ts` › "carries annotations (format, title, default)…" (renamed from
  "ignores harmless annotations…");
- `refDefs.test.ts` › "each $ref sibling annotation replaces…";
- `nullableUnion.test.ts` › "pydantic Optional[str] = None (inbox)";
- `nullableUnion.test.ts` › "pydantic Optional[str]=None -> anyOf… (spike)".

**Added:**

- `ts-json-base` `constraints.test.ts`, `keywordAdaptation.test.ts`;
- `ts-extras` `schemaKeywords.test.ts`;
- `ts-extras-mcp` `constraints.test.ts`;
- `ts-extras-ollama` `chatStructured.test.ts` (one new test).

**Swept, no change needed:**

- `ts-extras`: the full suite passed unedited, because no fixture schema carried a constraint
  keyword.
- `ts-extras-mcp`: the existing fixtures carry no constraint keywords (tool `title` there is a
  descriptor field, not a schema keyword).
- `ts-extras-ollama`: the existing `format` assertions hold.
- `ts-prompt-assist`: it does not use `JsonSchema`.
- `samples/testbed`: its `JsonSchema` scenarios carry no constraint keywords, and the repo-wide
  `rush test` is green.

## Array and object constraints

The design extends to them without change.

- Add the keywords to `SchemaConstraintKeyword`. The total `Record` then makes every table a
  compile error until it states them.
- Add typed options and enforcement on the array and object nodes, and coherence checks in
  `constraints.ts`.
- The walker needs no change, since a node's own keywords are adapted wherever the node sits.

`const` stays accepted and dropped (out of scope; PersonAIlity#683's stream). `pattern` stays
refused.

## Gate counts

Run on commit `a21d378f9`, from the repo root, with logs under `.gate-logs/` (not committed).

| gate | result |
| --- | --- |
| `install-run-rush.js rebuild` | exit 0; `not met\|FAILURE\|Operations failed\|error TS` = 0; `warning` (case-insensitive) = 1, Rush's "Git-tracked symlink" notice only; 38/38 projects completed |
| `install-run-rush.js test` | exit 0; error grep = 0; `warning` = 1 (the same symlink notice); 37 projects completed, plus `typedoc-compact-theme` "did not define any work"; log not NUL-padded (8314 = 8314 bytes) |
| `change --verify --target-branch origin/integration/asks` | exit 0; four change files found |
| per-package `heft test --clean` (`ts-json-base`, `ts-extras`, `ts-extras-ollama`, `ts-extras-mcp`) | 100% statements, branches, functions and lines; no warnings |
| `eslint src` / `eslint --fix` (`rushx lint` / `fixlint`) in the same four | exit 0; `--fix` changed nothing |
| `verify-capability-docs.mjs` | 0 failed; router at 22,639/24,000 characters |

## What the brief got wrong

- **Decision 7 assumed one table per wire format.** The OpenAI-family wires are shared by six
  providers with different, and mostly undocumented, support. See `state.md` § Deviations 2.
- **Decisions 9 and 10 implied the fold could live in `AA` and serve Ollama.** It cannot without a
  new dependency, so it lives in `ts-json-base`.
- **Decision 4 said the factory "fails construction"** without noting that the factories cannot
  return a `Result`. They throw, as setup code.
- **Belief 3 named two pins; there were four.** **Belief 5 missed** the shared OpenAI wire and the
  Gemini sanitizer's rewriting of data-valued keywords.
- **The close-out asks for "the `TECH_DEBT.md` P3 marked resolved".** That P3 is wider than this
  stream. It is resolved for the constraint class only.
