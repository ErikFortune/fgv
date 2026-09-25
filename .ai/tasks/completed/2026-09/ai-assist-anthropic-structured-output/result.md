# Result — `ai-assist-anthropic-structured-output`

**Shipped:** Anthropic structured output no longer depends on forcing a tool call on the lines that reject it — `claude-opus-5-5` and `claude-fable-5-1` get Anthropic's JSON outputs, and `@anthropic:opus` / `@anthropic:fable` rotate to them.

**Live-verified by the maintainer's `anthropic-structured-output` (3/3) and `anthropic-model-tiers`
(11/11) runs, 2026-09-25 (§6b).** Every probe passed, including `output_config.format` on `claude-opus-5-5` and `claude-fable-5-1`. The
agent itself made no live call: this environment has no provider credentials, and none were sought. Everything below is offline-green plus a cited record. The live gate is the
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
| D9 | <https://platform.claude.com/docs/en/about-claude/model-deprecations.md> | all four ids Active, with "not sooner than" retirement dates |
| D10 | <https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1.md> | "Claude Fable 5.1 and Claude Mythos 5.1 don't support forced tool use"; Mythos 5.1 "Same capabilities as Claude Fable 5.1"; adaptive thinking always on, budget and disabled both 400 |

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

Both rotated ids, and `claude-mythos-5-1`, are in D2's `supportedModels` list, and the
feature is `status: ga` with no beta header. D2: "The `output_format` parameter has moved to
`output_config.format`, and beta headers are no longer required."

**Declared by prefix, only for the ids that reject forcing** (`claude-opus-5-5`, `claude-fable-5-1`, `claude-mythos-5-1`). D2 lists every current Claude line
as supported, so JSON outputs *could* replace forced tool use everywhere. That was not done. It
would change the reported enforcement from `'tool-forced'` to `'schema'` for existing
callers on `claude-sonnet-5`, `claude-opus-5` and the rest, and the brief scoped the change to the
lines that reject forcing. `anthropic-tool-forced` stays under the `''` catch-all.

**`json-object` is not expressible** on the new format. D2 and D3 document one `format.type`,
`json_schema`, with a required schema. A stand-in schema cannot be written: D2 § JSON Schema
limitations says `additionalProperties` must be `false` for objects, so `{type:'object'}` would
constrain the reply to `{}`. `jsonObjectWire` returns `undefined`, so `json-object` routes through
`onUnsupported` exactly as it does on the forced format.

