# Result — `system-one-impl` (Phase C of `system-one-decisions`)

## What shipped

A new package, `@fgv/ts-extras-system-one` (`libraries/ts-extras-system-one`), slice S1 of
[`implementation-plan.md`](../../../docs/design/system-one-decisions/implementation-plan.md).

- Source is in `src/`: `types.ts`, `measure.ts`, `logging.ts`, `classify.ts`, `validate.ts` and
  `client.ts`, re-exported from `index.ts`. The largest file has about 310 lines.
- Exports:
  - `createSystemOneClient`, `askSystemOne`, `listSystemOneModels` and `measureSystemOneInput`;
  - the SDK's own `noul`, `choice` and `score`, plus its question, answer and `ModelCard` types,
    re-exported;
  - the plan's types, plus the additions listed under Deviations.
- Tests:
  - 67 unit tests, all running the real SDK 0.6.0 through the `fetch` parameter;
  - no module mocking;
  - every plan id U1–U26 appears in a test title;
  - 100% coverage on statements, branches, functions and lines, with no `c8 ignore`.
- `perf/mutationMatrix.js` (§ 5.2):
  - it refuses to run without `--pkg`, and refuses a `--pkg` that is the package itself;
  - each row names the tests that must go red.
- `perf/systemOneLive.js` (§ 8, with `probe`, `parity` and `--check`) and
  `perf/parityQuestions.json`.
- § 10 updates:
  - `rush.json` entry;
  - lockfile change through `rush add` only;
  - a `minor` change file;
  - `README.md` (§ 7's table and rule, the threshold caveat, `clm-serve --host 127.0.0.1` /
    `CLM_API_KEY`, the keyless empty key, Ollama per U1, dependency posture and the not-in-scope
    list), `CAPABILITIES.md` and `etc/ts-extras-system-one.api.md`;
  - a `LIBRARY_CAPABILITIES.md` row and shortcut;
  - `result-integration-boundary.md`: a reference instance and the direct-dependency list;
  - an `ACTIVE_DEVELOPMENT.md` row;
  - status lines in `design.md`, `implementation-plan.md` and `docs/WORKSTREAMS.md`.

## Deviations from the plan

1. **A `score` answer's `legend` values are taken from the request's rubric. The server's values are
   not used.**
   - The server's legend keys are still checked against `0`…`n-1`, as § 3.6 requires.
   - § 3.3 makes `result` the SDK's `SystemOneResult<Q>`, whose `legend` is typed as the rubric's
     own (literal) entries. § 3.6 checks only the keys.
   - Passing the server's values through would therefore assert a type nothing checked. CLM renders
     a structured criterion as text (`schema.py` `to_text`), so a CLM legend can differ from the
     declared type.
   - The legend carries no information beyond the request, so projecting it from the request makes
     the type true by construction (code-reviewer P1-1, option a). Test: U18 "a score legend is the
     request's rubric".
2. **`ISystemOneRequest.state` is typed `EntryType`, not `SystemOneRequest<Q>['state']`.** It is the
   same type under a named alias, consistent with `measureSystemOneInput` (reviewer P1-2).
