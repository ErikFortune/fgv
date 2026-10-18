# Result: `testbed-wire-probe`

**Shipped:** a `wire-probe` testbed scenario that sends fixture schemas unadapted to each configured provider wire, classifies every row against the `ai-assist` keyword table as agrees / conservative / unsafe, and confirms each adapted request end to end — plus two additive `ts-extras` exports it needed.

Branch `testbed-wire-probe`, from `integration/asks` at `59f06b939` (brief commit; `integration/asks`
had nothing newer to merge). Commits: `ce69cfed` (ts-extras), `1b9ce0e2` (testbed), and the
close-out commit. PR: `#738`.

**One live run was made, on 2026-10-18 by the user, with all four keys** (§ Live run below). It found
**one unsafe row**: `anthropic-tools/untyped-root`. It confirmed two of the three #736 inferences and
showed the third to be conservative. The session that built the probe had no keys; the unit tests run
over synthetic responses.

## What shipped

### `samples/testbed` — `wire-probe` (CLI-only)

- **Fixtures** (`wireProbe/fixtures.ts`, 22): a control with no keyword under test; `minimum`,
  `maximum`; `exclusiveMinimum` and `exclusiveMaximum` each on a number and on an integer (Gemini
  translates the integer case); `multipleOf`, `minLength`, `maxLength`; `format` as `date-time` (in
  every pass list), `uri` (Anthropic JSON outputs only) and `duration` (OpenAI documents it, xAI does
  not); `title`, `default`, `examples`; integer, number and boolean `enum`; `{}` in properties, in
  items and at the root. Each is the JSON a host authors, read through `JsonSchema.fromJson`. The
  raw schema sent is its `toJson()`, and the adapted request is built from the same validator.
- **Wires and models** (`wireProbe/wires.ts`):

  | wire id | position | model (alias → id) | why |
  |---|---|---|---|
  | `anthropic-tools` | `tools[].input_schema` | `@anthropic:sonnet` → claude-sonnet-5 | base tier. Haiku is a non-tier alias whose retirement was due no sooner than 2026-10-15, and a retired model makes the wire inconclusive |
  | `anthropic-json-outputs` | `output_config.format` | `@anthropic:opus` → claude-opus-5-5 | the cheapest model ai-assist sends JSON outputs to. Every other line uses forced tool use, so probing JSON outputs there would test a wire we never send |
  | `openai-tools` | Responses `tools[]` (function) | `@openai:nano` → gpt-5.4-nano | smallest registered |
  | `openai-strict-output` | Chat Completions `response_format` strict | `@openai:nano` | same |
  | `gemini-tools` | `function_declarations[].parameters` | `@google-gemini:flash-lite` → gemini-3.5-flash-lite | smallest registered |
  | `gemini-response-schema` | `generationConfig.responseSchema` | `@google-gemini:flash-lite` | same |
  | `xai-tools` | Responses `tools[]` | `@xai-grok:standard` → grok-4.3 | the cheap line |
  | `xai-strict-output` | Chat Completions `response_format` strict | `@xai-grok:standard` | same |

  Each raw request is one turn capped at 16 output tokens, the Responses API minimum. The
  end-to-end request is capped at 256, because `ai-assist` reads the reply and a reasoning model can
  spend 16 tokens before it writes anything.
- **Method** (`wireProbe/probe.ts`):
  - **Ours.** `adaptSchemaKeywords` is run with the table read from the library. Unchanged is
    `pass`, changed is `adapt`, a failure is `refuse`. The probe never restates a table.
  - **Raw.** 2xx is accepted. 400 or 422 is rejected, with the provider's error text. Anything else
    (401, 404, 429, 5xx, a transport failure) is inconclusive.
  - **Row outcome:**
    - `pass` and accepted is **agrees**;
    - `pass` and rejected is **unsafe**;
    - `adapt` or `refuse`, and accepted, is **conservative**;
    - `adapt` or `refuse`, and rejected, is **agrees**.
  - **End to end.** Client tools go through `executeClientToolTurn` and structured output through
    `callProviderCompletion` with `onUnsupported: 'fail'`. A refused fixture must be refused before
    anything is sent (`… cannot be sent …`). Anything else must be accepted. If the provider rejects
    the adapted request, that is **unsafe**.
  - **Control gate.** If the control fixture is not accepted, the wire stops there and is reported
    as inconclusive.
  - **Exit.** The run fails, so the CLI exits 1, only when a row is unsafe, raw or end to end.
    Otherwise the report is on stdout.