**Two further documented constraints, checked.** D2 § Feature compatibility: *"Message
Prefilling: Incompatible with JSON outputs"*. Not reachable: the completion path builds messages
as `head` then the user prompt (`buildAnthropicMessages` with no `rawTail`), so the last turn is
always the user's. D2 § Prompt modification: changing `output_config.format` *"will invalidate any
prompt cache for that conversation thread"*. That is a cost, not a correctness issue. ai-assist's
cache breakpoints (#671/#688) remain valid. A caller alternating schemas on one cached prefix pays
a cache write each time, the same as changing a tool set.

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
| `structuredOutput` | **three new longer-prefix entries** (`claude-opus-5-5`, `claude-fable-5-1`, `claude-mythos-5-1` → `anthropic-output-format`); `''` → `anthropic-tool-forced` kept | D1, D2, D10. Tested per id, including a dated snapshot, both aliases, and five lines that keep forcing |
| `adaptiveThinkingModelPrefixes` | none, **verified rather than inherited** | `isExactOrDashBoundedPrefix('claude-opus-5-5', 'claude-opus-5')` is true because the next char is `-`, and likewise `claude-fable-5-1` / `claude-fable-5`. A new registry test asserts `isAdaptiveThinkingModel` for `claude-opus-5-5`, `claude-fable-5-1` and `claude-opus-5-5-20260922`. D1: adaptive is the only accepted shape on both |
| `adaptiveThinkingModelPrefixes` + `claude-mythos-5-1` | **added** (its own id, not `claude-mythos-5`) | D10: "Adaptive thinking is always on. `thinking: {"type": "enabled"}` with `budget_tokens` and `thinking: {"type": "disabled"}` both return a 400 error." Without it, an effort on a `claude-mythos-5-1` override took the legacy budget shape. No fetched page says the same of `claude-mythos-5`, so that prefix was not used. A wire test pins adaptive + `output_config` for it |
| `thinkingRequiredModelPrefixes` | none (not declared) | D1: "Omit the `thinking` field, or send `thinking: {"type": "adaptive"}`". ai-assist's `'none'` omits the field, so it is accepted. Existing test already asserts `claude-opus-5-5` is not thinking-required |
| effort values | none | D8: `xhigh` and `max` are both listed for Claude Opus 5.5 and Claude Fable 5.1; `low`/`medium`/`high` are universal |
| `supportedTools: ['web_search']` | none | ai-assist sends `web_search_20250305`. D6 lists it as a current version, and D1 § Feature support lists server-side tools |
| `acceptsImageInput` | none | D1 § Feature support: vision |
| `DEFAULT_MODEL_CAPABILITY_CONFIG.anthropic` | none | `/^claude-opus-/` and `/^claude-fable-/` already tag both ids with thinking. The test table gains both ids |
| `AnthropicThinkingModelNames` | none | both ids already added by #692 |
| `temperature` handling | none | unchanged; the Claude-5 family already rejects it |

**`claude-mythos-5-1`** is a documented id (D2 `supportedModels`, D8, D10) that no alias reaches.
D10 states it rejects forced tool use and is adaptive-only, so it is declared on both tables (see
§9 for how this was first missed). It is **not** added to `AnthropicThinkingModelNames` or to a
`listModels` thinking `idPattern` (it falls to `/^claude-/`). Those are the manual-axes union and
detection rules, which track ids ai-assist names, and no alias names Mythos.

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

**The dedicated `anthropic-structured-output` scenario** (`src/scenarios/structuredOutput/`) was
missed at first. It still probed only the default model, i.e. only `tool-forced`. It now also probes
`@anthropic:opus` and `@anthropic:fable` with `expect: 'schema'`. Its prompt is deliberately
hostile: it asks for a markdown fence and an extra `funFact` field. So a pass there proves the
grammar suppressed both, which is a stronger live check than the canary's `{answer}` probe. A new
offline test pins the scenario's hard-coded expectations to the registry.

**Effort + schema rows (added after the first two live runs).** The canary gained
`structuredOutputEfforts`. It repeats every structured-output probe with a thinking effort, and the
Anthropic scenario sets it to `['low']`. On `claude-opus-5-5` / `claude-fable-5-1` that sends
`output_config: { effort, format }`, the documented-but-never-sent combination (D3). On
`claude-sonnet-5` it sends a forced tool with adaptive thinking. Anthropic's thinking page
(<https://platform.claude.com/docs/en/build-with-claude/thinking> § "Thinking with tool use", fetched
2026-09-25) says forced tool use *"works with adaptive thinking"*. A dropped effort cannot be seen
live, because the response does not report it. That failure is pinned by the ts-extras
request-body test (§4). The live rows show the provider accepts the combination.

The same page surfaced a **pre-existing** defect outside this stream: on the manual-thinking lines
(`@anthropic:haiku`, the 4.x ids), effort + structured output sends a forced tool with
`thinking.type: enabled`, which that page says is an error. Filed as a TECH_DEBT P3 rather than
widened into this PR.

## 6b. Live run (maintainer, 2026-09-25): `anthropic-structured-output`

```
anthropic tool-forced: enforcement=tool-forced content={"city":"Paris","countryCode":"FR","populationMillions":2.1}
anthropic output_config.format (@anthropic:opus): enforcement=schema content={"city":"Paris","countryCode":"FR","populationMillions":2.1}
anthropic output_config.format (@anthropic:fable): enforcement=schema content={"city":"Paris","countryCode":"FR","populationMillions":2.1}
3 passed, 0 skipped
```

Resolved models, from the run's own log lines: `claude-sonnet-5`, `claude-opus-5-5`,
`claude-fable-5-1`. The prompt asks for a markdown fence and an extra `funFact` field. On both
successors the reply is bare JSON with exactly the three schema fields, so the constraint was
applied, not merely accepted. The forced path on `claude-sonnet-5` is unchanged.

**Second run (maintainer, 2026-09-25): `anthropic-model-tiers` — LIVE-VERIFIED, 11/11.**
- Resolver proof for base, advanced and frontier (the frontier request cascaded to `claude-opus-5-5`).
- Live completions for `claude-sonnet-5` and `claude-opus-5-5` ×2, plus `claude-fable-5-1` via
  `modelOverride`.
- Structured-output probes: `base schema` returned `'tool-forced'`; `advanced`, `frontier` and
  `@anthropic:fable` returned `'schema'`.

**Not covered by either run:**
- The `effort` + `format` merge. These probes send no thinking config, so `output_config` carried
  `format` alone.
- `claude-mythos-5-1`: no alias reaches it, and access is Project-Glasswing-only.
- `web_search` + JSON outputs (TECH_DEBT P3).

## 7. Gates — final run on `f539be5e` (2026-09-25, after the §9 fixes)

| gate | result |
|---|---|
| repo-wide `install-run-rush.js rebuild` | **36/36 succeeded, 0 warnings** |
| repo-wide `install-run-rush.js test` | **35/35 succeeded, 0 warnings**. The 100% coverage thresholds are enforced inside it |
| ts-extras tests | 3103 pass (3101 before §9, plus the Mythos wire test and its registry row) |
| testbed tests (`heft test`) | 576 pass, 100% all metrics. After the later additions (the scenario probes, then the effort rows): 577, then 578, each re-run at 100% with lint clean |
| `eslint` (ts-extras, testbed) | clean; `fixlint` run before the commit |
| `rush change --verify --target-branch origin/release` | pass (`@fgv/ts-extras`, `minor`; `samples/testbed` is unpublished) |
| `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`, `verify-bundler-resolution`, `verify-tarball-exports` | all pass. The last two first needed their autoinstallers installed in this container, as in #692 |
| layer-1 order | `code-reviewer` ran on the full diff **before** the first coverage run. No P1/P2. Two P3s fixed: a registry comment implied array order mattered (matching is longest-prefix), and a doc sentence was split. The first coverage run was already at 100%, so there was no gap-closure phase and no `c8 ignore` |
| mutation check | reverting `mergeAnthropicStructuredWire` to `Object.assign` → exactly the effort-merge test fails (1 failed / 81 passed, on the pre-§9 file) |
| antagonist pass | §9 |
| Copilot loop | not run at close-out |
| live | none from this environment; the maintainer's runs passed: `anthropic-structured-output` 3/3, `anthropic-model-tiers` 11/11 (§6b) |

## 8. Open items

- **TECH_DEBT P3**: whether web search + `output_config.format` is accepted (§3).
- **Not done, deliberately**: moving the other Claude lines from forced tool use to JSON outputs (§1).
- **Copilot review loop (layer 2)**: not run at close-out.
- **Live runs**: both passed (§6b). The effort + format rows were added afterwards (§6) and are pending one more `anthropic-model-tiers` run.
- **TECH_DEBT P3**: forced tool + manual thinking on pre-Claude-5 lines (§6).

## 9. Antagonist pass (independent reviewer, 2026-09-25) and what it changed

No P1. The doc quotes were checked verbatim against the saved pages, along with test counts and
the existence of every claimed test. Findings and dispositions:

- **F3 — `claude-mythos-5-1` was skipped on an unsourced negative inference.** An earlier draft of
  §5 said *"D1 says the forced-tool rejection applies to Fable 5.1, not Mythos"*. D1 says nothing
  about Mythos. Fetching D10 showed Mythos 5.1 **does** reject forced tool use and **is**
  adaptive-only. **Fixed**: declared on `structuredOutput` and `adaptiveThinkingModelPrefixes`,
  with a registry test and a wire test. This was the acceptance item "no mechanism that 400s for
  any documented id", and it had not been met.
- **F1 — stale adapter comment** (`completionClient.ts`, the forced-tool clobber assertion) still
  described a hypothetical second Anthropic entry. **Fixed.**
- **F2 — stale `idPattern` comment** named `claude-opus-5` as the advanced-tier target. **Fixed.**
- **F4 — "all run on the final tree" was not demonstrable.** The logs predated the last
  (comment-only) commit. **Fixed** by re-running every gate after these fixes (§7).
- **F5 — `meta.yaml` `packages` omitted the testbed.** **Declined, with a note in the file.**
  `packages` feeds the consumer-facing capability feed, and listing `@fgv/testbed` there tagged the
  feed line with an unpublished sample. That is the same choice #692 made. The brief's out-of-scope
  line ("every package outside `ts-extras`") conflicts with its own instruction to add the probe.
  That tension is recorded in `diverged`.
- **F6 — Copilot loop missing from the open lists.** **Fixed** (§8, README, ledger).
- **F7 — prefill and prompt-cache constraints not dispositioned.** **Fixed** (§1).
- **F8 — two ragged comment wraps.** **Fixed.**
- **F9 — "predecessors' retirement dates" overstated D9.** **Fixed** (D9 row).
