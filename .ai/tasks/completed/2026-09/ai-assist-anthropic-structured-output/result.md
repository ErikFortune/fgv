# Result — `ai-assist-anthropic-structured-output`

**Shipped:** Anthropic structured output no longer depends on forcing a tool call on the lines that reject it — `claude-opus-5-5` and `claude-fable-5-1` get Anthropic's JSON outputs, and `@anthropic:opus` / `@anthropic:fable` rotate to them.

**No live Anthropic call was made from this environment.** It has no provider credentials, and none
were sought. Everything below is offline-green plus a cited record. The live gate is the
maintainer's `anthropic-model-tiers` testbed run, which now carries a structured-output probe per
tier and for `@anthropic:fable` (§6).

---

## 0. Step zero — documentation reachability (2026-09-25)

`curl -sS "$HTTPS_PROXY/__agentproxy/status"` showed the proxy enabled and not selective. Every
page below returned **200** through it. Nothing was inferred from search results; every wire claim
comes from the raw page text (the `.md` rendering of each URL).

| # | page | used for |
|---|---|---|
| D1 | <https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5.md> | forced `tool_choice` 400; "the first three also apply on Claude Fable 5.1"; the two replacements |
| D2 | <https://platform.claude.com/docs/en/build-with-claude/structured-outputs.md> | `output_config.format` wire shape, supported models, guarantees, limits, feature compatibility |
| D3 | <https://platform.claude.com/docs/en/api/messages/create.md> | `OutputConfig` = `effort` + `format` siblings; `ToolChoiceAuto` semantics |
| D4 | <https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use.md> | what `strict: true` guarantees |
| D5 | <https://platform.claude.com/docs/en/build-with-claude/citations.md> | citations incompatible with structured outputs |
| D6 | <https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool.md> | web search citations always on; tool versions |
| D7 | <https://platform.claude.com/docs/en/agents-and-tools/tool-use/server-tools.md> | checked for structured-output interaction; none stated |
| D8 | <https://platform.claude.com/docs/en/build-with-claude/effort.md> | effort levels on the rotated ids |
| D9 | <https://platform.claude.com/docs/en/about-claude/model-deprecations.md> | both successors Active; predecessors' retirement dates |

All fetched 2026-09-25.

## 1. Fork 1 — which mechanism: **JSON outputs (`output_config.format`)**

The two replacements D1 names: *"For schema-valid JSON, keep `tool_choice: {"type": "auto"}` and
set `strict: true` with strict tool use, or move the schema to structured outputs."*

| mechanism | wire | guarantee (as documented) | where the reply lands |
|---|---|---|---|
| **JSON outputs** (chosen) | `output_config: { format: { type: 'json_schema', schema } }` (D2 quick start; D3 `format: optional JSONOutputFormat`) | "Structured outputs guarantee schema-compliant responses through constrained decoding: Always valid … Type safe … Reliable" (D2). Documented exceptions (D2 § Invalid outputs): `stop_reason: "refusal"`, `stop_reason: "max_tokens"`, and enum/const **capitalization** | the text content block (D2 § How it works: "returned in the response's text content block") |
| `tool_choice: auto` + strict tool (declined) | synthetic tool with `strict: true`, `tool_choice: {type:'auto'}` | D4 § Guarantees: "Tool `input` strictly follows the `input_schema`" and "Tool `name` is always valid". Nothing about the tool **being called**. D3: `ToolChoiceAuto` — "The model will automatically decide whether to use tools." D1: "To make the model call a tool rather than reply in text, say in the prompt when the tool applies." | a `tool_use` block **if** the model chooses to call it; otherwise text |

**Chosen: JSON outputs.** Strict tool use constrains the *shape* of a call the model *might not make*.
Under `auto` the always-get-a-`T` guarantee becomes "get a `T` or free text", and recovering it
needs a re-ask loop or a new failure mode. JSON outputs constrain the reply itself, with the same
documented exceptions every schema format has. It is also the smaller *behavioral* surface: no
synthetic tool, no `tool_use` re-serialization, and no tools-channel ownership.

Both rotated ids are in D2's `supportedModels` list (`claude-opus-5-5`, `claude-fable-5-1`), and the
feature is `status: ga` with no beta header. D2: "The `output_format` parameter has moved to
`output_config.format`, and beta headers are no longer required."

**Declared by prefix, only for the two ids that reject forcing.** D2 lists every current Claude line
as supported, so JSON outputs *could* replace forced tool use everywhere. That was not done. It
would change the reported enforcement from `'tool-forced'` to `'schema'` for existing
callers on `claude-sonnet-5`, `claude-opus-5` and the rest, and the brief scoped the change to the
lines that reject forcing. `anthropic-tool-forced` stays under the `''` catch-all.

**`json-object` is not expressible** on the new format. D2 and D3 document one `format.type`,
`json_schema`, with a required schema. A stand-in schema cannot be written: D2 § JSON Schema
limitations says `additionalProperties` must be `false` for objects, so `{type:'object'}` would
constrain the reply to `{}`. `jsonObjectWire` returns `undefined`, so `json-object` routes through
`onUnsupported` exactly as it does on the forced format.