- **Keys** are resolved through `resolveProviderApiKey`: KeyStore, then the env var. A wire with no
  key is skipped. Only URLs are logged. Gemini's key is sent in `x-goog-api-key`, not in the URL.
  `WIRE_PROBE_WIRES=<ids>` selects a subset of wires.
- **Live seams** are in `wireProbe/live.ts` and excluded from coverage, as `xaiCacheProbe/index.js`
  is. Raw requests use the platform `fetch`, not `saferFetchJson`, because `saferFetchJson`
  deliberately never surfaces a non-2xx body, and the provider's error text is what the probe
  records.
- **README** has a "Provider wire probe" section; the scenario is registered and the registry
  snapshot updated.
- **Tests:** `wireProbe.test.ts`, 26 tests. They cover:
  - fixture validity and keyword coverage;
  - `ourVerdict` against the real tables;
  - error-text parsing;
  - every branch of raw and adapted observation;
  - both classifiers, exhaustively;
  - wire selection;
  - the raw request shape per format;
  - full runs over a simulated provider: all accepted, an unsafe pass, conservative folds, a
    refusal that agrees, an end-to-end mismatch, inconclusive results, a failed control, registry
    skips and a bad fixture;
  - the CLI entry.

  The provider bodies are **synthetic**, shaped like each documented error envelope. They were not
  recorded, and the test file says so.

### `@fgv/ts-extras` (additive, `minor`)

- `AiAssist.structuredOutputSchemaKeywords(descriptor, { model, endpoint? })` is the
  structured-output sibling of `clientToolSchemaKeywords`. It returns the table structured output
  is adapted with for that model: Anthropic JSON outputs or Anthropic tools by model line, otherwise
  the OpenAI-family or Gemini table. Under an endpoint override, or for an `ft:` model, it returns
  the conservative table. It returns `undefined` when the model declares no capability.
- `AiAssist.toGeminiParameterSchema` is now public. It is Gemini's dialect translation alone. Its
  TSDoc block had been attached to the wrong function, and that is fixed.
- Tests are in `schemaShapes.test.ts`, the line is in `CAPABILITIES.md`, and the change file is
  `testbed-wire-probe_2026-10-18-12-00.json`.
- `LIBRARY_CAPABILITIES.md` (the index) is **not** amended. Both functions are lookups beside an
  existing entry. The package `CAPABILITIES.md` line covers them, and the router is at 22.8k of its
  24k budget.

## Where the brief was wrong or silent

- **"Testbed may need no change file."** That is true of the testbed, which is private, and
  `change --verify` confirms it. But the stream could not stay testbed-only. The Anthropic
  JSON-outputs table had no public route, because `schemaKeywordsFor` is `@internal`. Copying the
  table into the testbed would have let the probe report "agrees" against a copy that had drifted
  from what ships, which is the failure the probe exists to catch. So `ts-extras` gained
  `structuredOutputSchemaKeywords`. The raw Gemini request also has to be in Gemini's dialect
  (draft-07 `additionalProperties` 400s on its own), and that translation was internal, so it is
  exported too. Both changes are additive on an active surface. They touch `structuredOutput.ts`,
  `toolFormats.ts` (a doc-block move) and `index.ts`. **Collision note:** `ai-assist-wire-followups`
  also edits `ai-assist`. The overlap is the `index.ts` export lines and `etc/ts-extras.api.md`, and
  neither touches `schemaKeywords.ts`.
- **"Exit non-zero only on unsafe rows."** I read "unsafe" as also covering an adapted request the
  provider rejects end to end. That is the request we actually send failing, which is the same harm,
  and the brief asks for the end-to-end check without classifying it. A `mismatch`, where the
  library sends what the table refuses or refuses what it passes, is reported but does not fail the
  run.
- **"The report goes to stdout."** The testbed CLI writes a scenario's success value to stdout and a
  failure to stderr. So the report is on stdout when nothing is unsafe, and on stderr with exit 1
  when something is. I did not change `cli.ts`.
- **Sub-agents.** The brief allowed only `web-fetch`, so the layer-1 `code-reviewer` pass was a
  deliberate self-review, not an independent one (see below).

## Self-review (layer 1, not independent)

I checked:
- No `any` is used.
- Fallible paths return `Result`, and the converters (`Converters.oneOf` / `object`) parse provider
  error bodies.
