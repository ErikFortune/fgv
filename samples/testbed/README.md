# @fgv/testbed

**Status:** Active — two scenarios shipped (B-3 local-classifier-safety, B-4a local-embedding-search);
shell wired to run them (B-5). See `.ai/tasks/active/local-ai-exploration/brief.md` for the cluster contract.

Long-lived sample browser app + companion CLI showcasing fgv capabilities. Scenarios are
first-class entities: a scenario module declares metadata (id, title, category, tags), an
optional web React component, and/or an optional CLI `run` function. The shell composes
`@fgv/ts-app-shell` primitives — sidebar list + main scenario host + collapsible status bar
at the bottom.

## Quick start

```bash
# build the library code (heft)
rushx build

# run the unit tests with full coverage
rushx test

# build the browser bundle
rushx build:web

# launch the dev server
rushx dev

# list the available CLI scenarios (bare invocation)
rushx cli

# rebuild the generated data tree from data/
rushx build:data
```

## Running scenarios

A scenario can expose a **web** surface (a React component in the browser app), a **CLI**
surface (a `run` function), or both. Run them two ways:

### CLI

The CLI shim is `bin/testbed.js` (also wired as `rushx cli`). Build first (`rushx build`),
then:

```bash
# list every scenario with its id and which surfaces it has
node bin/testbed.js
node bin/testbed.js --help          # usage banner

# run a single scenario by id
node bin/testbed.js --scenario sqlite-vec-fragment-persistence
node bin/testbed.js --scenario sqlite-vec-memory-persistence
```

`rushx cli` runs the same shim (`rushx cli` to list; `rushx cli -- --scenario <id>` to pass
flags through). Structured output goes to stdout; scenario diagnostics go to stderr.

### Web

```bash
rushx dev            # webpack dev server — pick scenarios from the sidebar
rushx build:web      # production bundle into dist-web/
```

Only scenarios with a web surface appear in the sidebar.

### Two things to know

- **Some scenarios are CLI-only.** Any scenario that uses a Node-native dependency —
  `better-sqlite3` (the `sqlite-vec-*` scenarios) or the local ONNX runtime (the `local-*`
  scenarios) — loads it via a `webpackIgnore` dynamic import so it never enters the browser
  bundle. Those scenarios therefore have **no web surface** and run only under
  `--scenario <id>`.
- **Live-model scenarios need network.** Scenarios that embed/classify/summarize with a local
  `@huggingface/transformers` model (`Xenova/*`) download the model from `huggingface.co` on
  first run and cache it. In a network-restricted environment that fetch is blocked and the
  scenario fails at model load (`Forbidden access to huggingface.co`); run them where
  `huggingface.co` is reachable. The **unit tests** stub the model with a deterministic
  embedder, so `rushx test` covers the real logic (including the actual file-backed
  `sqlite-vec` round-trip) fully offline.

## Provider wire probe (`wire-probe`)

Checks the keyword-capability tables `ai-assist` adapts JSON Schemas with (`schemaKeywords.ts` in
`@fgv/ts-extras`) against what each provider actually accepts. For each configured wire —
Anthropic tools and JSON outputs, OpenAI and xAI Responses tools and strict structured output,
Gemini function declarations and `responseSchema` — it sends ~24 fixture schemas (every
constraint keyword, every annotation, numeric and boolean enums, `{}` at the root, in properties
and in items, and `pattern` twice: from a host `RegExp` through `stringOptions`, and through
`fromJson` with an injected `patternValidator`) **unadapted**, records accept/reject with the
provider's error text, and compares that with the table:

| outcome        | means                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `agrees`       | the table matches the provider                                                                                                        |
| `conservative` | we fold or refuse, the provider accepted the raw schema. Accepted is not enforced, so this alone does not justify loosening the entry |
| `unsafe`       | we pass, the provider rejected it                                                                                                     |

It then sends each fixture **through** `ai-assist` and confirms the adapted request is accepted
(or, where the table refuses, that it is refused before anything is sent). An adapted request the
provider rejects is also `unsafe`. The CLI exits non-zero **only** on an unsafe row; the report is
on stdout when there is none, and on stderr with the failure when there is.