**No schema sanitizer was added.** D2 rejects some keywords with a 400: numeric and string
constraints, recursion, and `additionalProperties` other than `false`. `JsonSchema`'s builders emit
none of them by default. `additionalProperties: true` is opt-in, and `fromJson` can carry anything.
This matches the OpenAI strict formats, which also send the schema verbatim. The optional-property
rule is OpenAI-only and does not apply here. D2 supports optional properties, up to 24 across a
request, and a test pins that an optional-property schema goes out unchanged.

## 2. Fork 2 — the enforcement value: **`'schema'`, no union change**

`StructuredOutputEnforcement` documents `'schema'` as "generation was constrained to the supplied
schema". D2's constrained decoding is exactly that, and the reply is the model's own text, as on
the OpenAI and Gemini schema formats. `'tool-forced'` would be false: nothing is forced, and there
is no `tool_use` block to re-serialize. So the union does not move. The `'schema'` doc line now
names Anthropic's `output_config.format` explicitly.

What *did* widen is `AiStructuredOutputFormat`, the capability-declaration union, which gains
`'anthropic-output-format'`. That is additive for descriptors, but a consumer with an exhaustive
`switch` over the union stops compiling, so the change file is `minor`, not `none`. The
enforcement union, the one the brief flagged as a deliberate breaking change, is untouched.

The response path is `extractAnthropicText`, unchanged. An always-thinking model returns `thinking`
blocks first (D1: "every response can begin with one or more `thinking` blocks"). They are skipped
by type, and a test pins that. A refusal (`stop_reason: "refusal"`, D2) comes back as text and is
reported `'schema'`: the report is what was *asked*, and conformance is the caller's converter's
question, the same contract as every other `'schema'` format. A test pins this too.

## 3. Fork 3 — server tools: **still refused, for a third and different reason**

There is no wire-level clash. `output_config.format` is nowhere near `tools`. D2 § Using both
features together documents JSON outputs and (strict) tools in one request, and D2 § Feature
compatibility says: "Grammars apply only to Claude's direct output, not to tool use calls, tool
results, or thinking tags."

There is no API-level exclusivity of the Gemini kind either. Nothing in D2, D6 or D7 says server
tools as a class are excluded.

**There is a feature-level clash, specific to the only Anthropic server tool ai-assist sends:**

- D6 § Citations: "Citations are always enabled for web search".
- D2 § Feature compatibility, *Incompatible with*: "Citations: Citations require interleaving
  citation blocks with text, which conflicts with strict JSON schema constraints. Returns 400 error
  if citations enabled with `output_config.format`."
- D5 scopes the documented 400 to "citations on any user-provided document (`document` blocks or
  `search_result` blocks)".

The documented trigger does not name web search's `web_search_tool_result` blocks, and **no fetched
page says whether web search + `output_config.format` is accepted, rejected or silently
de-cited.** The stated *reason* for the incompatibility applies to web search's citations unchanged.
Per the brief's missing-input rule, no wire behavior was inferred. The refusal is **kept** for
`anthropic-output-format` and commented in the file's per-format style as a third reason class:
not wire-level, not API-level, but feature-level. Its message names citations, not "forcing a
tool". The open question is filed as a **TECH_DEBT P3**, with the one raw request that settles it.

The testbed probe cannot settle it, because the library refuses the combination before the wire.

`json-object` + `web_search` on the new format degrades to `'none'` and sends the search. The wire
is empty, so there is nothing to conflict with. Same reasoning as the forced format; tested.

## 4. The `output_config` merge — a defect the naive implementation would have shipped

`callAnthropicCompletion` writes `body.output_config = { effort }` for adaptive-thinking models,
then `Object.assign(body, structured.wire)`. With the new wire, that assignment **replaces**
`output_config` and silently drops the effort. `claude-opus-5-5` always thinks (D1 § Thinking can't
be disabled), so effort plus structured output is the ordinary call, not an edge case. D3 documents
`effort` and `format` as optional siblings of one `OutputConfig`, so a one-level merge is the
documented shape. The new `mergeAnthropicStructuredWire` does it. Mutation-checked: reverting that
one call site to `Object.assign` turns exactly the effort test red (1 failed / 81 passed).

## 5. Every Anthropic capability table, checked against the rotated ids

