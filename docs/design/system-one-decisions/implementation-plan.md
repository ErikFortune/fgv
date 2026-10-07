# System-1 decisions — implementation plan

**Status:** **Implemented 2026-10-03 (Phase C, `system-one-impl`)** as `@fgv/ts-extras-system-one`; the
deviations are in [`result.md`](../../../.ai/tasks/active/system-one-impl/result.md). The revert matrix
ran 43/43 VERIFIED. **Live legs L1–L5: not run live**; the cluster close is held for a recorded L1
(decision U2). Originally the Phase B (triage) output of the `system-one-decisions`
design-triage-implement stream, 2026-10-03; Phase C was held to this document. Two decisions
are the user's (§ 1.2); neither changes the package surface, so neither blocks commissioning Phase C.
**Design:** [`design.md`](design.md). Facts are cited by their E-number there; E28–E35 were added by
this phase. **Base:** `integration/system-one-decisions` @ `72f5f0bb`, plus the Phase B brief
`bb48c467`.
**Triage account:**
[`.ai/tasks/active/system-one-triage/result.md`](../../../.ai/tasks/active/system-one-triage/result.md).

## 1. What this plan rests on

### 1.1 Decided

- Design decisions 1–6, unchanged.
- OQ-7 (`'unchecked'` stays) and the omission of `confidence`, both from the verification pass.
- From Phase B:
  - OQ-2: the name is `@fgv/ts-extras-system-one`.
  - OQ-9: `~0.6.0`, with a review gate on every minor.
  - OQ-4: the margin rule and README values (§ 7).
  - OQ-6: named tests (§ 5).
  - D10: the harness ships as a `perf/` script (§ 8).
  - Design § 8's Phase B amendment: five contract refinements, specified in § 3.

### 1.2 Decided by the user, 2026-10-03 (neither changes § 3)

- **Decision U1 — E27a, the Ollama leg: option A, keep Ollama, gated on one round trip.** Each
  Ollama environment's first live step is a single `probe` (L4). A refusal is recorded as a refusal,
  and that environment falls back to a remote vLLM-backed CLM (OQ-12). § 6 is unchanged.
- **Decision U2 — the cluster-close gate: option (a), L1 only.** The squash to `release` waits for
  one recorded L1 round trip. Phase C may finish with L1 "not run live"; the orchestrator then holds
  the cluster close until someone with egress and a key runs `perf/systemOneLive.js probe` and
  appends the record. L2–L5 gate the consumer's experiment, not the release.