- No key reaches a log line or a URL.
- The control gate overrides the control row to inconclusive, so a bad key cannot read as an unsafe
  `pass`.
- `ourVerdict` compares canonical JSON, not hashes.
- Gemini's verdict is taken before dialect translation, which is applied identically to the raw and
  adapted paths.
- The end-to-end classifier treats an unknown library failure (an empty reply under the cap) as
  inconclusive rather than accepted.

One fix was made during review. Initially a control rejected with a 400 would have been classified
`unsafe`. Known limits:
- `observeAdapted` relies on the library's failure text (`API returned <status>`, `cannot be sent`),
  which is not a typed contract.
- A full run is about 350 requests with no pacing, so 429s show up as inconclusive rows.

## Follow-ups

- **Fix the unsafe row (P2, for `ai-assist-wire-followups`, which owns `schemaKeywords.ts`).**
  Anthropic tools refuses a typeless **root** `input_schema`
  (`400 tools.0.custom.input_schema.type: Field required`). It accepts `{}` in properties and in
  items. Today `anthropicToolsSchemaKeywords.untyped: 'pass'` covers the root too.
  - Reachable through a host-authored client tool whose `parametersSchema` is `JsonSchema.anyValue()`.
  - Reachable through Anthropic forced-tool structured output, which uses the same table, on any
    model but opus-5-5 / fable-5-1 / mythos-5-1 with a root `anyValue()` schema.
  - Not reachable through MCP, whose `inputSchema` must be an object.

  The fix is to refuse an untyped root on that wire: a root-only rule in `adaptSchemaKeywords`, or
  a `untyped: 'pass-nested'` value. This stream does not make the fix, to avoid a collision on
  that file.
- **Conservative rows are not a licence to loosen.** "Accepted" means the request did not 400. It
  does not mean the keyword is honoured. A fold keeps the constraint in front of the model as text;
  a pass to a provider that ignores the keyword loses it. Loosening an entry needs documentation, or
  a probe of enforcement (send a schema the model cannot satisfy without the keyword), not just an
  observed 2xx.
- **After `json-schema-pattern` lands**, add a `pattern` fixture and re-run, per followups decision
  5.
- **The OpenAI-family table is an intersection.** xAI accepts `format: uri` and OpenAI strict
  rejects it. If enforcement is confirmed, per-provider tables would let xAI pass more. That is a
  design question for the orchestrator.

## Live run (2026-10-18)

The user ran it with all four keys: `node bin/testbed.js --scenario wire-probe`, 352 requests
(176 raw and 176 end to end). It exited 1 on the one unsafe row, as designed. The full report is
reproduced verbatim below. The per-request `POST` log lines are omitted; they list the URLs only.

### What it settles

**The three #736 inferences:**

| inference | observed | verdict |
|---|---|---|
| OpenAI and xAI pass a numeric/boolean `enum` | accepted on all four OpenAI-family wires (tools and strict output) | **confirmed** |
| Anthropic tools pass `{}` | accepted in properties and in items; **rejected at the root** (`input_schema.type: Field required`) | **confirmed nested, refuted at root**, which is the unsafe row |
| OpenAI function tools refuse `{}` | OpenAI Responses tools accepted `{}` in properties, in items and at the root | **conservative**. Acceptance is not enforcement (see Follow-ups) |

**The #734 documentation-derived entries:**
- **Anthropic JSON outputs.** The docs' numeric-constraint 400s are reproduced exactly: `minimum`,
  both exclusives, `maximum` and `multipleOf`, each `For 'number' type, property '…' is not
  supported`. So is the `{}` refusal: `Empty schema ({}) … is not supported`. It accepted things
  the docs did not mention or listed as unsupported: `minLength`, `maxLength`, `title`, `examples`,
  and `items: {}`, although it rejects `{}` as a property.
- **OpenAI strict.** It rejected `format: uri` (`'uri' is not a valid format`), which agrees with
  the intersection table. It rejected `{}` (`schema must have a 'type' key`), which agrees. It
  accepted `multipleOf`, `minLength`, `maxLength`, `duration`, `title`, `default` and `examples`,
  all of which we fold.
- **xAI.** It accepted every fixture on both wires, including `format: uri` and a root `{}` on
  strict output.