| table | change | evidence |
|---|---|---|
| `aliases` `@anthropic:opus` | `claude-opus-5` → **`claude-opus-5-5`** | D9: Active, not sooner than 2027-09-22; D1 "Claude API ID" |
| `aliases` `@anthropic:fable` | `claude-fable-5` → **`claude-fable-5-1`** | D9: Active, not sooner than 2027-09-01 |
| `aliases` `@anthropic:sonnet`, `@anthropic:haiku` | none | not in scope; unchanged ids |
| `defaultModel` | none (comment only) | `advanced` still names `@anthropic:opus`; frontier still cascades |
| `structuredOutput` | **two new longer-prefix entries** (`claude-opus-5-5`, `claude-fable-5-1` → `anthropic-output-format`); `''` → `anthropic-tool-forced` kept | D1, D2. Tested per id, including a dated snapshot, both aliases, and five lines that keep forcing |
| `adaptiveThinkingModelPrefixes` | none, **verified rather than inherited** | `isExactOrDashBoundedPrefix('claude-opus-5-5', 'claude-opus-5')` is true because the next char is `-`, and likewise `claude-fable-5-1` / `claude-fable-5`. A new registry test asserts `isAdaptiveThinkingModel` for `claude-opus-5-5`, `claude-fable-5-1` and `claude-opus-5-5-20260922`. D1: adaptive is the only accepted shape on both |
| `thinkingRequiredModelPrefixes` | none (not declared) | D1: "Omit the `thinking` field, or send `thinking: {"type": "adaptive"}`". ai-assist's `'none'` omits the field, so it is accepted. Existing test already asserts `claude-opus-5-5` is not thinking-required |
| effort values | none | D8: `xhigh` and `max` are both listed for Claude Opus 5.5 and Claude Fable 5.1; `low`/`medium`/`high` are universal |
| `supportedTools: ['web_search']` | none | ai-assist sends `web_search_20250305`. D6 lists it as a current version, and D1 § Feature support lists server-side tools |
| `acceptsImageInput` | none | D1 § Feature support: vision |
| `DEFAULT_MODEL_CAPABILITY_CONFIG.anthropic` | none | `/^claude-opus-/` and `/^claude-fable-/` already tag both ids with thinking. The test table gains both ids |
| `AnthropicThinkingModelNames` | none | both ids already added by #692 |
| `temperature` handling | none | unchanged; the Claude-5 family already rejects it |

Not checked: **`claude-mythos-5-1`**. D1 says the forced-tool rejection applies to Fable 5.1, not
Mythos, and Mythos is not in `AnthropicThinkingModelNames` or any alias. If someone overrides to
it, it falls under the catch-all.

## 6. Testbed probe

`samples/testbed/src/scenarios/modelTiers/canary.ts` gains `structuredOutputProbe`. It fires one
schema-mode completion with `onUnsupported: 'fail'` per tier and per extra model. Three checks, all
required for a pass:

1. **The call succeeded.** A 400 is `FAIL(param)`, which means the declared format is one the model
   rejects.
2. **The reported enforcement equals the one the registry declares** for the resolved id
   (`expectedStructuredEnforcement`).
3. **The content satisfies the probe schema.** It is parsed with `Converters.stringifiedJson`
   through the same `JsonSchema` object that was sent.

`anthropicModelTiersScenario` enables it and adds `@anthropic:fable` as an extra model. One keyed
run therefore exercises **both** Anthropic mechanisms live:

- `base`: `claude-sonnet-5`, `'tool-forced'`
- `advanced` / `frontier`: `claude-opus-5-5`, `'schema'`
- `@anthropic:fable`: `claude-fable-5-1`, `'schema'`

It also gives `claude-fable-5-1` its first plain live row. The seam stays coverage-ignored like
the existing ones. The classification and verdict logic is covered offline through injected deps.

## 7. Gates (all run 2026-09-25, on the final tree)

| gate | result |
|---|---|
| `rushx build` (ts-extras, testbed) | pass, zero warnings; `etc/ts-extras.api.md` updated for the `AiStructuredOutputFormat` member |
| `rushx lint` / `rushx fixlint` (ts-extras, testbed) | clean. One `naming-convention` warning on a `_label` test parameter was fixed by switching to object-form `test.each` |
| `rushx test` (ts-extras) | 3101 pass, 100% statements / branches / functions / lines |
| `rushx test` (testbed) | 576 pass, 100% |
| repo-wide `install-run-rush.js test` | **35/35 succeeded, none with warnings** |
| `rush change --verify --target-branch origin/release` | pass (`@fgv/ts-extras`, `minor`; `samples/testbed` is unpublished) |
| `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`, `verify-bundler-resolution`, `verify-tarball-exports` | pass. The last two first needed their autoinstallers installed in this container, as in #692 |
| layer-1 order | `code-reviewer` ran on the full diff **before** the coverage run. No P1/P2. Two P3s fixed: a registry comment implied array order mattered (matching is longest-prefix), and a doc sentence was split across a line. The first coverage run was already at 100%, so no gap-closure phase and no `c8 ignore` |
| mutation check | reverting `mergeAnthropicStructuredWire` to `Object.assign` → exactly the effort-merge test fails |
| Copilot loop | not yet run at the time of writing |
| live | **none from this environment**; pending the maintainer's `anthropic-model-tiers` run |

## 8. Open items

- **TECH_DEBT P3**: whether web search + `output_config.format` is accepted (§3).
- **Not done, deliberately**: moving the other Claude lines from forced tool use to JSON outputs (§1).
