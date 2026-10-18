# Result: `testbed-wire-probe`

**Shipped:** a `wire-probe` testbed scenario that sends fixture schemas unadapted to each configured provider wire, classifies every row against the `ai-assist` keyword table as agrees / conservative / unsafe, and confirms each adapted request end to end — plus two additive `ts-extras` exports it needed.

Branch `testbed-wire-probe`, from `integration/asks` at `59f06b939` (brief commit; `integration/asks`
had nothing newer to merge). Commits: `ce69cfed` (ts-extras), `1b9ce0e2` (testbed), and the
close-out commit. PR: `#TBD`.

**No live run was made.** This session had no provider keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
`GEMINI_API_KEY`/`GOOGLE_API_KEY` and `XAI_API_KEY` were all unset). Every result below is from unit
tests over synthetic responses. The #736 inferences are therefore **still inferences**; the first
live run is what turns them into observations.

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

- **Run it live** with all four keys and paste the report here or into the next stream. Watch three
  rows in particular: `openai-tools` / `xai-tools` `untyped-*` (an inferred refuse), the `enum-*`
  rows on OpenAI and xAI (an inferred pass), and `anthropic-tools` `untyped-*` (an inferred pass,
  including `{}` as the whole `input_schema`).
- **After `json-schema-pattern` lands**, add a `pattern` fixture and re-run, per followups decision
  5.

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
