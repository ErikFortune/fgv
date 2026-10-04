# @fgv/ts-extras-system-one

A Result-integration boundary over [`@typesafe-ai/sdk`](https://www.npmjs.com/package/@typesafe-ai/sdk)
for **System-1 decision servers**: servers that answer named questions about a state with a
probability distribution over a closed candidate set, instead of generated text. The wire is
`POST /v1/systemone`, which three servers speak:

- [CLM](https://pypi.org/project/contrastive-lm/) (`clm-serve`, Apache-2.0, Qwen3-8B on vLLM);
- [openjev](https://github.com/razorback16/openjev), including its hosted Codiv endpoint;
- TypeSafe's hosted Jev.

The backend is chosen by `baseUrl` and `model` at the composition root. There is no fgv interface
over the backends: one HTTP client is the only implementation, and the servers do not behave alike.

Node ≥ 20 only.

> **Live status.** No live round trip has been run against any server by this package's tests or
> its author. The unit tests run the real SDK through its `fetch` seam against recorded CLM- and
> Jev-shaped bodies. Wire compatibility with a real server is established only by a recorded run
> of `perf/systemOneLive.js probe` (see [Live checks](#live-checks)).

## Usage

```ts
import { askSystemOne, choice, createSystemOneClient, noul, score } from '@fgv/ts-extras-system-one';

const client = createSystemOneClient({
  baseUrl: 'http://127.0.0.1:8700', // a local clm-serve
  model: 'clm-latest',
  apiKey: '' // keyless local server; see below
}).orThrow();

const answer = await askSystemOne(client, {
  state: 'I was charged twice this month.',
  questions: {
    billing: noul('Is this about billing?'),
    route: choice('Which team?', { billing: 'The billing team', tech: 'Technical support' }),
    urgency: score('How urgent is it?', ['Not urgent', 'Somewhat urgent', 'Very urgent'])
  },
  inputLimit: { maxChars: 2400 } // required: there is no default
});

if (answer.isSuccess()) {
  answer.value.result.answers.route.probabilities.billing; // number, typed from the question
  answer.value.meta.elapsedMs;
} else {
  answer.detail; // 'input-over-limit' | 'invalid-request' | 'unauthorized' | ...
}
```

## Primitives

| export | returns |
|---|---|
| `createSystemOneClient({ baseUrl, model, apiKey, timeoutMs?, retry?, logger?, fetch? })` | `Result<ISystemOneClient>` |
| `askSystemOne(client, { state, questions, inputLimit, signal? })` | `Promise<DetailedResult<ISystemOneAnswer<Q>, SystemOneFailureReason>>` |
| `listSystemOneModels(client)` | `Promise<Result<ReadonlyArray<ModelCard>>>` |
| `measureSystemOneInput(state, questions)` | `Result<ISystemOneInputMeasure>`: the lengths the input bound compares, so a caller can size a budget; malformed input fails rather than throws |
| `noul`, `choice`, `score` | the SDK's own question builders, re-exported |

`askSystemOne` runs, in order: the input bound; the call; failure classification; validation of the
response against the request's own questions; and projection. Each step can fail, and nothing after a
failure runs.

- **Validation.** The answer ids must equal the question ids, each with its question's type. `choice`
  and `score` probability keys must equal the labels or `0`…`n-1`, every probability must be a
  finite number in `[0, 1]`, and each distribution must sum to 1 within `1e-3`. A `score` must be in
  `[0, n-1]`, a `noul` in `[0, 1]`. A server can return a well-formed answer to a different set of
  questions; that is `invalid-response`. Not checked, deliberately: that `choice` is the argmax or
  `score` the expectation, since the boundary promises the wire, not a backend's semantics.
- **`confidence` is never returned.** CLM and openjev define it differently, even over the same
  weights, and Jev's definition is unknown. Both known definitions are functions of `probabilities`,
  so compute whichever you want from those and name it in your own code.
- **`meta`** carries the answering `model`, `usage` (with `billing_units` when the server sends it),
  `elapsedMs` (client wall time, including retries), `requestId` (from `x-typesafe-request-id`) and
  `timingHeaders` (`server-timing` and/or `x-clm-latency-ms`, unparsed). Nothing aggregates them.

### Failure reasons

Classified by the SDK's error class and the HTTP status, never by body text, which differs between
backends.

| reason | when |
|---|---|
| `input-over-limit` | the input bound refused; no request was made |
| `invalid-request` | an invalid `maxChars`; the SDK refused the questions before sending; or any 4xx not below (400, 404, CLM's 422 for an unknown model, openjev's `400 api_usage_error`) |
| `unauthorized` | 401 or 403 |
| `rate-limited` | 429 |
| `timeout` | a per-attempt timeout, or a 408 |
| `server` | any 5xx (including CLM's 502 when its encoder is down, and openjev's 529), or another non-2xx |
| `connection` | the request could not be delivered |
| `aborted` | the caller's `AbortSignal` fired |
| `invalid-response` | a 2xx whose body fails validation, including a non-JSON or empty body |

The message carries the status and the request id when there are any. **It never quotes the
server's body**: the SDK builds an HTTP error's message from the response body, and a server may
echo the request (state included), so a non-2xx failure names only the error class (for example
`UnprocessableEntityError`), and a 2xx failure names the fields and question ids at fault, never a
received value. A malformed request (missing or mis-shaped `criteria`, no `inputLimit`, a state that
cannot be serialized) is `invalid-request`; `askSystemOne` never rejects. Retries are the SDK's own
policy (by default 2 retries on 408, 429, 5xx, connection errors and timeouts), passed through
unchanged; `timeoutMs` is per attempt.

## The input bound

**Upstream CLM silently drops the question from an over-long state.** `clm-serve` truncates every
text to `--max-tokens` (default 2,048) and reports nothing; the state is embedded as context
followed by the question, and the tokenizer keeps the first tokens. So this package **refuses, and
never truncates**, at a bound the caller must declare:

- `inputLimit: { maxChars: n }` measures, per question, the state plus 2 (CLM's `"\n\n"`) plus the
  instructions, and **each candidate text separately**: a `choice` description (or its label when it
  has none), a `score` level, and a `noul` outcome's `"true: "` / `"false: "` plus its description,
  or plus `"Yes. This is true: "` / `"No. This is false: "` and the instructions when it has none.
  A structured state or description is measured by its JSON serialization. Over the limit, the call
  fails `input-over-limit`, naming the question, the part and the length, and nothing is sent.
- `inputLimit: 'unchecked'` sends without measuring. It is correct only for a backend known to
  refuse an over-long input rather than truncate it.
- Omitting `inputLimit` is a compile error, so every call site's posture can be found with one grep.
  It is a per-call argument, not client configuration, so development refuses exactly what
  production refuses.

**Characters are a proxy for tokens, not a guarantee.** The ratio varies with the content and with
each backend's tokenizer. No number is a default in code.

### Choosing `maxChars` for upstream CLM

The rule is **`maxChars = floor(B × r × 0.9)`**:

- `B` is the server's token bound: `clm-serve --max-tokens`, default 2,048, which must not exceed the
  encoder's `--max-model-len`.
- `r` is the **minimum**, not the median, characters per token over 4,000-character windows of
  representative states, with the backend's own tokenizer. The failure being prevented is a silent
  loss of the question, so the bound has to hold for the worst window.
- `0.9` is the margin. It covers the gap between this measurement and the real tokenizer, and drift
  between the measured corpus and production. It does not cover a content class that was never
  measured; measuring your own states does.

Qwen3-8B characters per token, measured over 4,000-character windows (388 windows; a **derived**
measurement: the tokenizer was rebuilt from Qwen3-8B's own `vocab.json` and `merges.txt` with
transformers 4.55.0, slow and fast tokenizers agreeing on every window, but not confirmed against a
deployed encoder):

| content | corpus | minimum | median |
|---|---|---|---|
| English prose | design-doc paragraphs in this repo | 3.65 | 5.43 |
| Markdown | `CAPABILITIES.md` files | 2.91 | 4.16 |
| TypeScript | `ts-agent-tasks` source | 3.51 | 4.39 |
| JSON records | IANA language-subtag registry entries | 2.39 | 2.45 |
| UUID-, timestamp- and number-dense JSON | 2,000 synthetic `{id, rev, at, parent, progress}` records | 1.34 | 1.35 |

Digits tokenize one per token, which is why the last class is lowest. The tokenizer adds no BOS or
EOS.

**Recommended values for upstream CLM at 2,048 tokens:**

- **2,400 characters** when the content class is unknown, or includes identifier- or number-dense
  runs (UUIDs, timestamps, hashes, numeric tables). `r` = 1.34 gives 2,469.
- **4,400 characters** for states measured to be prose, Markdown, code or ordinary JSON records.
  `r` = 2.39 gives 4,405.
- Anything above 4,400 only from your own measurement, by the rule. (The `ts-agent-tasks` context
  renderer's 8,000-character default exceeds both.)

**Not covered:** CJK and other non-Latin scripts (no corpus was measured); openjev's 512- and
1,024-token CPU models and its Gemma model (other tokenizers); Jev, whose bound and truncation
behaviour are unknown.

## Thresholds do not transfer between backends

Probabilities are **relative to the candidate set**: P(billing) = 0.94 means "billing rather than
the other options given", and adding an option changes it. They are also **model-specific**. A
development run against Jev, openjev or a small CPU model proves plumbing, failure handling and your
control flow. It says nothing about production thresholds, which must be tuned against the model
production runs. Development latency is not production latency either: `elapsedMs` includes the
WAN round trip, and `timingHeaders` is what lets you separate server time from network time.

## Configuration notes

- **Every value is explicit.** `baseUrl`, `model`, `apiKey` and the SDK log level are always passed
  to the SDK, so none of `TYPESAFE_BASE_URL`, `TYPESAFE_DEFAULT_MODEL`, `TYPESAFE_API_KEY` or
  `TYPESAFE_LOG_LEVEL` can redirect or reconfigure a deployed client. There is no per-call URL.
  Model ids differ by backend (`clm-latest`, `clm-v0.1`, `jev-latest`), so `model` has no default.
- **A keyless local server.** The SDK accepts an empty key and sends `Authorization: Bearer `.
  Pass `apiKey: ''` to talk to a `clm-serve` started without `CLM_API_KEY`. A server that does have a
  key answers 401, which is `unauthorized`.
- **Run `clm-serve` on loopback.** It binds `0.0.0.0` with authentication off by default, which puts
  an unauthenticated model server on the LAN. Start it with `--host 127.0.0.1`, or set
  `CLM_API_KEY` and pass the same key here.
- **Logging.** Pass an fgv `ILogger` to see the SDK's request summaries (`debug` → `detail`,
  `info` → `info`, `warn` → `warn`, `error` → `error`). The SDK is never set to its `debug` level,
  which logs request bodies (and so the state) unredacted. With no logger, the SDK logs nothing and
  never reaches `console`.
- **`fetch`.** Any function with the global `fetch` signature. It is the seam a guarded fetch would
  plug into; none is needed for a URL the composition root wrote down.

## Backends

| backend | runs on | notes |
|---|---|---|
| CLM: `clm-serve` (port 8700) + vLLM serving Qwen3-8B with `--runner pooling` (port 8090) | Linux and an NVIDIA GPU (~8–16 GB VRAM) | needs vLLM ≥ 0.10.1; truncates the end of an over-long state, silently |
| openjev (including its `clm-v0.1` route and the hosted Codiv endpoint) | Apple silicon, NVIDIA, or CPU for its small models | reports a different `confidence`; truncates the start of a long text; answers an unknown model with `400 api_usage_error` |
| TypeSafe Jev | hosted | semantics, bound and error bodies not visible from here |

**CLM over Ollama.** Where an environment serves Qwen3-8B through Ollama rather than vLLM, the first
step is a single probe round trip (`perf/systemOneLive.js probe`). On Ollama 0.35 a generative
`qwen3:8b` probably cannot serve embeddings at all, so `clm-serve` would answer 502 (`server`). The
analysis says so but has not been observed. A refusal is a refusal: that environment then uses a
remote vLLM-backed CLM instead. Encoder fidelity on any Ollama setup is not established.

## Live checks

`perf/systemOneLive.js` (not published; needs a built `lib/`):

- `probe --url <u> --model <m> [--key-env <VAR>] [--max-chars <n>]` runs one `askSystemOne` with one
  question of each type plus `listSystemOneModels`, and prints a JSON record (backend URL, model,
  `meta` with the headers, or the classified reason and status). Exit 0 on success, 2 on a
  classified failure.
- `parity --a <url,model> --b <url,model> --questions <file> --max-chars <n>
  --min-top-agreement <x> --max-mean-abs-diff <y>` refuses to start without both thresholds, probes
  both endpoints first, and reports top-answer agreement and per-option absolute differences.
- `--check` validates the arguments and makes no request.

The key is read from the environment variable named by `--key-env`, never from an argument.

## Dependency posture

`@typesafe-ai/sdk` is a **direct** dependency, pinned `~0.6.0`: a pure-JS protocol client with no
native binding and no consumer-owned handle, so a consumer has no reason to hold a second opinion
about its version (the `ts-extras-mcp` and webauthn precedent). The SDK is young and 0.x, so every
minor bump is a wire change to review, not to absorb. `@fgv/ts-utils` is a peer dependency.

## Explicitly not in scope

- CLM's `/v1/rank` (use a `choice` question);
- `temperature` and openjev's extensions (`images`, `steps`, `samples`, `think`, `sequential`);
- a browser sibling;
- an fgv `ISystemOneDecider` interface over backends;
- sidecar process management, health supervision and model download;
- `confidence` in any form, raw or normalised;
- exact token counting;
- threshold or decision policy, which belongs to the consumer;
- retries beyond passing through the SDK's policy;
- fine-tuning;
- a per-call `baseUrl`;
- the SDK's `debug` logging.