3. **Additional exported types:**
   - `ISystemOneUsage` (usage with optional `billing_units`, which the SDK's `Usage` lacks);
   - `ISystemOneTimingHeaders`;
   - `ISystemOneQuestionMeasure` and `ISystemOneCriterionMeasure` (the parts of
     `ISystemOneInputMeasure`);
   - `SystemOneAnswerResult<Q>` and `WithoutConfidence<T>` (the § 3.3 mapped type, named);
   - `allSystemOneFailureReasons` (the `as const` list behind `SystemOneFailureReason`).

   API Extractor requires every referenced type to be exported.
4. **`result.usage` carries only `input_tokens` and `output_tokens`. `meta.usage` adds
   `billing_units`.** `result` is the SDK type, which does not declare `billing_units`.
5. **The `noul` candidate measure, which the plan leaves partly unstated.**
   - I fetched the PyPI `contrastive-lm` 0.1.0 sdist, whose `schema.py` `candidates` is the source.
   - A `noul` candidate is `"<key>: "` plus either its description, or `"Yes. This is true: "` /
     `"No. This is false: "` plus the instructions. The prefix applies to the default too, which is
     what R5b's 106 assumes.
   - With neither a description nor instructions, CLM embeds `"<key>: <key>"`. I implemented that
     case as CLM does.
6. **Finiteness of probabilities, `noul` and `score` comes from the range check alone.**
   - `[0, 1]` and `[0, n-1]` reject `Infinity`, `-Infinity` and `NaN`, and JSON carries nothing
     else non-finite. A separate `Number.isFinite` there could never be shown load-bearing
     (reviewer P2-4).
   - `Number.isFinite` remains where it is the only guard: `usage` counts (`>= 0`).
   - So R22 targets `usage` (fixture `"input_tokens":1e999`). U16h keeps both cases.
7. **The answer-id check runs after the per-answer checks, not before.**
   - It is the type predicate that narrows the answers to the SDK's type for `Q`.
   - An answer with no question passes through unchecked, only so that check can name it as extra.
   - The type match is inside the per-answer check, with a message naming both types (reviewer
     P2-3).
   - Each of R15, R16 and R17 therefore has exactly one guard.
8. **Narrowing to the generic answer type is a type predicate (`isAnswerSetFor`), not a cast.**
   - § 3.6 says "no casts". The answer type is a function of the caller's generic `Q`, which no
     runtime value can name, so one assertion of that link is unavoidable.
   - It is placed at the step that establishes it, and its docstring says what it relies on.
9. **`baseUrl` is also refused with a query, a fragment or credentials.** The SDK concatenates
   `${baseURL}/v1/...`, and `fetch` refuses credentials (reviewer P3-3).
10. **`model` is trimmed, and the trimmed value is sent.** This is documented in TSDoc.
11. **The client object is frozen, and the SDK client and model are held in a `WeakMap`**, so what is
    sent never depends on the caller-held object. A client not made by `createSystemOneClient` fails
    `invalid-request`.
12. **`listSystemOneModels` failure messages carry the status and request id** for an
    `invalid-response` after a 2xx (§ 3.5's message rule, applied to § 3.7).
13. **Mutation wording, where the plan's text could not be expressed literally:**
    - R1 sends an unchecked SDK call before the bound;
    - R24 replaces the body conversion with an unchecked pass-through;
    - R29 is one edit reverting both the sink and the level;
    - R32 replaces the measured interval with zero. The boundary cannot see SDK attempts, so "time
      only the last attempt" has no textual form.

    Each row still protects what the plan says.
14. **R20's fixture boundary.** U20's `elapsedMs` test uses a 45 ms first attempt and asserts
    `>= 40`, against the plan's 40 / `>= 40`. `Date.now()` granularity could make an exact-40 test
    flaky.

## The orchestrator's beliefs

1. **Right.** `rush add -p @typesafe-ai/sdk@~0.6.0` resolved 0.6.0. The lockfile diff is only the new
   importer and the SDK entry. `rush install` then `rush install --purge` (a clean install verified
   against the policies) exited 0 with no rejection. No `minimumReleaseAgeExclude` was added.
2. **Right.** Every § 9 behaviour holds in the installed `dist/index.mjs` / `index.d.cts`:
   - explicit-over-env with `??`, so `''` is used as given;
   - `debug` logs bodies;
   - synchronous base `TypeSafeError` from `validateQuestions`;
   - `APITimeoutError extends APIConnectionError`;
   - status classes 400/401/403/404/422/429/≥500, and default retries 408, 429 and 500–599;
   - non-JSON 2xx as a string, empty as `undefined`;
   - the `models` unwrap throws a base error inside the parse;
   - `withResponse()` → `requestId`;
   - the `Fetch` type.

   One detail, which does not change § 3: with an already-aborted signal the SDK still calls
   `fetch`, with an aborted signal. The test fixture's fetch rejects on that, as the platform
   `fetch` does.
3. **Right.** `verify-bundler-resolution.mjs`: `ok @fgv/ts-extras-system-one -> ./lib/index.js`. No
   `NEEDS_NODE_BUILTINS` entry was added.
4. **Right for this sandbox.** `https://api.typesafe.ai` → `CONNECT tunnel failed, response 403` from
   the egress proxy. There is no key in the environment, and no GPU or Olares.

## Live checks

| leg | status |
|---|---|
| L1 remote development server | **not run live** (egress refused, no key) |
| L2 `clm-serve` + vLLM on the Olares One | **not run live** |
| L3 E33 windows via `/tokenize` | **not run live** |
| L4 Ollama probe per environment | **not run live** |
| L5 parity | **not run live** |

Only `perf/systemOneLive.js --check` was run, for both modes: exit 0. Under decision U2, the cluster
close waits for a recorded L1.

## Revert matrix

Run with `node perf/mutationMatrix.js --pkg <copy>` against a copy of the package at `3705870c`,
whose `node_modules` was a symlink to the package's own. It took 3 m 58 s and exited 0.

```
R1 the bound runs after the SDK call [must go red: U1]: VERIFIED (17 red)
    askSystemOne › U10 an empty question set, or a score question with one level, is invalid-request with no request made
    askSystemOne › failure classification › U13 a 529 is retried and then server; a 503 then 200 succeeds
    askSystemOne › failure classification › U15 an abort during back-off is aborted, with no further request
    askSystemOne › failure classification › U15 an abort, before or during the request, is aborted
    askSystemOne › meta › U20 elapsedMs covers retries and back-off
    createSystemOneClient › U23 with no logger, console is never called
    the input bound › U1 the bound refuses before any request
    the input bound › U2 a measure equal to maxChars is sent; one more is refused
    the input bound › U3 the measure counts the instructions and the two-character separator
    the input bound › U4 each candidate is bounded separately and named in the failure
    the input bound › U5 a structured state is measured by its JSON serialization
    the input bound › U7 'unchecked' skips the bound and the request is sent
    the input bound › U9 maxChars -5 is invalid-request, with no request made
    the input bound › U9 maxChars 0 is invalid-request, with no request made
    the input bound › U9 maxChars 2.5 is invalid-request, with no request made
    the input bound › U9 maxChars Infinity is invalid-request, with no request made
    the input bound › U9 maxChars NaN is invalid-request, with no request made
R2 >= instead of > [must go red: U2]: VERIFIED (1 red)
    the input bound › U2 a measure equal to maxChars is sent; one more is refused
R3 the separator is not counted [must go red: U3]: VERIFIED (5 red)
    the input bound › U2 a measure equal to maxChars is sent; one more is refused
    the input bound › U26 measureSystemOneInput returns the numbers the refusal reports
    the input bound › U3 the measure counts the instructions and the two-character separator
    the input bound › U5 a structured state is measured by its JSON serialization
    the input bound › U6 the failure names the question that is over
R4 the instructions are not counted [must go red: U3]: VERIFIED (3 red)
    the input bound › U26 measureSystemOneInput returns the numbers the refusal reports
    the input bound › U3 the measure counts the instructions and the two-character separator
    the input bound › U6 the failure names the question that is over
R5 the criteria are not bounded [must go red: U4]: VERIFIED (2 red)
    the input bound › U26 measureSystemOneInput returns the numbers the refusal reports
    the input bound › U4 each candidate is bounded separately and named in the failure
R5b noul's default candidate is not measured [must go red: U4]: VERIFIED (2 red)
    the input bound › U26 measureSystemOneInput returns the numbers the refusal reports
    the input bound › U4 each candidate is bounded separately and named in the failure
R6 a structured state is measured as String(state) [must go red: U5]: VERIFIED (2 red)
    the input bound › U26 measureSystemOneInput returns the numbers the refusal reports
    the input bound › U5 a structured state is measured by its JSON serialization
R7 the refusal names the first question [must go red: U6]: VERIFIED (1 red)
    the input bound › U6 the failure names the question that is over
R8 'unchecked' is treated as maxChars: 0 [must go red: U7]: VERIFIED (34 red)
    askSystemOne › U10 an empty question set, or a score question with one level, is invalid-request with no request made
    askSystemOne › failure classification › U11 every classification row has its own reason
    askSystemOne › failure classification › U11 the failure message carries the status and the request id
    askSystemOne › failure classification › U13 a 529 is retried and then server; a 503 then 200 succeeds
    askSystemOne › failure classification › U14 a fetch that never settles is timeout; a fetch that rejects is connection
    askSystemOne › failure classification › U15 an abort during back-off is aborted, with no further request
    askSystemOne › failure classification › U15 an abort, before or during the request, is aborted
    askSystemOne › failure classification › U17 a 2xx body that is not JSON, or is empty, is invalid-response
    askSystemOne › meta › U20 billing_units is kept only when it is a finite number
    askSystemOne › meta › U20 elapsedMs covers retries and back-off
    askSystemOne › meta › U20 requestId is undefined and timing headers are omitted when the server sends none
    askSystemOne › meta › U20 requestId, timing headers, model and usage come from the response
    askSystemOne › response validation › U16a an extra answer id, of any type, is invalid-response
    askSystemOne › response validation › U16a an extra noul answer id is invalid-response
    askSystemOne › response validation › U16b a missing answer id is invalid-response
    askSystemOne › response validation › U16c an answer whose type is not its question's is invalid-response
    askSystemOne › response validation › U16d choice probability keys must equal the criteria keys
    askSystemOne › response validation › U16e the choice must be one of the labels
    askSystemOne › response validation › U16f the score must be within [0, n-1]
    askSystemOne › response validation › U16g noul must be within [0, 1]
    askSystemOne › response validation › U16h a non-finite value is invalid-response
    askSystemOne › response validation › U16i each distribution must sum to 1 within 1e-3
    askSystemOne › response validation › U16j score probability keys and legend keys must be exactly 0..n-1
    askSystemOne › response validation › U16k model must be a non-empty string and usage finite counts >= 0
    askSystemOne › response validation › U18 a score legend is the request’s rubric, whatever text the server echoed
    askSystemOne › response validation › U18 choice and score answers carry no confidence, and no undeclared field survives
    createSystemOneClient › U21 the request body carries the configured model, whatever TYPESAFE_DEFAULT_MODEL says
    createSystemOneClient › U22 the configured baseUrl is the one called, whatever TYPESAFE_BASE_URL says
    createSystemOneClient › U23 the state never reaches a log, even with TYPESAFE_LOG_LEVEL=debug and a logger at all
    createSystemOneClient › U23 with no logger, console is never called
    createSystemOneClient › U24 rejects a relative or non-http(s) baseUrl and a blank model; accepts an empty apiKey
    createSystemOneClient › a client not created by createSystemOneClient is refused
    createSystemOneClient › the client is frozen, and the model sent is the one it was created with
    the input bound › U7 'unchecked' skips the bound and the request is sent
R9 the SDK's synchronous throw is not captured [must go red: U10]: VERIFIED (1 red)
    askSystemOne › U10 an empty question set, or a score question with one level, is invalid-request with no request made
R10 connection is tested before timeout [must go red: U14]: VERIFIED (2 red)
    askSystemOne › failure classification › U11 every classification row has its own reason
    askSystemOne › failure classification › U14 a fetch that never settles is timeout; a fetch that rejects is connection
R11 abort is not classified [must go red: U15]: VERIFIED (3 red)
    askSystemOne › failure classification › U15 an abort during back-off is aborted, with no further request
    askSystemOne › failure classification › U15 an abort, before or during the request, is aborted
    classifyError › the SDK error classes classify by class
R12 other 4xx fall through to server [must go red: U12]: VERIFIED (2 red)
    askSystemOne › failure classification › U11 every classification row has its own reason
    askSystemOne › failure classification › U12 an unknown model or bad request is invalid-request on every backend
R13 401/403 are invalid-request [must go red: U11]: VERIFIED (3 red)
    askSystemOne › failure classification › U11 every classification row has its own reason
    askSystemOne › failure classification › U11 the failure message carries the status and the request id
    listSystemOneModels › U19 an HTTP failure is classified as askSystemOne would
R14 408 is not timeout [must go red: U11]: VERIFIED (1 red)
    askSystemOne › failure classification › U11 every classification row has its own reason
R15 only "every question answered" is checked [must go red: U16a]: VERIFIED (2 red)
    askSystemOne › response validation › U16a an extra answer id, of any type, is invalid-response
    askSystemOne › response validation › U16a an extra noul answer id is invalid-response
R16 no answer-id check at all [must go red: U16b]: VERIFIED (3 red)
    askSystemOne › response validation › U16a an extra answer id, of any type, is invalid-response
    askSystemOne › response validation › U16a an extra noul answer id is invalid-response
    askSystemOne › response validation › U16b a missing answer id is invalid-response
R17 no answer-type check [must go red: U16c]: VERIFIED (1 red)
    askSystemOne › response validation › U16c an answer whose type is not its question's is invalid-response
R18 key sets compared by count [must go red: U16d]: VERIFIED (2 red)
    askSystemOne › response validation › U16d choice probability keys must equal the criteria keys
    askSystemOne › response validation › U16j score probability keys and legend keys must be exactly 0..n-1
R19 the choice need not be a label [must go red: U16e]: VERIFIED (1 red)
    askSystemOne › response validation › U16e the choice must be one of the labels
R20 the score may reach n [must go red: U16f]: VERIFIED (1 red)
    askSystemOne › response validation › U16f the score must be within [0, n-1]
R21 no upper bound on a probability [must go red: U16g]: VERIFIED (1 red)
    askSystemOne › response validation › U16g noul must be within [0, 1]
R22 non-finite values accepted (usage counts; a probability’s finiteness is its [0, 1] range, which R21 covers) [must go red: U16h]: VERIFIED (1 red)
    askSystemOne › response validation › U16h a non-finite value is invalid-response
R23 no sum check [must go red: U16i]: VERIFIED (1 red)
    askSystemOne › response validation › U16i each distribution must sum to 1 within 1e-3
R24 a non-object body is not converted [must go red: U17]: VERIFIED (6 red)
    askSystemOne › failure classification › U11 every classification row has its own reason
    askSystemOne › failure classification › U17 a 2xx body that is not JSON, or is empty, is invalid-response
    askSystemOne › meta › U20 billing_units is kept only when it is a finite number
    askSystemOne › response validation › U16h a non-finite value is invalid-response
    askSystemOne › response validation › U16k model must be a non-empty string and usage finite counts >= 0
    askSystemOne › response validation › U18 choice and score answers carry no confidence, and no undeclared field survives
R25 the server's choice answer is passed through [must go red: U18]: VERIFIED (1 red)
    askSystemOne › response validation › U18 choice and score answers carry no confidence, and no undeclared field survives
R26 model is in neither the request nor defaultModel [must go red: U21]: VERIFIED (2 red)
    createSystemOneClient › U21 the request body carries the configured model, whatever TYPESAFE_DEFAULT_MODEL says
    createSystemOneClient › the client is frozen, and the model sent is the one it was created with
R27 baseURL is not passed [must go red: U22]: VERIFIED (2 red)
    createSystemOneClient › U22 the configured baseUrl is the one called, whatever TYPESAFE_BASE_URL says
    listSystemOneModels › U19 a CLM { models: [...] } body succeeds, keeping only the declared fields
R28 an ILogger at all maps to debug [must go red: U23]: VERIFIED (4 red)
    createSystemOneClient › U23 the state never reaches a log, even with TYPESAFE_LOG_LEVEL=debug and a logger at all
    sdkLogging › an ILogger at all gives the SDK info, never debug
    sdkLogging › an ILogger at detail gives the SDK info, never debug
    sdkLogging › an ILogger at info gives the SDK info, never debug
R29 no logger: neither the no-op sink nor the off level (each masks the other) [must go red: U23]: VERIFIED (2 red)
    createSystemOneClient › U23 with no logger, console is never called
    sdkLogging › no logger turns SDK logging off with a sink that discards
R30 requestId read from the body [must go red: U20]: VERIFIED (1 red)
    askSystemOne › meta › U20 requestId, timing headers, model and usage come from the response
R31 server-timing parsed to a number [must go red: U20]: VERIFIED (2 red)
    askSystemOne › meta › U20 requestId is undefined and timing headers are omitted when the server sends none
    askSystemOne › meta › U20 requestId, timing headers, model and usage come from the response
R32 elapsedMs does not cover retries [must go red: U20]: VERIFIED (1 red)
    askSystemOne › meta › U20 elapsedMs covers retries and back-off
R33 the models shape error is invalid-request [must go red: U19]: VERIFIED (1 red)
    listSystemOneModels › U19 a bare array is invalid-response

34 rows; 0 not VERIFIED
```

## `code-reviewer` findings and disposition

The reviewer ran after the functional tests and before coverage closure, on `0a4d7c93`, read-only.
It found no `any`, no production casts, no `console`, no temporal comments, and correct runtime-mode
handling throughout (environment variables, log level, abort versus timeout, text bodies, retries).

**P1**
- **P1-1** The predicate claimed `legend` literal types that nothing checked. **Fixed:** the legend is
  projected from the request (deviation 1), the narrowing now sits at the id check, and its
  docstring was rewritten.
- **P1-2** `state` used an indexed-access type. **Fixed** (deviation 2).

**P2**
- **P2-1** Three stacked `isFailure` checks in `askSystemOne`. **Fixed:** one chain, with `startCall`
  and `bindingFor`. `checkInputLimit`'s detail is widened to `SystemOneFailureReason`.
- **P2-2** `answerFrom` was imperative. **Fixed:** it is now a chain, with `metaFor` extracted.
- **P2-3** `checkAnswer`'s fallback message was misleading, and it was exported only for a test.
  **Fixed:** the type match now lives inside it, the message names both types, and it is no longer
  exported.
- **P2-4** U16h's probability case passed for the wrong reason. **Fixed:** the redundant
  `Number.isFinite` checks are removed, and R22 retargets the `usage` count (deviation 6).
- **P2-5** The empty key was not tested against `TYPESAFE_API_KEY`. **Fixed:** U24 sets it.
- **P2-6** Models failures lacked the status and request id. **Fixed** (deviation 12).
- **P2-7** README, CAPABILITIES, `perf/` and the change file were not yet committed. **Fixed** in
  `61d8125f`.

**P3**
- **P3-1** The logging TSDoc was wrong. **Fixed**, and it now says the SDK level is snapshotted at
  construction.
- **P3-2** The `model` trim was undocumented. **Documented.**
- **P3-3** `baseUrl` checking. **Fixed** (deviation 9).
- **P3-4** `client.model` was read from the caller-held object. **Fixed** (deviation 11).
- **P3-5** Hand-rolled dispatch. **Fixed:** `Converters.discriminatedObject`.
- **P3-6** `typeof` inside converters. **Fixed:** `billing_units` goes through a finite
  `Validators.number`, and `legendEntry` is gone.
- **P3-7** Duplicated key comparison. **Fixed:** `sameKeys` is reused and `describeAnswerSet` is
  simplified.
- **P3-8** The logger-mapping test was weak. **Fixed:** it spies on each method.
- **P3-9** Abort during back-off was not tested. **Added** to U15.
- **P3-10** The defaults behind `timeoutMs` were undocumented. **Documented.**
- **P3-11** UTF-16 code units and the untrimmed over-measure. **Documented** in TSDoc and README.
- **P3-12** Test labels. **Partly applied.** The direct `classifyError` test is labelled U11 ("anything
  else thrown"). U11's main test keeps one `invalid-response` row so that every § 3.5 row has a
  fixture there.

No finding was deferred.

## Gates

All run on 2026-10-03 at `3a952c29`, from the repo root unless noted.

**`node common/scripts/install-run-rush.js rebuild`:** exit 0, `SUCCESS: 38 operations`, 4 m 35 s.
- `grep -cE "not met|FAILURE|Operations failed|Error:|error TS"`: **0**.
- `grep -ciE warning`: **1**. That line is Rush's repo-state notice, "Detected 1 Git-tracked symlinks"
  (`.agents/skills`, from `c27dd647`, not this branch). There are no build or lint warnings.
- The log has no NUL padding.

**`change --verify --target-branch origin/integration/system-one-decisions`:** exit 0. It found
`common/changes/@fgv/ts-extras-system-one/system-one-phase-c_2026-10-03.json` (`minor`).

**In the package:**
- `rushx test`: exit 0; 67 passed, 0 failed; 100/100/100/100; 0 warnings.
- `rushx lint`: exit 0, 0 warnings.
- `rushx fixlint` was run before the final source commit.

**Capability and bundler scripts:**
- `verify-capability-docs.mjs`: exit 0 (25/25 documented, 0 failed).
- `generate-capability-feed.mjs --check`: exit 0 (0 stale).
- `verify-bundler-resolution.mjs`: exit 0 (21 checked, 0 failed).

**Package artefacts:**
- `etc/ts-extras-system-one.api.md` is checked in, with no `ae-` warnings in it.
- `perf/systemOneLive.js --check`: exit 0 for `probe` and for `parity`.

**Not run:** a repo-wide `rush test`. This change adds a package and changes no other package's
source or accepted behaviour, so `CODING_STANDARDS.md`'s widened-behaviour rule does not apply.

## What the brief or the plan got wrong

1. **The plan's R22 could not be made VERIFIED as written.** "Drop `Number.isFinite`" on a probability
   is masked by the `[0, 1]` range check, by construction. I resolved it by not keeping an unprovable
   guard and retargeting the row (deviation 6). It protects the same property, non-finite values
   rejected, so it does not change what the row protects, and it was not a stop condition.
2. **R15–R17's "wrong answers" presuppose a specific iteration order.** As written in the plan, the
   rows contradict each other: R15's wrong answer assumes iteration over questions, R16's over
   answers. The validator was ordered so that each row has exactly one guard (deviation 7).
3. **§ 3.6 checks only the legend keys, while § 3.3 types `result` as the SDK's.** These are
   incompatible without deviation 1.
4. **§ 3.3's "no casts" cannot hold literally for a generic answer type** (deviation 8).
5. **The brief says the U2 decision makes Phase C "not your gate", which is right.** Plan § 4's "every
   § 5 test exists" and the brief's matrix rule were achievable in full, and were met.

The plan's `--check` patterns must be re-checked after the commit hook: the repo's pre-commit
prettier reformats source, which once moved two patterns (R24, R33) out of reach. `--check` caught
it; the full run above is post-commit.