- **Gemini, both wires.** It agrees on every keyword. The exclusives, `multipleOf` and `examples`
  give `Unknown name … Cannot find field`. A non-string `enum` is rejected as `TYPE_STRING`, so the
  fold is right. It **accepted `{}`** everywhere, including `parameters: {}`, although the Schema
  object documents `type` as required.

**End to end:** every adapted request was accepted, and every refused fixture was refused before
sending, except the unsafe row. There is one inconclusive row: `anthropic-json-outputs/minLength`
end to end returned `Anthropic response contained no text content blocks`. The request was
accepted, and the reply under the 256-token cap had no text. That is a probe limit, not a schema
finding.

### Report

```
=== wire probe: what each provider accepts vs ai-assist's keyword tables ===
wires probed: 8 · skipped: 0
ours: pass = sent as written · adapt = folded, translated or dropped · refuse = not sent
outcome: conservative = we adapt or refuse, the provider accepted the raw schema;
         unsafe = we pass, the provider rejected it

--- Anthropic tools · anthropic · claude-sonnet-5 ---
  fixture                     ours    provider  outcome       end to end
  control                     pass    accepted  agrees        accepted
  minimum                     pass    accepted  agrees        accepted
  exclusiveMinimum-number     pass    accepted  agrees        accepted
  exclusiveMinimum-integer    pass    accepted  agrees        accepted
  maximum                     pass    accepted  agrees        accepted
  exclusiveMaximum-number     pass    accepted  agrees        accepted
  exclusiveMaximum-integer    pass    accepted  agrees        accepted
  multipleOf                  pass    accepted  agrees        accepted
  minLength                   pass    accepted  agrees        accepted
  maxLength                   pass    accepted  agrees        accepted
  format-date-time            pass    accepted  agrees        accepted
  format-uri                  pass    accepted  agrees        accepted
  format-duration             pass    accepted  agrees        accepted
  title                       pass    accepted  agrees        accepted
  default                     pass    accepted  agrees        accepted
  examples                    pass    accepted  agrees        accepted
  enum-integer                pass    accepted  agrees        accepted
  enum-number                 pass    accepted  agrees        accepted
  enum-boolean                pass    accepted  agrees        accepted
  untyped-property            pass    accepted  agrees        accepted
  untyped-items               pass    accepted  agrees        accepted
  untyped-root                pass    rejected  unsafe        rejected (UNSAFE)
  provider text:
    untyped-root (raw): 400 tools.0.custom.input_schema.type: Field required
    untyped-root (end to end): 400 tools.0.custom.input_schema.type: Field required

--- Anthropic JSON outputs · anthropic · claude-opus-5-5 ---
  fixture                     ours    provider  outcome       end to end
  control                     pass    accepted  agrees        accepted
  minimum                     adapt   rejected  agrees        accepted
  exclusiveMinimum-number     adapt   rejected  agrees        accepted
  exclusiveMinimum-integer    adapt   rejected  agrees        accepted
  maximum                     adapt   rejected  agrees        accepted
  exclusiveMaximum-number     adapt   rejected  agrees        accepted
  exclusiveMaximum-integer    adapt   rejected  agrees        accepted
  multipleOf                  adapt   rejected  agrees        accepted
  minLength                   adapt   accepted  conservative  ? (INCONCLUSIVE)
  maxLength                   adapt   accepted  conservative  accepted
  format-date-time            pass    accepted  agrees        accepted
  format-uri                  pass    accepted  agrees        accepted
  format-duration             pass    accepted  agrees        accepted
  title                       adapt   accepted  conservative  accepted
  default                     pass    accepted  agrees        accepted
  examples                    adapt   accepted  conservative  accepted
  enum-integer                pass    accepted  agrees        accepted
  enum-number                 pass    accepted  agrees        accepted
  enum-boolean                pass    accepted  agrees        accepted
  untyped-property            refuse  rejected  agrees        refused here
  untyped-items               refuse  accepted  conservative  refused here
  untyped-root                refuse  rejected  agrees        refused here
  provider text:
    minimum (raw): 400 output_config.format.schema: For 'number' type, property 'minimum' is not supported
    exclusiveMinimum-number (raw): 400 output_config.format.schema: For 'number' type, property 'exclusiveMinimum' is not supported
    exclusiveMinimum-integer (raw): 400 output_config.format.schema: For 'integer' type, property 'exclusiveMinimum' is not supported
    maximum (raw): 400 output_config.format.schema: For 'number' type, property 'maximum' is not supported
    exclusiveMaximum-number (raw): 400 output_config.format.schema: For 'number' type, property 'exclusiveMaximum' is not supported
    exclusiveMaximum-integer (raw): 400 output_config.format.schema: For 'integer' type, property 'exclusiveMaximum' is not supported
    multipleOf (raw): 400 output_config.format.schema: For 'number' type, property 'multipleOf' is not supported
    minLength (end to end): Anthropic response contained no text content blocks
    untyped-property (raw): 400 output_config.format.schema: Empty schema ({}) that accepts any JSON value is not supported. Please specify a concrete type.
    untyped-root (raw): 400 output_config.format.schema: Empty schema ({}) that accepts any JSON value is not supported. Please specify a concrete type.

--- OpenAI Responses tools · openai · gpt-5.4-nano ---
  fixture                     ours    provider  outcome       end to end
  control                     pass    accepted  agrees        accepted
  minimum                     pass    accepted  agrees        accepted
  exclusiveMinimum-number     pass    accepted  agrees        accepted
  exclusiveMinimum-integer    pass    accepted  agrees        accepted
  maximum                     pass    accepted  agrees        accepted
  exclusiveMaximum-number     pass    accepted  agrees        accepted
  exclusiveMaximum-integer    pass    accepted  agrees        accepted
  multipleOf                  adapt   accepted  conservative  accepted
  minLength                   adapt   accepted  conservative  accepted
  maxLength                   adapt   accepted  conservative  accepted
  format-date-time            pass    accepted  agrees        accepted
  format-uri                  adapt   accepted  conservative  accepted
  format-duration             adapt   accepted  conservative  accepted
  title                       adapt   accepted  conservative  accepted
  default                     adapt   accepted  conservative  accepted
  examples                    adapt   accepted  conservative  accepted
  enum-integer                pass    accepted  agrees        accepted
  enum-number                 pass    accepted  agrees        accepted
  enum-boolean                pass    accepted  agrees        accepted
  untyped-property            refuse  accepted  conservative  refused here
  untyped-items               refuse  accepted  conservative  refused here
  untyped-root                refuse  accepted  conservative  refused here

--- OpenAI strict structured output · openai · gpt-5.4-nano ---
  fixture                     ours    provider  outcome       end to end
  control                     pass    accepted  agrees        accepted
  minimum                     pass    accepted  agrees        accepted
  exclusiveMinimum-number     pass    accepted  agrees        accepted
  exclusiveMinimum-integer    pass    accepted  agrees        accepted
  maximum                     pass    accepted  agrees        accepted
  exclusiveMaximum-number     pass    accepted  agrees        accepted
  exclusiveMaximum-integer    pass    accepted  agrees        accepted
  multipleOf                  adapt   accepted  conservative  accepted
  minLength                   adapt   accepted  conservative  accepted
  maxLength                   adapt   accepted  conservative  accepted
  format-date-time            pass    accepted  agrees        accepted
  format-uri                  adapt   rejected  agrees        accepted
  format-duration             adapt   accepted  conservative  accepted
  title                       adapt   accepted  conservative  accepted
  default                     adapt   accepted  conservative  accepted
  examples                    adapt   accepted  conservative  accepted
  enum-integer                pass    accepted  agrees        accepted
  enum-number                 pass    accepted  agrees        accepted
  enum-boolean                pass    accepted  agrees        accepted
  untyped-property            refuse  rejected  agrees        refused here
  untyped-items               refuse  rejected  agrees        refused here
  untyped-root                refuse  rejected  agrees        refused here
  provider text:
    format-uri (raw): 400 Invalid schema for response_format 'response': In context=('properties', 'v'), 'uri' is not a valid format.
    untyped-property (raw): 400 Invalid schema for response_format 'response': In context=('properties', 'v'), schema must have a 'type' key.
    untyped-items (raw): 400 Invalid schema for response_format 'response': In context=('properties', 'v', 'items'), schema must have a 'type' key.
    untyped-root (raw): 400 Invalid schema for response_format 'response': In context=(), 'additionalProperties' is required to be supplied and to be false.

--- Gemini function declarations · google-gemini · gemini-3.5-flash-lite ---
  fixture                     ours    provider  outcome       end to end
  control                     pass    accepted  agrees        accepted
  minimum                     pass    accepted  agrees        accepted
  exclusiveMinimum-number     adapt   rejected  agrees        accepted
  exclusiveMinimum-integer    adapt   rejected  agrees        accepted
  maximum                     pass    accepted  agrees        accepted
  exclusiveMaximum-number     adapt   rejected  agrees        accepted
  exclusiveMaximum-integer    adapt   rejected  agrees        accepted
  multipleOf                  adapt   rejected  agrees        accepted
  minLength                   pass    accepted  agrees        accepted
  maxLength                   pass    accepted  agrees        accepted
  format-date-time            pass    accepted  agrees        accepted
  format-uri                  pass    accepted  agrees        accepted
  format-duration             pass    accepted  agrees        accepted
  title                       pass    accepted  agrees        accepted
  default                     pass    accepted  agrees        accepted
  examples                    adapt   rejected  agrees        accepted
  enum-integer                adapt   rejected  agrees        accepted
  enum-number                 adapt   rejected  agrees        accepted
  enum-boolean                adapt   rejected  agrees        accepted
  untyped-property            refuse  accepted  conservative  refused here
  untyped-items               refuse  accepted  conservative  refused here
  untyped-root                refuse  accepted  conservative  refused here
  provider text:
    exclusiveMinimum-number (raw): 400 Invalid JSON payload received. Unknown name "exclusiveMinimum" at 'tools[0].function_declarations[0].parameters.properties[0].value': Cannot find field.
    exclusiveMinimum-integer (raw): 400 Invalid JSON payload received. Unknown name "exclusiveMinimum" at 'tools[0].function_declarations[0].parameters.properties[0].value': Cannot find field.
    exclusiveMaximum-number (raw): 400 Invalid JSON payload received. Unknown name "exclusiveMaximum" at 'tools[0].function_declarations[0].parameters.properties[0].value': Cannot find field.
    exclusiveMaximum-integer (raw): 400 Invalid JSON payload received. Unknown name "exclusiveMaximum" at 'tools[0].function_declarations[0].parameters.properties[0].value': Cannot find field.
    multipleOf (raw): 400 Invalid JSON payload received. Unknown name "multipleOf" at 'tools[0].function_declarations[0].parameters.properties[0].value': Cannot find field.
    examples (raw): 400 Invalid JSON payload received. Unknown name "examples" at 'tools[0].function_declarations[0].parameters.properties[0].value': Cannot find field.
    enum-integer (raw): 400 Invalid value at 'tools[0].function_declarations[0].parameters.properties[0].value.enum[0]' (TYPE_STRING), 1
Invalid value at 'tools[0].function_declarations[0].parameters.properties[0].value.enum[1]' (TYPE_STRING), 2
Invalid value at 'tools[0].function_declarations[0].parameters.properties[0].value…
    enum-number (raw): 400 Invalid value at 'tools[0].function_declarations[0].parameters.properties[0].value.enum[0]' (TYPE_STRING), 0.5
Invalid value at 'tools[0].function_declarations[0].parameters.properties[0].value.enum[1]' (TYPE_STRING), 1.5
    enum-boolean (raw): 400 Invalid value at 'tools[0].function_declarations[0].parameters.properties[0].value.enum[0]' (TYPE_STRING), true

--- Gemini responseSchema · google-gemini · gemini-3.5-flash-lite ---
  fixture                     ours    provider  outcome       end to end
  control                     pass    accepted  agrees        accepted
  minimum                     pass    accepted  agrees        accepted
  exclusiveMinimum-number     adapt   rejected  agrees        accepted
  exclusiveMinimum-integer    adapt   rejected  agrees        accepted
  maximum                     pass    accepted  agrees        accepted
  exclusiveMaximum-number     adapt   rejected  agrees        accepted
  exclusiveMaximum-integer    adapt   rejected  agrees        accepted
  multipleOf                  adapt   rejected  agrees        accepted
  minLength                   pass    accepted  agrees        accepted
  maxLength                   pass    accepted  agrees        accepted
  format-date-time            pass    accepted  agrees        accepted
  format-uri                  pass    accepted  agrees        accepted
  format-duration             pass    accepted  agrees        accepted
  title                       pass    accepted  agrees        accepted
  default                     pass    accepted  agrees        accepted
  examples                    adapt   rejected  agrees        accepted
  enum-integer                adapt   rejected  agrees        accepted
  enum-number                 adapt   rejected  agrees        accepted
  enum-boolean                adapt   rejected  agrees        accepted
  untyped-property            refuse  accepted  conservative  refused here
  untyped-items               refuse  accepted  conservative  refused here
  untyped-root                refuse  accepted  conservative  refused here
  provider text:
    exclusiveMinimum-number (raw): 400 Invalid JSON payload received. Unknown name "exclusiveMinimum" at 'generation_config.response_schema.properties[0].value': Cannot find field.
    exclusiveMinimum-integer (raw): 400 Invalid JSON payload received. Unknown name "exclusiveMinimum" at 'generation_config.response_schema.properties[0].value': Cannot find field.
    exclusiveMaximum-number (raw): 400 Invalid JSON payload received. Unknown name "exclusiveMaximum" at 'generation_config.response_schema.properties[0].value': Cannot find field.
    exclusiveMaximum-integer (raw): 400 Invalid JSON payload received. Unknown name "exclusiveMaximum" at 'generation_config.response_schema.properties[0].value': Cannot find field.
    multipleOf (raw): 400 Invalid JSON payload received. Unknown name "multipleOf" at 'generation_config.response_schema.properties[0].value': Cannot find field.
    examples (raw): 400 Invalid JSON payload received. Unknown name "examples" at 'generation_config.response_schema.properties[0].value': Cannot find field.
    enum-integer (raw): 400 Invalid value at 'generation_config.response_schema.properties[0].value.enum[0]' (TYPE_STRING), 1
Invalid value at 'generation_config.response_schema.properties[0].value.enum[1]' (TYPE_STRING), 2
Invalid value at 'generation_config.response_schema.properties[0].value.enum[2]' (TYPE_STRING), 3
    enum-number (raw): 400 Invalid value at 'generation_config.response_schema.properties[0].value.enum[0]' (TYPE_STRING), 0.5
Invalid value at 'generation_config.response_schema.properties[0].value.enum[1]' (TYPE_STRING), 1.5
    enum-boolean (raw): 400 Invalid value at 'generation_config.response_schema.properties[0].value.enum[0]' (TYPE_STRING), true

--- xAI Responses tools · xai-grok · grok-4.3 ---
  fixture                     ours    provider  outcome       end to end
  control                     pass    accepted  agrees        accepted
  minimum                     pass    accepted  agrees        accepted
  exclusiveMinimum-number     pass    accepted  agrees        accepted
  exclusiveMinimum-integer    pass    accepted  agrees        accepted
  maximum                     pass    accepted  agrees        accepted
  exclusiveMaximum-number     pass    accepted  agrees        accepted
  exclusiveMaximum-integer    pass    accepted  agrees        accepted
  multipleOf                  adapt   accepted  conservative  accepted
  minLength                   adapt   accepted  conservative  accepted
  maxLength                   adapt   accepted  conservative  accepted
  format-date-time            pass    accepted  agrees        accepted
  format-uri                  adapt   accepted  conservative  accepted
  format-duration             adapt   accepted  conservative  accepted
  title                       adapt   accepted  conservative  accepted
  default                     adapt   accepted  conservative  accepted
  examples                    adapt   accepted  conservative  accepted
  enum-integer                pass    accepted  agrees        accepted
  enum-number                 pass    accepted  agrees        accepted
  enum-boolean                pass    accepted  agrees        accepted
  untyped-property            refuse  accepted  conservative  refused here
  untyped-items               refuse  accepted  conservative  refused here
  untyped-root                refuse  accepted  conservative  refused here

--- xAI strict structured output · xai-grok · grok-4.3 ---
  fixture                     ours    provider  outcome       end to end
  control                     pass    accepted  agrees        accepted
  minimum                     pass    accepted  agrees        accepted
  exclusiveMinimum-number     pass    accepted  agrees        accepted
  exclusiveMinimum-integer    pass    accepted  agrees        accepted
  maximum                     pass    accepted  agrees        accepted
  exclusiveMaximum-number     pass    accepted  agrees        accepted
  exclusiveMaximum-integer    pass    accepted  agrees        accepted
  multipleOf                  adapt   accepted  conservative  accepted
  minLength                   adapt   accepted  conservative  accepted
  maxLength                   adapt   accepted  conservative  accepted
  format-date-time            pass    accepted  agrees        accepted
  format-uri                  adapt   accepted  conservative  accepted
  format-duration             adapt   accepted  conservative  accepted
  title                       adapt   accepted  conservative  accepted
  default                     adapt   accepted  conservative  accepted
  examples                    adapt   accepted  conservative  accepted
  enum-integer                pass    accepted  agrees        accepted
  enum-number                 pass    accepted  agrees        accepted
  enum-boolean                pass    accepted  agrees        accepted
  untyped-property            refuse  accepted  conservative  refused here
  untyped-items               refuse  accepted  conservative  refused here
  untyped-root                refuse  accepted  conservative  refused here

=== summary ===
agrees 124 · conservative 51 · unsafe 1 · inconclusive 0
UNSAFE (raw): anthropic-tools/untyped-root
UNSAFE (end to end): anthropic-tools/untyped-root
end-to-end mismatches: none
conservative (a table entry that could be loosened): anthropic-json-outputs/minLength, anthropic-json-outputs/maxLength, anthropic-json-outputs/title, anthropic-json-outputs/examples, anthropic-json-outputs/untyped-items, openai-tools/multipleOf, openai-tools/minLength, openai-tools/maxLength, openai-tools/format-uri, openai-tools/format-duration, openai-tools/title, openai-tools/default, openai-tools/examples, openai-tools/untyped-property, openai-tools/untyped-items, openai-tools/untyped-root, openai-strict-output/multipleOf, openai-strict-output/minLength, openai-strict-output/maxLength, openai-strict-output/format-duration, openai-strict-output/title, openai-strict-output/default, openai-strict-output/examples, gemini-tools/untyped-property, gemini-tools/untyped-items, gemini-tools/untyped-root, gemini-response-schema/untyped-property, gemini-response-schema/untyped-items, gemini-response-schema/untyped-root, xai-tools/multipleOf, xai-tools/minLength, xai-tools/maxLength, xai-tools/format-uri, xai-tools/format-duration, xai-tools/title, xai-tools/default, xai-tools/examples, xai-tools/untyped-property, xai-tools/untyped-items, xai-tools/untyped-root, xai-strict-output/multipleOf, xai-strict-output/minLength, xai-strict-output/maxLength, xai-strict-output/format-uri, xai-strict-output/format-duration, xai-strict-output/title, xai-strict-output/default, xai-strict-output/examples, xai-strict-output/untyped-property, xai-strict-output/untyped-items, xai-strict-output/untyped-root

1 unsafe row(s): anthropic-tools/untyped-root
```