*(These are the triage's decision labels; they are unrelated to the unit-test ids U1–U26 in § 5.1.)*

## 2. Slicing: one slice, plus live evidence

**One implementation slice, S1.** The case for one:

- It is one new package with no change to any other package's surface. No shared contract widens, so
  nothing downstream can break and there is no cross-package sequencing to split along.
- It has about five primitives, roughly the size of `ts-extras-ollama` (655 lines in one
  `src/index.ts`), which shipped as one slice.
- Its protections are interlocking. The bound runs before the call, and validation shapes the result
  the classification returns. A split would put half of them in a slice with nothing to test them
  against.

**Live evidence, L1–L5 (§ 6)**, is not a code slice. It is a set of recorded runs against real
servers, which may happen after S1 merges into the integration branch and before the cluster close,
by whoever has the egress and hardware (decision U2).

## 3. S1 surface

`libraries/ts-extras-system-one`, Node ≥ 20. Every primitive returns a `Result` and never throws.

### 3.1 Exports

| export | shape |
|---|---|
| `createSystemOneClient(params)` | `Result<ISystemOneClient>` |
| `askSystemOne(client, request)` | `Promise<DetailedResult<ISystemOneAnswer<Q>, SystemOneFailureReason>>` |
| `listSystemOneModels(client)` | `Promise<Result<ReadonlyArray<ModelCard>>>` |
| `measureSystemOneInput(state, questions)` | `ISystemOneInputMeasure` (pure; cannot fail) |
| `noul`, `choice`, `score` | the SDK's own builders, re-exported (identity, not wrappers) |
| types | `ISystemOneClient`, `ICreateSystemOneClientParams`, `ISystemOneRequest<Q>`, `SystemOneInputLimit`, `ISystemOneAnswer<Q>`, `ISystemOneMeta`, `SystemOneFailureReason`, `ISystemOneInputMeasure`, and the SDK's question, answer and `ModelCard` types it needs, re-exported rather than redeclared |

### 3.2 `createSystemOneClient`

```ts
interface ICreateSystemOneClientParams {
  readonly baseUrl: string;          // required: absolute http(s) URL
  readonly model: string;            // required: non-empty after trim
  readonly apiKey: string;           // required; '' is allowed for a keyless sidecar (E29)
  readonly timeoutMs?: number;       // per attempt (E30)
  readonly retry?: Partial<RetryPolicy>;
  readonly logger?: ILogger;
  readonly fetch?: Fetch;            // the SDK's type (E31)
}
```

- `baseUrl` must parse as an absolute `http:` or `https:` URL. `model` must be non-empty after
  trimming. Each failure names the parameter.
- The SDK is constructed with `baseURL`, `defaultModel: model`, `apiKey`, `logLevel` and `logger`
  **always passed explicitly**, so none of the four `TYPESAFE_*` variables can take effect (E12,
  E29). `timeout`, `retry` and `fetch` are passed only when given.
- The SDK constructor is wrapped in `captureResult`.
- `ISystemOneClient` is opaque. It is the SDK client plus the configured `model`, and it has **no
  per-call URL anywhere** (§ 6.3 of the design).
- **An empty `apiKey`.** The SDK accepts `''` and sends `Authorization: Bearer ` (E29). The README
  states that this is how to talk to a keyless local `clm-serve`, and that a keyed server answers 401,
  which is `unauthorized`.

### 3.3 `askSystemOne`

```ts
type SystemOneInputLimit = { readonly maxChars: number } | 'unchecked';
interface ISystemOneRequest<Q extends Questions> {
  readonly state: SystemOneRequest<Q>['state'];
  readonly questions: Q;
  readonly inputLimit: SystemOneInputLimit;   // required: omitting it is a compile error
  readonly signal?: AbortSignal;
}
```

The steps run in order. The first failure returns.

1. **Bound** (skipped for `'unchecked'`). This is `measureSystemOneInput`, then a comparison.
   - **Per question:** `len(stateText) + 2 + len(instructionsText)`. The `2` is CLM's `"\n\n"` (E32).
   - **Per candidate:** the text upstream CLM will embed for each option, compared separately (E17,
     E32):
     - a `choice` option is its description, or its key when the description is null or empty;
     - a `score` level is its text;
     - a `noul` option is `"true: "` / `"false: "` plus its description. With no description it is
       `"Yes. This is true: "` / `"No. This is false: "` plus the instructions, so a long
       instruction can exceed the bound on the candidate side when it does not on the state side.
   - **Measures:**
     - a string state is its length;
     - any other state is the length of `JSON.stringify(state)` (design § 6.1);
     - a non-string `instructions` or description is measured the same way;
     - an absent or `null` one is 0.
   - Over the limit: `input-over-limit`, naming the question id, the part (`state+instructions` or
     `criterion <key>`), the measured length and the limit. **No request is made.**
   - `maxChars` must be a positive integer, or the call fails as `invalid-request` before measuring.
2. **Call.** `captureResult(() => sdk.systemOne({ state, questions, model }, { signal }))`. The
   capture is required because the SDK's question check throws **synchronously** (E30). The request
   carries `model` explicitly, as well as the SDK's `defaultModel`. Then `.withResponse()`.
3. **Classify** any failure by § 3.5.
4. **Validate** the parsed body by § 3.6.
5. **Project.** Build the answer from the validated fields, **not by spreading the server's object**.
   `confidence` and any field the SDK's type does not declare are dropped by construction.
6. **Meta.**
   - `model`: from the validated body.
   - `usage`: the validated `input_tokens` and `output_tokens`, plus `billing_units` when the server
     sends a finite number (CLM does, E5).
   - `elapsedMs`: measured by the boundary around step 2, so it includes the SDK's retries and
     back-off.
   - `requestId`: from `withResponse()`, `undefined` when absent (E30).
   - `timingHeaders`: an object holding `server-timing` and/or `x-clm-latency-ms`, exactly as the
     response carried them. It is omitted when neither is present.

`ISystemOneAnswer<Q>` is `{ result, meta }`. `result` is a **mapped type over the SDK's
`SystemOneResult<Q>`** that removes `confidence` from `ChoiceResponse` and `ScoreResponse`. It is not
a parallel declaration.

### 3.4 Logging

The SDK's `Logger` is an adapter over the injected fgv `ILogger`:

| SDK method | `ILogger` method |
|---|---|
| `debug` | `detail` |
| `info` | `info` |
| `warn` | `warn` |
| `error` | `error` |

**The SDK's `logLevel` is derived from the `ILogger`, and never set to `debug`.** At `debug` the SDK
logs request bodies, which carry the state, unredacted (E29).

| `ILogger.logLevel` | SDK `logLevel` |
|---|---|
| `all`, `detail`, `info` | `info` |
| `warning` | `warn` |
| `error` | `error` |
| `silent` | `off` |
| no logger given | `off`, with a no-op sink |

The SDK never reaches `console` (repo rule; E29).

### 3.5 Failure classification

The classification is total. It is decided by error class and status, never by body text (design
§ 8). The table is checked in this order.

| condition | reason |
|---|---|
| bound exceeded (step 1) | `input-over-limit` |
| invalid `maxChars`; synchronous `TypeSafeError` from the SDK before any request (E30) | `invalid-request` |
| `APIUserAbortError` | `aborted` |
| `APITimeoutError` (**before** `APIConnectionError`, which it extends, E30) | `timeout` |
| `APIConnectionError` | `connection` |
| `APIError` 401 or 403 | `unauthorized` |
| `APIError` 408 | `timeout` |
| `APIError` 429 | `rate-limited` |
| `APIError` any other 4xx (400, 404, 422, …) | `invalid-request` |
| `APIError` ≥ 500, or any other non-2xx | `server` |
| a 2xx whose body fails § 3.6, including a string or `undefined` body (E30) | `invalid-response` |
| anything else thrown | `connection`, with the original message (the SDK funnels every `fetch` failure into `APIConnectionError`, E30, so this row is not expected to occur) |

The failure message carries the status and the `requestId` when there is one.

### 3.6 Response validation

The validator is built from the request's own questions, with `Converters` and `Validators`. It uses
no casts.

- `model`: a non-empty string. `usage.input_tokens` and `usage.output_tokens`: finite numbers ≥ 0.
- **The answer ids equal the question ids exactly**: none missing and none extra. Each answer's
  `type` equals its question's.
- **`noul`:** a finite number in `[0, 1]`.
- **`choice`:**
  - `probabilities` keys equal the criteria keys exactly;
  - `choice` is one of them;
  - every value is a finite number in `[0, 1]`;
  - the values sum to 1 within **1e-3**.
- **`score`:** with `n` levels:
  - `probabilities` keys are exactly `"0"`…`"n-1"`;
  - every value is a finite number in `[0, 1]`;
  - the values sum to 1 within 1e-3;
  - `score` is finite and in `[0, n-1]`;
  - `legend` keys are exactly `"0"`…`"n-1"`.
- **Why 1e-3.** It is wide enough for a server that rounds each probability to four places (10
  options give at most 5e-4) and narrow enough to catch an unnormalised distribution or a missing
  option. If L1 or L2 shows a legitimate server outside it, revise it with that evidence.
- **Not checked, deliberately:** that `choice` is the argmax, and that `score` equals Σ i·pᵢ. CLM
  does both (E6), but Jev's semantics are unknown (E14), and the boundary promises the wire, not the
  semantics (design § 5.2).

### 3.7 `listSystemOneModels`

`sdk.models.list()`, then validation of each element as `{ name: string; description: string;
release_date: string }`.

- The SDK's shape error is `TypeSafeError`, raised after the response (E30).
- A plain `Result`, as design § 8 has it, with the message carrying what § 3.5 would have classified.

### 3.8 Explicitly not in scope

Design § 8's list, unchanged. Also: no per-call `baseUrl`; no `confidence` in any form; no `debug`
SDK logging.

## 4. Acceptance criteria (S1)

- [ ] § 3 is implemented as written, or each deviation is recorded in `result.md` with its reason.
- [ ] Every § 5 test exists, and every design § 10 item maps to one (§ 11).
- [ ] The revert matrix (§ 5.2) runs with **every row VERIFIED**. A row counts as verified only when
      the test it names is among the tests that went red. "Something went red" is not enough.
- [ ] `rushx build`, `rushx lint` and `rushx test` pass in the package with 100% coverage, and
      `rushx fixlint` was run before the final commit. There are no warnings: `rush rebuild` treats
      a warning as a failure (`CODING_STANDARDS.md`).
- [ ] `rush change --verify --target-branch origin/integration/system-one-decisions` passes. There
      is one change file for `@fgv/ts-extras-system-one`, typed `minor` (the package has never shipped
      on `main`; `ACTIVE_DEVELOPMENT.md`).
- [ ] `node common/scripts/verify-capability-docs.mjs`,
      `node common/scripts/generate-capability-feed.mjs --check` and
      `node common/scripts/verify-bundler-resolution.mjs` exit 0 (§ 9 on the last one).
- [ ] `etc/ts-extras-system-one.api.md` is checked in. It has no `ae-unresolved-link` from a
      cross-package `{@link}`; use code spans for the SDK's symbols (`CODE_REVIEW_CHECKLIST.md`).
- [ ] `perf/systemOneLive.js --check` runs clean (§ 8).
- [ ] The `code-reviewer` pass runs after the functional tests and before coverage closure, and its
      findings are dispositioned in `result.md`.
- [ ] `result.md` reports each live leg as run (with § 6's record) or as **"not run live"**. No leg is
      inferred from another.
- [ ] § 10's close-time updates ship in the same PR.

## 5. Required tests

### 5.1 Unit tests

These run against the real SDK 0.6.0 through the `fetch` parameter, using recorded CLM-shaped (E5,
E6, E9, E32) and Jev/SDK-shaped (E11) bodies. **No module mocking of the SDK.** Use
`@fgv/ts-utils-jest` matchers.

| id | test | design § 10 / OQ |
|---|---|---|
| U1 | Bound refuses before any request: a state of `maxChars + 1` fails `input-over-limit`, and the fetch spy is called **0** times | § 10.1 "fires before any fetch" |
| U2 | Bound boundary: the measure exactly equal to `maxChars` succeeds; `maxChars + 1` fails | § 6.1 |
| U3 | The measure includes instructions **and** the 2-character separator | § 6.1, E32 |
| U4 | Each candidate is bounded separately and is named in the failure: a long `choice` description; a `choice` key standing in for an empty description; a `noul` with no criteria whose default candidate (instructions + 26) is over while state + 2 + instructions is not | § 6.1, E17, E32 |
| U5 | A structured state is measured by its JSON serialization | § 6.1 |
| U6 | The failure names the right question when the second of two questions is over | § 6.1 |
| U7 | `'unchecked'` skips the bound; the request is sent | OQ-7 |
| U8 | `inputLimit` is mandatory and no per-call URL exists, as compile-time checks (`// @ts-expect-error` in a test file) | § 6.1, § 6.3 |
| U9 | `maxChars` ≤ 0 or non-integer is `invalid-request`, with no request made | § 3.3 |
| U10 | An empty question set, or a score question with one level, is `invalid-request` (the SDK's synchronous throw), with no request made | E30 |
| U11 | Classification: every row of § 3.5 has its own fixture, each asserting the **exact** reason | § 10.1 "every failure reason" |
| U12 | OQ-6: CLM `422 {"detail": …}` for an unknown model, openjev `400 api_usage_error`, and a 404, are each `invalid-request` | OQ-6 |
| U13 | OQ-6: `529` is retried (fetch called `maxRetries + 1` times), then `server`; `503` then `200` succeeds | OQ-6, E30 |
| U14 | Timeout versus connection: a fetch that never settles, with `timeoutMs: 20` and `maxRetries: 0`, is `timeout`; a fetch that rejects is `connection` | E30 |
| U15 | Abort: an already-aborted signal and a signal aborted in flight are each `aborted`, never `connection` | § 8 |
| U16 | Validation rejects a mismatched answer set, one test per § 3.6 rule: (a) an extra id, (b) a missing id, (c) a wrong `type`, (d) `choice` keys, (e) `choice` membership, (f) `score` range, (g) `noul` range, (h) a non-finite value, (i) the sum, (j) `score` probability and `legend` keys, (k) `model` and `usage` | § 10.1 "validation rejecting a mismatched answer set" | § 10.1 "validation rejecting a mismatched answer set" |
| U17 | A 2xx body that is not JSON, and an empty 2xx body, are each `invalid-response` | E30, OQ-6 |
| U18 | A `choice` and a `score` answer carry **no `confidence`** when the server sent one, for both a CLM-shaped and a Jev-shaped body; no undeclared extra field survives | § 10.1, § 8 |
| U19 | `listSystemOneModels`: a CLM `{ models: [...] }` succeeds; a bare array fails; an element missing `name` fails | E30, E32 |
| U20 | Meta: `requestId` is present when the header is sent and `undefined` when it is not; `timingHeaders` passes both headers through byte-identical; `elapsedMs` covers retries; `model` and `usage` come from the body | § 8, OQ-6 |
| U21 | **The request body carries the configured `model`**, with `TYPESAFE_DEFAULT_MODEL` set to a different value for the test | § 10.3 |
| U22 | The configured `baseUrl` is the one called, with `TYPESAFE_BASE_URL` set to a different value | § 7.1 item 5 |
| U23 | Logging: with `TYPESAFE_LOG_LEVEL=debug` set and an `ILogger` at `all`, a marker string in the state appears in **no** logged message or parameter; with no logger, `console` is never called | § 3.4, E29 |
| U24 | `createSystemOneClient` rejects a relative or non-http(s) `baseUrl` and a blank `model`; it accepts `apiKey: ''` | § 3.2 |
| U25 | `noul`, `choice` and `score` are the SDK's own functions (`toBe`) | § 8 "no parallel types" |
| U26 | `measureSystemOneInput` returns the same numbers the refusal reports | § 8 |

Each test that sets an environment variable restores it in `afterEach`.

### 5.2 Revert matrix

Phase C ships `perf/mutationMatrix.js`, modelled on `libraries/ts-agent-tasks/perf/mutationMatrix.js`,
with that script's rules:

- a row whose pattern is not found exactly once, or whose mutant does not build, is **UNVERIFIED**;
- `0 red` is a finding.

It adds one rule, because the previous cycle had a row green for the wrong protection: **each row
names the test or tests that must go red, and a row is VERIFIED only if one of those is among the
red.**

**The fixture values are chosen so that the right and wrong answers differ.**

| row | protection | mutation | fixture: right vs wrong answer | must go red |
|---|---|---|---|---|
| R1 | bound runs before the call | move the check after the SDK call | `maxChars: 10`, state `'x'.repeat(11)`. Right: `input-over-limit`, fetch calls **0**. Wrong: fetch calls **1** | U1 |
| R2 | strict `>` comparison | `>` → `>=` | state of exactly 10 with `maxChars: 10`. Right: success. Wrong: refusal | U2 |
| R3 | separator counted | drop the `+ 2` | state 5 chars, instructions 4, `maxChars: 10`. Right: 11 > 10, refused. Wrong: 9, sent | U3 |
| R4 | instructions counted | measure the state only | state 5, instructions 6, `maxChars: 10`. Right: 13, refused. Wrong: 5, sent | U3 |
| R5 | criteria bounded | skip the criteria loop | state 1, a `choice` criterion `b` of 11, `maxChars: 10`. Right: refused naming `criterion b`. Wrong: sent | U4 |
| R5b | `noul` default candidate measured | measure only explicit descriptions | empty state `''`, a `noul` with no criteria and instructions of 80, `maxChars: 100`. Right: candidate `"No. This is false: "` + 80 + prefix = 106, refused. Wrong: state side 82 passes, sent | U4 |
| R6 | JSON measure for a structured state | `String(state)` | state `{ k: 'y'.repeat(30) }`, `maxChars: 20`. Right: JSON is 38, refused. Wrong: `"[object Object]"` is 15, sent | U5 |
| R7 | the refusal names the right question | report the first question | `q1` at 3, `q2` at 30, `maxChars: 10`. Right: names `q2`. Wrong: names `q1` | U6 |
| R8 | `'unchecked'` skips | treat `'unchecked'` as `maxChars: 0` | state 50, `'unchecked'`. Right: sent, success. Wrong: refused | U7 |
| R9 | synchronous SDK throw captured | call `sdk.systemOne` outside `captureResult` | `questions: {}`. Right: `invalid-request` Result. Wrong: the test sees a thrown exception | U10 |
| R10 | timeout tested before connection | swap the two `instanceof` checks | fetch never settles, `timeoutMs: 20`. Right: `timeout`. Wrong: `connection` | U14 |
| R11 | abort classified | drop the `APIUserAbortError` branch | pre-aborted signal. Right: `aborted`. Wrong: `connection` (the fall-through) | U15 |
| R12 | 404 is `invalid-request` | 4xx fall-through → `server` | `404`. Right: `invalid-request`. Wrong: `server` | U12 |
| R13 | 401/403 | map to `invalid-request` | `403`. Right: `unauthorized`. Wrong: `invalid-request` | U11 |
| R14 | 408 | drop the 408 row | `408` with `maxRetries: 0`. Right: `timeout`. Wrong: `invalid-request` | U11 |
| R15 | answer id set equality | check "every question answered" only | questions `{a}`, answers `{a, b}`. Right: `invalid-response`. Wrong: success | U16a |
| R16 | missing answer | drop the id check entirely | questions `{a, b}`, answers `{a}`. Right: `invalid-response`. Wrong: success with `b` undefined | U16b |
| R17 | answer type matches | drop the type check | `a` is `choice`; answer `{ type: 'noul', noul: 0.5 }`. Right: `invalid-response`. Wrong: success | U16c |
| R18 | choice keys equal criteria | compare key **counts** | criteria `{x, y}`, probabilities `{x: 0.5, z: 0.5}`. Right: `invalid-response`. Wrong: success (same count) | U16d |
| R19 | `choice` is a key | drop the check | criteria `{x, y}`, `choice: 'z'`. Right: `invalid-response`. Wrong: success | U16e |
| R20 | score range upper bound | `<= n` instead of `<= n-1` | 3 levels, `score: 3`. Right: `invalid-response`. Wrong: success | U16f |
| R21 | noul range | drop the `<= 1` check | `noul: 1.5`. Right: `invalid-response`. Wrong: success | U16g |
| R22 | finite probabilities | drop `Number.isFinite` | body text `{"x":1e999,…}` (`JSON.parse` gives `Infinity`). Right: `invalid-response`. Wrong: success | U16h |
| R23 | sum tolerance | drop the sum check | probabilities `{x: 0.5, y: 0.497}` (sum 0.997). Right: `invalid-response`. Wrong: success. Control: `{x: 0.5, y: 0.4995}` (sum 0.9995) succeeds | U16i |
| R24 | non-JSON 2xx | treat a string body as success | `200` with body `ok`. Right: `invalid-response`. Wrong: success | U17 |
| R25 | `confidence` dropped | spread the server's answer | `choice` answer with `confidence: 0.42`. Right: `'confidence' in answer === false`. Wrong: `true` | U18 |
| R26 | model always in the body | omit `model` from the request and `defaultModel` | configured `clm-latest`, env `TYPESAFE_DEFAULT_MODEL=env-model`. Right: body `model` is `clm-latest`. Wrong: `env-model` | U21 |
| R27 | baseUrl explicit | omit `baseURL` | configured `http://cfg.test:8700`, env `TYPESAFE_BASE_URL=http://env.test`. Right: fetch URL starts `http://cfg.test:8700/v1/systemone`. Wrong: `http://env.test/…` | U22 |
| R28 | `logLevel` explicit and never `debug` | omit `logLevel` (env `debug` wins), or map `all` → `debug` | state contains `MARKER-7f3a`; logger at `all`. Right: no log entry contains the marker. Wrong: the debug body log contains it | U23 |
| R29 | no `console` without a logger (**paired**: the no-op sink and the `off` level each mask the other, so the row reverts both, per the `paired` rows of the agent-tasks matrix) | pass `logger` only when given **and** omit `logLevel` when no logger is given | no logger; `console.*` spied; env `TYPESAFE_LOG_LEVEL=info`; a 503 then 200, whose retry the SDK logs at `info`. Right: 0 console calls. Wrong: ≥ 1 | U23 |
| R30 | `requestId` passthrough | read it from the body instead | header `x-typesafe-request-id: req-1`, no body field. Right: `req-1`. Wrong: `undefined` | U20 |
| R31 | timing headers unparsed | parse `server-timing` to a number | `server-timing: embed;dur=12.5, heads;dur=0.3`. Right: byte-identical string. Wrong: anything else | U20 |
| R32 | `elapsedMs` covers retries | time only the last attempt | first attempt `503` after a 40 ms delay, then `200` at once, with `backoffInitialMs: 1`. Right: `elapsedMs >= 40`. Wrong: about 0 | U20 |
| R33 | models shape error after the call | classify every `TypeSafeError` as `invalid-request` | `200` with body `[]` from `/v1/models`. Right: the message says `invalid-response`. Wrong: `invalid-request` | U19 |

Run it with `node perf/mutationMatrix.js --pkg <copy>` and paste the output into `result.md`.

## 6. Live checks

These are **not established until run.** Each one is recorded in `result.md` with:

- the backend, the server's version or commit, and the model id;
- the hardware;
- the date and who ran it;
- the `meta` returned, including the headers;
- for a failure, the classified reason and status.

A leg that was not run is written **"not run live"**, never inferred from another leg (design § 10
item 2). `perf/systemOneLive.js probe` (§ 8) produces the record.

| id | leg | what it establishes | design |
|---|---|---|---|
| L1 | Remote development server (Jev, or openjev/Codiv), over `https` with a key | wire compatibility against a real server: request accepted, § 3.6 passes on a real body, `requestId` and timing headers as sent, the status for an unknown model (OQ-6). Which remote was used is recorded (OQ-11) | § 10.2, OQ-6 |
| L2 | `clm-serve` on loopback over vLLM bf16, on the Olares One | the deployed wiring, CLM's 422 and the keyless placeholder key; also OQ-10's Olares items (Blackwell build, memory budget), recorded as found, and OQ-8's issue #3 reproduction (one `score` question across two contrasting states) | § 10.2, OQ-8, OQ-10 |
| L3 | With L2: E33's windows replayed through the encoder's `/tokenize` (E35) | the OQ-4 measurement against the real tokenizer. A `GET /tokenizer_info` with the flag would also close E16b | OQ-4, E16b |
| L4 | Each Ollama setup actually deployed: **first** one `probe` round trip. A refusal is recorded as a refusal | E27a. Kept, gated on this probe (decision U1, option A) | § 10.2, OQ-12 |
| L5 | `parity` between L2's endpoint and each L4 endpoint that passed its probe, with thresholds given before the run | OQ-12. Runs only for L4 endpoints that passed (decision U1, option A) | OQ-12 |

**Not established by any unit test, and claimed nowhere until the matching leg runs:**

- that any real server accepts the SDK's request;
- that Jev's or openjev's error statuses match the fixtures;
- that `x-typesafe-request-id`, `Server-Timing` or `X-CLM-Latency-Ms` are actually sent;
- that the bound in § 7 holds against the deployed tokenizer;
- encoder fidelity on any Ollama setup.

## 7. OQ-4 in the README

The README carries:

- E33's table, with its corpus and its derived status;
- the rule `maxChars = floor(B × r × 0.9)`;
- the two recommended values for upstream CLM at 2,048 tokens: **2,400** when the content class is
  unknown or identifier-dense, and **4,400** for measured prose, Markdown, code or JSON records;
- what is not covered (non-Latin scripts, openjev's other tokenizers, Jev).

No number is a default in code (design § 6.1).

## 8. `perf/systemOneLive.js`

This is D10, decided. It is not a jest test and not published (`perf/` is outside `files`). It
requires a built `lib/`, and uses only the package's public exports.

- **`probe --url <u> --model <m> [--key-env <VAR>] [--max-chars <n>]`.** One `askSystemOne` with a
  fixed three-question set (one each of `noul`, `choice` and `score`), plus `listSystemOneModels`. It
  prints § 6's record as JSON. It exits 0 on success, and 2 on a classified failure, with the reason.
- **`parity --a <url,model> --b <url,model> --questions <file> --min-top-agreement <x>
  --max-mean-abs-diff <y>`.**
  - It **refuses to start unless both thresholds are given**, and prints them first.
  - It probes both endpoints, and exits 2 if either probe fails ("refused, not a parity result").
  - Every input is checked against `--max-chars`, so truncation is not what is measured.
  - It reports top-answer agreement and the mean and maximum per-option absolute difference, and exits
    0 (pass) or 1 (fail).
- **`--check`** validates the arguments and the question file, and makes no request. Phase C runs
  this; the live modes are L1–L5.
- The key is read from a named environment variable, never from an argument, so it does not appear in
  shell history or the record.

## 9. Package scaffold

Start from `libraries/ts-extras-ollama/`.

**Copy as is:**

- `config/` (`api-extractor.json`, `jest.config.json` with the 100% thresholds, `rig.json` →
  `@fgv/heft-dual-rig`);
- `eslint.config.js`;
- `tsconfig.json`;
- `LICENSE`;
- the `package.json` skeleton: `exports`, `files`, the scripts, `sideEffects: false`, and
  `"version": "5.1.0"` under the `base-utils` lockstep policy.

**What differs:**

| | `ts-extras-ollama` | `ts-extras-system-one` |
|---|---|---|
| upstream | `ollama`, **peer** + dev, `^0.6.0` | `@typesafe-ai/sdk`, **direct**, `~0.6.0` (OQ-9). Add it with `rush add -p @typesafe-ai/sdk@~0.6.0`, never by hand |
| `@fgv/ts-utils` | peer + dev | peer + dev (same; `ts-extras-mcp` precedent) |
| `@fgv/ts-json-base` | direct (uses `JsonSchema`) | none, unless the source imports it (design § 8, Phase B amendment 5) |
| README dependency-posture line | peer, consumer pins | direct: a pure-JS protocol client with no native binding and no consumer-owned handle (`result-integration-boundary.md`) |
| bundler gate | declared node-only (`ollama` imports `node:fs`) | the SDK imports no Node built-in (E31), so it probably bundles. Run the gate; add a `NEEDS_NODE_BUILTINS` entry **only if it fails**, with the reason |
| source layout | one 655-line `src/index.ts` | either one file or a small set of modules re-exported from `src/index.ts`. Keep every file under the 2,000-line `max-lines` |

**The SDK behaviours the boundary depends on.** OQ-9's minor-bump gate re-checks this list:

- the explicit-over-env order and `??` semantics (E29);
- `debug` logging bodies (E29);
- the synchronous `TypeSafeError` (E30);
- `APITimeoutError extends APIConnectionError` (E30);
- the status classes and the default retry set (E30);
- non-JSON 2xx returned as text (E30);
- the `models` unwrap (E30);
- `withResponse()` and `requestId` (E30);
- the `Fetch` type (E31).

## 10. Close-time updates (the PR that closes Phase C; docs ship with the code)

- `rush.json`: the project entry (`versionPolicyName: base-utils`, `tags: ["libraries"]`).
- `common/config/rush/pnpm-lock.yaml`: through `rush add` / `rush update` only.
- `common/changes/@fgv/ts-extras-system-one/*.json`: `minor`.
- In the package: `README.md`, with the not-in-scope list, the dependency posture, § 7, the threshold
  caveat (design § 7), `clm-serve --host 127.0.0.1` / `CLM_API_KEY` (§ 6.3), the keyless empty key,
  and Ollama per U1. Also `CAPABILITIES.md` and `etc/ts-extras-system-one.api.md`.
- `.ai/instructions/LIBRARY_CAPABILITIES.md`: a packages-table row and one decision shortcut. The
  recent-additions feed is generated from the stream's `meta.yaml` at finalize; never hand-edited.
- `.ai/conventions/result-integration-boundary.md`: add the package to the reference instances and
  to the direct-dependency list.
- `.ai/instructions/ACTIVE_DEVELOPMENT.md`: a row in the active-surfaces table.
- `docs/design/system-one-decisions/design.md` status line and this plan's status line: implemented,
  with the live legs' state.
- `docs/WORKSTREAMS.md` § `system-one-decisions`: anticipate the merge (`CODING_STANDARDS.md` § *A PR
  anticipates its own merge*).
- `/finalize-task` runs at the cluster close, as Phase A's and B's directories have not.
- **The cluster close gate is one recorded L1 round trip** (decision U2, option (a)).

## 11. Traceability: design § 10 to this plan

| design § 10 item | covered by |
|---|---|
| 1. unit tests through the `fetch` seam, recorded CLM- and Jev-shaped bodies | § 5.1 (the `fetch` parameter is § 3.2) |
| 1. every failure reason | U11, with U1, U10, U12–U15, U17 |
| 1. the input-limit refusal fires before any fetch | U1; R1 |
| 1. validation rejects a mismatched answer set | U16a–U16k; R15–R23 |
| 1. no `confidence` whatever the backend sent | U18; R25 |
| 2. live, remote development server | L1 |
| 2. live, CLM sidecar once per deployed encoder | L2 (vLLM), L4 (each Ollama, per U1) |
| 2. "not run live" never inferred | § 4, § 6 |
| 3. the request body carries `model` | U21; R26 |