Live keys, on demand, **never in CI**. Keys resolve the usual way (KeyStore, then
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` / `GOOGLE_API_KEY`, `XAI_API_KEY`); a wire
whose provider has no key is skipped and the report says so. Keys are never logged.

```bash
rushx build
ANTHROPIC_API_KEY=… GEMINI_API_KEY=… node bin/testbed.js --scenario wire-probe

# a subset of wires (ids: anthropic-tools, anthropic-json-outputs, openai-tools,
# openai-strict-output, gemini-tools, gemini-response-schema, xai-tools, xai-strict-output)
WIRE_PROBE_WIRES=anthropic-tools,xai-tools node bin/testbed.js --scenario wire-probe
```

Each request is one turn on the cheapest model of each line (a 16-token cap raw, 256 end to end);
the models and why are in `src/scenarios/wireProbe/wires.ts`. A wire whose control fixture (no
keyword under test) is not accepted is reported as inconclusive — usually a bad key or a retired
model. Re-run it whenever a table entry or a provider's schema support changes.

## Model-tier canaries (`<provider>-model-tiers`)

`openai-model-tiers`, `anthropic-model-tiers`, `google-gemini-model-tiers` and `xai-grok-model-tiers`
resolve each provider's `base` / `advanced` / `frontier` tiers offline and log every `alias ->
concrete` hop. With the provider key set they also fire one tiny completion per tier, plus the
probes each scenario opts into. Without a key every live row is `PENDING` and the verdict is the
STOP-FLAG state (`RESOLVER-VERIFIED; LIVE CANARY PENDING`). Keyless rows still state the outcome
they expect, so a keyless run doubles as the list of what the keyed run will check.

```bash
rushx build
ANTHROPIC_API_KEY=… node bin/testbed.js --scenario anthropic-model-tiers
OPENAI_API_KEY=…    node bin/testbed.js --scenario openai-model-tiers
GEMINI_API_KEY=…    node bin/testbed.js --scenario google-gemini-model-tiers
XAI_API_KEY=…       node bin/testbed.js --scenario xai-grok-model-tiers
```

Most rows pass as `PASS`. Three more outcomes are passes too, because the probe stated them up front,
and one row kind makes no claim at all:

| tag                   | means                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[REFUSED-LOCALLY]`   | ai-assist refused the request before building it, so nothing was sent (a `temperature` the model rejects, or `'none'` with `onUnsupported: 'fail'` on a thinking-required model) |
| `[EXPECTED-REJECT]`   | the provider returned the 400 the probe expected, for the expected reason (a raw thinking-off value on a thinking-required model; a raw `0.3` beside an effort on `gpt-6-luna`). The row prints the provider's own text; a 400 for another reason is a `FAIL`                    |
| `[NO-RECORDED-LIMIT]` | a max-output probe on a model with no `maxOutputTokens` entry: nothing to check, no call                                                                                         |
| `[OBSERVED]`          | report-only: the answer is not known yet, so the row prints `accepted` or `rejected: <provider text>` and neither passes nor fails |

The probe families:

- **Thinking** (`effort=none` / `effort=low`, on every tier and extra model): `'none'` on a
  thinking-required model is sent as `'low'`; elsewhere it turns thinking off (on Anthropic,
  `thinking: {type: 'disabled'}`, or the model's own value — `between_tools` on `claude-sonnet-5-5`).
  Both must answer.
- **Strict none** (`none+fail`): refused locally on a thinking-required model, answered on any other.
  Each thinking-required model, and each model with its own off value, also gets a `none raw` row
  that bypasses the library, sends the provider's default off value, and must be the provider's 400.
  A raw row that answers means the `thinkingRequiredModelPrefixes` (or `anthropicThinkingOffTypes`)
  entry is stale. `gemini-3.8-flash` (the Gemini base tier) is not thinking-required — budget 0 turns
  its thinking off — so its `effort=none` is sent with thinking off, its `none+fail` passes, and it
  gets no raw row.
- **Temperature** (`temp=…`, Anthropic and OpenAI): each row names its expected outcome. Anthropic
  accepts `1` with and without thinking and refuses `0.3` locally. OpenAI's `gpt-6-luna` restricts
  temperature only while it reasons: `0.3` with effort `'none'` and `1` with no effort or beside
  effort `low` answer,
  and `0.3` with no effort (luna defaults to `medium`) or beside effort `low` is refused locally. One
  more luna row (`[EXPECTED-REJECT] base temp=0.3+effort=low raw`) sends `0.3` past the library's
  gate and must be the provider's "Only the default (1) value is supported" 400; if it answers, the
  `samplingParamsRejectedWithThinkingModelPrefixes` entry is stale. On `gpt-6.1-sol` and
  `gpt-6-astra` OpenAI accepts `1` with and without effort `low` (`temp=1`, `temp=1+effort=low`,
  sent through the library) and refuses `0.3` locally.
- **Max output** (`max=N`, Anthropic, OpenAI and Gemini): `maxTokens` set to
  `resolveMaxOutputTokens` for that exact model. It must be accepted. A refusal naming the token cap
  is `FAIL(param)`: the recorded limit is too high.

`[REFUSED-LOCALLY]` rows prove ai-assist's own gate: nothing is sent, so they say nothing about
whether the provider would still reject the value.

A `FAIL` on any row fails the run. `BLOCKED` (access or a parameter incompatibility) does not.

## Adding a scenario

See [`src/conventions.md`](./src/conventions.md). Short version: drop a file under
`src/scenarios/`, append it to the registry in `src/scenarios/index.ts`, and write tests.

## Layout

```
src/
  cli.ts                 # CLI entry (orchestration glue c8-ignored)
  shell/                 # IScenario contract + IScenarioContext plumbing
    index.ts
    secretResolver.ts
  scenarios/             # one file per scenario, registered manually in index.ts
    index.ts
  web/
    App.tsx              # composed shell — testable
    index.tsx            # ReactDOM mount — c8-ignored
  generated/             # checked-in build-data.ts output
    dataFileTree.ts
data/                    # source YAML/JSON consumed by scripts/build-data.ts
scripts/
  build-data.ts          # manually invoked via `rushx build:data`
bin/
  testbed.js             # CLI shim invoked by package.json `bin`
```

## Scenarios

The scenario registry grows over time, so rather than duplicate it here (and let it drift),
list the current set — with ids and which surfaces each exposes — straight from the CLI:

```bash
node bin/testbed.js        # or: rushx cli
```

The registry itself is [`src/scenarios/index.ts`](./src/scenarios/index.ts).

## Cluster context

This package is part of the `local-ai-exploration` orchestrator cluster.
Phase B-1 scaffolded the shell; B-2 populated the transformer facades;
B-3 added the classifier-safety scenario; B-4a added the embedding-search scenario;
B-5 wired the shell and CLI to actually run them.
The testbed keeps growing scenarios over time.