The multi-line Gemini entries above are as printed by that run. The probe now joins line breaks
with ` | ` so each entry stays on one indented line.

## Gates

Logs are in `../gate-logs-testbed-wire-probe/` (worktree-relative), graded by grep.

| gate | result |
|---|---|
| `ts-extras` `heft build --clean` | exit 0, 0 warnings (after the api.md update) |
| `ts-extras` `heft test --clean` | pass, 100% on all four metrics |
| `ts-extras` eslint (touched files) | exit 0 |
| testbed `heft build --clean` | exit 0, 0 warnings |
| testbed `heft test --clean` | pass, 100% on all four metrics |
| testbed `lint` | exit 0 |
| repo-wide `install-run-rush.js rebuild` | exit 0 in 4m40s; 0 `not met`/`FAILURE`/`Operations failed`/`error TS`; 1 warning, the git-symlink notice |
| `change --verify --target-branch origin/integration/asks` | pass |
| `verify-capability-docs`, `generate-capability-feed --check` | pass |

## Review round 1 (orchestrator)

A ref-only deep review found one P1. The orchestrator applied it along with the cheap P2 and P3 fixes:
- **P1.** A fixture the table refuses, which `ai-assist` sent anyway and the provider then rejected, was classified `mismatch`. That is a request we send that fails, so it is now `unsafe` and fails the run (`classifyEndToEnd`; test updated).
- **P2.** The live seams are now a top-of-file import. The dynamic import had no reason to exist: `live.ts` reaches only `@fgv/ts-extras` and the global `fetch`.
- **P2.** The `live.ts` coverage-exclusion comment no longer claims the functions only reach the network. It says their event drain and error text are checked only by a live run.
- **P3.**
  - `IWireProbeDeps` members are method signatures.
  - A raw request is bounded at 60 s via `AbortSignal.timeout`.
  - The duplicate "after `json-schema-pattern`" follow-up is removed.
- **Owner of the unsafe row.** It is fixed in the `ai-assist-wire-followups` stream; see the brief on that branch, § Decisions 4. The `pattern` fixture is in the `json-schema-pattern` brief's acceptance.
- **Not applied (P3).** Four single imperative `isFailure` guards, each acceptable per the review, and a missing `state.md`.
