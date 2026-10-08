# Result — `system-one-impl` (Phase C of `system-one-decisions`)

## What shipped

A new package, `@fgv/ts-extras-system-one` (`libraries/ts-extras-system-one`), slice S1 of
[`implementation-plan.md`](../../../docs/design/system-one-decisions/implementation-plan.md).

- Source is in `src/`: `types.ts`, `measure.ts`, `logging.ts`, `classify.ts`, `shapes.ts`,
  `validate.ts` and `client.ts`, re-exported from `index.ts`. The largest are `shapes.ts` and
  `validate.ts`, at 390 lines each.
- Exports:
  - `createSystemOneClient`, `askSystemOne`, `listSystemOneModels` and `measureSystemOneInput`;
  - the SDK's own `noul`, `choice` and `score`, plus its question, answer and `ModelCard` types,
    re-exported;
  - the plan's types, plus the additions listed under Deviations.
- Tests:
  - 97 unit tests, all running the real SDK 0.6.0 through the `fetch` parameter;
  - no module mocking;
  - every plan id U1–U26 appears in a test title, plus U27–U38 (malformed input, cycles, JSON entries,
    reserved keys at any depth, the factories, read-once input, throwing Proxies and the logger
    level, added at the review rounds);
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
14. **R32's fixture.** U20's `elapsedMs` test uses a 45 ms first attempt and asserts
    `>= 40`, against the plan's 40 / `>= 40`. `Date.now()` granularity could make an exact-40 test
    flaky.

15. **`measureSystemOneInput` returns `Result<ISystemOneInputMeasure>`**, not a bare measure (plan § 3.1
    says "pure; cannot fail"). Input outside the declared types — a `score` with no `criteria`, a
    `choice` with `null` criteria, a state that cannot be serialized (circular, `bigint`) — threw, and
    from inside `askSystemOne` that became a rejection rather than a `Result` (gate-time review
    P2-A). The measure now runs in `captureResult`; `inputLimit` is parsed by a converter first, so a
    missing or mis-shaped limit is `invalid-request` with a message naming the expected shape.
    `askSystemOne` never rejects.
16. **No failure message quotes the server's body or any received value.**
    - The SDK builds `APIError.message` from the body (see "P2-B" below), so a non-2xx failure names
      the error class instead (`UnprocessableEntityError`), with status and request id. This drops
      the server's own explanation (for example CLM's "unknown model …"), a deliberate cost.
    - A 2xx shape failure names the top-level fields at fault and the question ids whose answers
      are malformed, and counts malformed answers with no question; it never quotes a value.
    - The semantic checks name only request-derived labels and counts: a rejected `choice`, received
      probability or legend keys, and extra answer ids are counted or described, never quoted.
17. **A whitespace-only description is measured as the larger of its own length and the default's**
    (gate-time P3-2). CLM treats only `null` and `''` as absent, and embeds whitespace as written
    (then trims), so treating whitespace as empty would *under*-measure a `choice` whose 50-space
    description has a 1-character key. The larger of the two over-measures whichever CLM does.
18. **`baseUrl` refuses a raw `?` or `#`** anywhere in the string (gate-time P3-1): `http://h/?`
    parses to an empty `search`, yet the SDK appends paths to the raw string.

19. **The sum tolerance allows binary rounding** (Copilot round 1): the check is
    `|sum − 1| > 1e-3 + 8·Number.EPSILON`. Without the allowance, `0.499 + 0.5` (which misses 1 by
    `0.0010000000000000009` in binary) was rejected while the equal upper boundary `0.501 + 0.5` was
    accepted. Plan § 3.6's "within 1e-3" now holds at both boundaries; `0.4989 + 0.5` and
    `0.5011 + 0.5` still fail.
20. **No 2xx failure quotes a received number either** (Copilot round 1): the sum, the `noul` value
    and the `score` value are no longer in their messages, which name the question id and the
    configured bound. Deviation 16 now holds without exception.
21. **A rejected `baseUrl` is never echoed** (Copilot round 1): it can carry credentials or a token in
    its query, so the message names the constraint only.

22. **Every exported function converts a JavaScript caller's input before reading it** (Copilot
    round 3). The shape gates are in `src/shapes.ts`, and their messages name fields or the caller's
    own question ids, never a value. A malformed input is `invalid-request`, never a throw or a
    rejection.
    - `askSystemOne` checks the whole request, every question included, before the bound, so a
      malformed question is `invalid-request` in `'unchecked'` mode too.
    - The bound no longer re-checks the questions. That second check could never be shown
      load-bearing (R42 went `0 red`).
    - A question of an unknown `type` is now refused. Before, it was sent and left to the server.
23. **Every failure message of a `Result`-returning entry point starts with its reason**
    (`createSystemOneClient`, `listSystemOneModels`, `measureSystemOneInput`), as `askSystemOne`'s
    detail does. `createSystemOneClient`'s messages gained the `invalid-request: ` prefix.
24. **`noul` / `choice` / `score` stay the SDK's own constructors** (plan § 3.1, U25). **Decided** by
    the orchestrator on 2026-10-08, no longer open. The reasoning:
    - They read no fields, so a typed caller cannot build a malformed question with them.
    - A JavaScript caller's malformed question is refused as `invalid-request` by the request gate in
      `askSystemOne` / `measureSystemOneInput`. That gate is the one place that also covers
      questions built without the factories.
    - U32 builds malformed questions with the factories, as a JavaScript caller would, and asserts
      `invalid-request` at `askSystemOne` with nothing sent.

    One correction to the premise "they cannot throw", found while writing U32: `noul` and `choice`
    are plain object literals, but the SDK's `score` throws its `TypeSafeError` when its criteria
    are not a list (`dist/index.mjs`, `score`). That check is the SDK's, and it runs in the caller's
    code before any call into this package. U32 pins it. It does not change the decision, since a
    wrapper is the only way to change it and that is what § 3.1 rules out.
25. **An `EntryType` is JSON, all the way down** (Copilot round 4). The state, every instruction and
    every criterion value are checked with `@fgv/ts-json-base`'s `Converters.jsonValue`, now a direct
    dependency of this package, added with `rush add`. That converter refuses a `Map`, `Set`, `Date`,
    `RegExp`, `bigint`, `undefined` or `NaN` anywhere inside. The top level is then restricted to
    text, an object, an array or `null`. Before, the check was `typeof === 'object'`, which let a
    `Map` state through to be serialized as `{}`.
26. **No conversion of a caller's or a server's value can throw** (Copilot round 4). A ts-utils
    converter formats its failure with `JSON.stringify(from)`, which throws on a cycle or a `bigint`,
    and the recursive JSON check overflows the stack on a cycle. Every such conversion now goes
    through `safeConvert` (`shapes.ts`), which turns a throw into a failure. Each caller already
    replaces the message with fixed text. As a result, `measureSystemOneInput` no longer needs its
    `captureResult` around the measure: the gate refuses anything the measure's `JSON.stringify`
    could throw on.
27. **An own `__proto__` key is refused, not dropped** (Copilot round 4). `Converters.recordOf` writes
    each key into `{}`, where `__proto__` sets the prototype instead of creating a key, so the key
    vanished before any exact-key check could see it. `ownRecordOf` (`shapes.ts`) refuses such a
    record before converting it. On the response side this covers the probabilities, the legend
    and the answer set (`invalid-response`). On the request side it covers question ids, choice
    labels and the request and parameter objects (`invalid-request`). **Upstream, for the
    orchestrator:** `Converters.recordOf` in `@fgv/ts-utils` drops an own `__proto__` key silently.
    When the value is an object, it also sets that object as the result's prototype. `ts-utils` is
    an established surface, so this PR works around it locally and leaves `ts-utils` unchanged.
    **`@fgv/ts-json-base`'s `jsonObject` has the same flaw, with the same fix** (round 6): it copies
    each key with `obj[name] = v`, so a `__proto__` key at any depth becomes the copy's prototype
    and is dropped from what is serialized. Both want to create keys rather than assign them
    (`Object.defineProperty`, or `Object.fromEntries`), or to refuse the key.

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

28. **The caller's input is read once** (Copilot round 5). Every gate in `shapes.ts` returns the
    value it converted, and every entry point uses only that value afterwards. A getter or a Proxy
    therefore cannot answer the check one way and the send another. A caller's object is
    snapshotted before its fields are converted, and every converted value is a new object, apart
    from the pass-throughs listed in round 5, item 1.
    - A choice between two shapes (`inputLimit`, a noul's `criteria`) is no longer a `oneOf`. The
      failed alternative formats the value it was given, which reads the caller's getters before
      the matching alternative reads them again.
    - The SDK itself reads each retry field twice (`=== void 0`, then its range check), so `retry`
      is copied too.
29. **A `score` question with one level is refused by the gate**, not by the SDK. The converted
    levels are typed as the SDK's own at-least-two tuple, so a converted question needs no cast to
    be sent. U10 now expects `invalid-request: [s] are not well-formed noul, choice or score
    questions` where it expected the SDK's `Score question "s" has 1 criteria`. It is still
    `invalid-request` with nothing sent.
30. **`retry` is converted, not passed through.** Only the fields `RetryPolicy` declares are copied:
    numbers, booleans, and `httpStatuses` as a new `Set`. A field of the wrong type is now
    `invalid [retry]` from the gate rather than the SDK's message. An undeclared field, which the SDK
    ignored, is dropped. The SDK still checks the ranges.
31. **A logger's `logLevel` must be a `Logging.ReporterLogLevel`**, converted with ts-utils' published
    `Logging.reporterLogLevel`. `'debug'`, `'verbose'`, `'INFO'` and `''` are `invalid [logger]`.
    Before, any string was accepted and treated as `info`.

32. **A JSON entry is refused when it holds an own `__proto__` key at any depth** (Copilot round 6).
    The state, every instruction and every criterion value are walked before the JSON conversion,
    by `withoutReservedKeys` (`shapes.ts`).
    - The walk descends exactly where `jsonValue` does, using its own `isJsonArray` / `isJsonObject`,
      and reads each value once.
    - It builds a snapshot with `Object.fromEntries`, which creates keys rather than assigning them.
      The JSON converter then converts that snapshot, so the caller's input is still read once
      (deviation 28).
    - A cycle or a throwing Proxy inside a value fails within the existing `safeConvert` guard.

## Revert matrix

Run with `node perf/mutationMatrix.js --pkg <copy>` against a real copy of the package at `4edb198f`
(no links: only `node_modules` was a symlink to the package's). It exited 0.
- Rows added by round: R34–R37 at the gate-time review; R38–R40 (with R39b, R39c) at Copilot round
  1; harness rows H1–H4 at round 2; R41–R46 and H5–H8 at round 3; R47–R62 and H9–H13 at round 4;
  R63–R75 at round 5; R76–R79, H14 and H15 at round 6.
- R1, R8, R19, R23, R24, R32, R34, R38, R41, R42, R45, R46, R50, R51, R58 and R60–R62 were re-pointed
  after refactors.
- A row whose mutant does not compile is reported UNVERIFIED (as "did not build", or, when the
  compiler's output does not say `error TS`, "the run reported no failure count"), never as
  VERIFIED. At round 4, R58 and R59 first came back that way, and at round 5, R45; each mutant was
  rewritten to compile, and the run below is clean.
- The R rows run the jest suite. The H rows mutate `perf/systemOneLive.js`, which jest does not
  cover: they rebuild the package from its restored source and run `perf/systemOneLive.selftest.js`,
  which drives the harness against local stub servers and reports in jest's `●` / `Failures:` shape.

```
R1 the bound runs after the SDK call [must go red: U1]: VERIFIED (28 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U27b a malformed question is invalid-request in unchecked mode too, with nothing sent
    a JavaScript caller’s malformed input is a classified Result, never a throw › U29 askSystemOne checks the request before reading any field, and every failure has a reason
    a JavaScript caller’s malformed input is a classified Result, never a throw › U32 the factories are plain constructors: a malformed factory-built question is refused at askSystemOne
    a Proxy whose traps throw is a classified failure, never a throw › U36 askSystemOne refuses a throwing request, questions, question or criteria, with nothing sent
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ question id or choice label is invalid-request, with nothing sent
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 a nested __proto__ in the state, an instruction or any criterion is invalid-request, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 askSystemOne refuses a cycle anywhere in the request, with nothing sent
    an EntryType is JSON: text, a JSON object or array, or null, all the way down › U31 JSON entries of every allowed kind are still accepted
    an EntryType is JSON: text, a JSON object or array, or null, all the way down › U31 a state, instruction or criterion that is not JSON is refused, with nothing sent
    askSystemOne › U10 an empty question set, or a score question with one level, is invalid-request with no request made
    askSystemOne › failure classification › U13 a 529 is retried and then server; a 503 then 200 succeeds
    askSystemOne › failure classification › U15 an abort during back-off is aborted, with no further request
    askSystemOne › failure classification › U15 an abort, before or during the request, is aborted
    askSystemOne › meta › U20 elapsedMs covers retries and back-off
    createSystemOneClient › U23 with no logger, console is never called
    every entry point reads the caller’s input once, and uses only what it converted › U35 askSystemOne bounds, sends and validates against one read of the request
    the input bound › U1 the bound refuses before any request
    the input bound › U2 a measure equal to maxChars is sent; one more is refused
    the input bound › U27 malformed input is invalid-request, resolved, with no request made
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
R5b noul's default candidate is not measured [must go red: U4]: VERIFIED (3 red)
    the input bound › U26 measureSystemOneInput returns the numbers the refusal reports
    the input bound › U4 a whitespace-only description is measured as the larger of itself and the default
    the input bound › U4 each candidate is bounded separately and named in the failure
R6 a structured state is measured as String(state) [must go red: U5]: VERIFIED (2 red)
    the input bound › U26 measureSystemOneInput returns the numbers the refusal reports
    the input bound › U5 a structured state is measured by its JSON serialization
R7 the refusal names the first question [must go red: U6]: VERIFIED (1 red)
    the input bound › U6 the failure names the question that is over
R8 'unchecked' is treated as maxChars: 0 [must go red: U7]: VERIFIED (39 red)
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ probability, legend level or answer id is invalid-response
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 a nested __proto__ in a received distribution whose value is an object is invalid-response
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 nested JSON without a reserved key is sent intact
    an EntryType is JSON: text, a JSON object or array, or null, all the way down › U31 JSON entries of every allowed kind are still accepted
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
    askSystemOne › response validation › U16f the score must be within [0, n-1], and the failure does not quote it
    askSystemOne › response validation › U16g noul must be within [0, 1], and the failure does not quote it
    askSystemOne › response validation › U16h a non-finite value is invalid-response
    askSystemOne › response validation › U16i each distribution must sum to 1 within 1e-3, at both boundaries, without quoting the sum
    askSystemOne › response validation › U16j score probability keys and legend keys must be exactly 0..n-1
    askSystemOne › response validation › U16k model must be a non-empty string and usage finite counts >= 0
    askSystemOne › response validation › U18 a score legend is the request’s rubric, whatever text the server echoed
    askSystemOne › response validation › U18 choice and score answers carry no confidence, and no undeclared field survives
    createSystemOneClient › U21 the request body carries the configured model, whatever TYPESAFE_DEFAULT_MODEL says
    createSystemOneClient › U22 the configured baseUrl is the one called, whatever TYPESAFE_BASE_URL says
    createSystemOneClient › U23 a server that echoes the state puts it in no failure message and no log
    createSystemOneClient › U23 the state never reaches a log, even with TYPESAFE_LOG_LEVEL=debug and a logger at all
    createSystemOneClient › U23 with no logger, console is never called
    createSystemOneClient › U24 rejects a relative or non-http(s) baseUrl and a blank model; accepts an empty apiKey
    createSystemOneClient › a client not created by createSystemOneClient is refused
    createSystemOneClient › the client is frozen, and the model sent is the one it was created with
    every entry point reads the caller’s input once, and uses only what it converted › U35 createSystemOneClient builds the client from one read of each parameter
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
R15 only "every question answered" is checked [must go red: U16a]: VERIFIED (3 red)
    askSystemOne › response validation › U16a an extra answer id, of any type, is invalid-response
    askSystemOne › response validation › U16a an extra noul answer id is invalid-response
    createSystemOneClient › U23 a server that echoes the state puts it in no failure message and no log
R16 no answer-id check at all [must go red: U16b]: VERIFIED (4 red)
    askSystemOne › response validation › U16a an extra answer id, of any type, is invalid-response
    askSystemOne › response validation › U16a an extra noul answer id is invalid-response
    askSystemOne › response validation › U16b a missing answer id is invalid-response
    createSystemOneClient › U23 a server that echoes the state puts it in no failure message and no log
R17 no answer-type check [must go red: U16c]: VERIFIED (1 red)
    askSystemOne › response validation › U16c an answer whose type is not its question's is invalid-response
R18 key sets compared by count [must go red: U16d]: VERIFIED (3 red)
    askSystemOne › response validation › U16d choice probability keys must equal the criteria keys
    askSystemOne › response validation › U16j score probability keys and legend keys must be exactly 0..n-1
    createSystemOneClient › U23 a server that echoes the state puts it in no failure message and no log
R19 the choice need not be a label [must go red: U16e]: VERIFIED (2 red)
    askSystemOne › response validation › U16e the choice must be one of the labels
    createSystemOneClient › U23 a server that echoes the state puts it in no failure message and no log
R20 the score may reach n [must go red: U16f]: VERIFIED (1 red)
    askSystemOne › response validation › U16f the score must be within [0, n-1], and the failure does not quote it
R21 no upper bound on a probability [must go red: U16g]: VERIFIED (1 red)
    askSystemOne › response validation › U16g noul must be within [0, 1], and the failure does not quote it
R22 non-finite values accepted (usage counts; a probability’s finiteness is its [0, 1] range, which R21 covers) [must go red: U16h]: VERIFIED (1 red)
    askSystemOne › response validation › U16h a non-finite value is invalid-response
R23 no sum check [must go red: U16i]: VERIFIED (1 red)
    askSystemOne › response validation › U16i each distribution must sum to 1 within 1e-3, at both boundaries, without quoting the sum
R24 a non-object body is not converted [must go red: U17]: VERIFIED (11 red)
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ probability, legend level or answer id is invalid-response
    askSystemOne › failure classification › U11 every classification row has its own reason
    askSystemOne › failure classification › U17 a 2xx body that is not JSON, or is empty, is invalid-response
    askSystemOne › meta › U20 billing_units is kept only when it is a finite number
    askSystemOne › response validation › U16c an answer whose type is not its question's is invalid-response
    askSystemOne › response validation › U16h a non-finite value is invalid-response
    askSystemOne › response validation › U16j score probability keys and legend keys must be exactly 0..n-1
    askSystemOne › response validation › U16k model must be a non-empty string and usage finite counts >= 0
    askSystemOne › response validation › U18 choice and score answers carry no confidence, and no undeclared field survives
    response validation is total over a Proxy whose traps throw › U36 validateSystemOneBody fails a throwing answer set or distribution instead of throwing
    response validation never throws, whatever it is handed › U34 validateSystemOneBody fails a circular or bigint body instead of throwing
R25 the server's choice answer is passed through [must go red: U18]: VERIFIED (1 red)
    askSystemOne › response validation › U18 choice and score answers carry no confidence, and no undeclared field survives
R26 model is in neither the request nor defaultModel [must go red: U21]: VERIFIED (4 red)
    createSystemOneClient › U21 the request body carries the configured model, whatever TYPESAFE_DEFAULT_MODEL says
    createSystemOneClient › the client is frozen, and the model sent is the one it was created with
    every entry point reads the caller’s input once, and uses only what it converted › U35 askSystemOne bounds, sends and validates against one read of the request
    every entry point reads the caller’s input once, and uses only what it converted › U35 createSystemOneClient builds the client from one read of each parameter
R27 baseURL is not passed [must go red: U22]: VERIFIED (3 red)
    createSystemOneClient › U22 the configured baseUrl is the one called, whatever TYPESAFE_BASE_URL says
    every entry point reads the caller’s input once, and uses only what it converted › U35 createSystemOneClient builds the client from one read of each parameter
    listSystemOneModels › U19 a CLM { models: [...] } body succeeds, keeping only the declared fields
R28 an ILogger at all maps to debug [must go red: U23]: VERIFIED (5 red)
    createSystemOneClient › U23 a server that echoes the state puts it in no failure message and no log
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
R34 measureSystemOneInput does not check the state, so an unserializable one throws [must go red: U28, U30, U31]: VERIFIED (4 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U28 measureSystemOneInput fails invalid-request without quoting the input
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 a nested __proto__ in the state, an instruction or any criterion is invalid-request, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 measureSystemOneInput refuses a circular state or question without throwing
    an EntryType is JSON: text, a JSON object or array, or null, all the way down › U31 a state, instruction or criterion that is not JSON is refused, with nothing sent
R35 an APIError's body-derived message reaches the failure message [must go red: U23]: VERIFIED (2 red)
    askSystemOne › failure classification › U11 the failure message carries the status and the request id
    createSystemOneClient › U23 a server that echoes the state puts it in no failure message and no log
R36 a 2xx body that is not a response is quoted by the converter's message [must go red: U23]: VERIFIED (4 red)
    askSystemOne › response validation › U16k model must be a non-empty string and usage finite counts >= 0
    createSystemOneClient › U23 a server that echoes the state puts it in no failure message and no log
    response validation is total over a Proxy whose traps throw › U36 validateSystemOneBody fails a throwing answer set or distribution instead of throwing
    response validation never throws, whatever it is handed › U34 validateSystemOneBody fails a circular or bigint body instead of throwing
R37 a rejected choice is quoted [must go red: U23]: VERIFIED (2 red)
    askSystemOne › response validation › U16e the choice must be one of the labels
    createSystemOneClient › U23 a server that echoes the state puts it in no failure message and no log
R38 a rejected baseUrl is echoed, credentials included [must go red: U24]: VERIFIED (1 red)
    createSystemOneClient › U24 rejects a relative or non-http(s) baseUrl and a blank model; accepts an empty apiKey
R39 a rejected noul quotes the received value [must go red: U16g]: VERIFIED (1 red)
    askSystemOne › response validation › U16g noul must be within [0, 1], and the failure does not quote it
R39b a rejected score quotes the received value [must go red: U16f]: VERIFIED (1 red)
    askSystemOne › response validation › U16f the score must be within [0, n-1], and the failure does not quote it
R39c a rejected sum quotes the received value [must go red: U16i]: VERIFIED (1 red)
    askSystemOne › response validation › U16i each distribution must sum to 1 within 1e-3, at both boundaries, without quoting the sum
R40 no rounding allowance on the sum tolerance [must go red: U16i]: VERIFIED (1 red)
    askSystemOne › response validation › U16i each distribution must sum to 1 within 1e-3, at both boundaries, without quoting the sum
R41 createSystemOneClient reads its parameters unconverted [must go red: U28]: VERIFIED (5 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U28 createSystemOneClient converts its parameters before reading any field
    a Proxy whose traps throw is a classified failure, never a throw › U36 createSystemOneClient refuses throwing parameters as invalid-request
    a logger’s level is one ts-utils publishes › U37 a level ts-utils does not publish is invalid-request
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 createSystemOneClient refuses a cycle or a bigint in its parameters
    every entry point reads the caller’s input once, and uses only what it converted › U35 createSystemOneClient builds the client from one read of each parameter
R42 the questions are not checked before the input limit, so 'unchecked' mode sends a malformed question [must go red: U27b]: VERIFIED (11 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U27b a malformed question is invalid-request in unchecked mode too, with nothing sent
    a JavaScript caller’s malformed input is a classified Result, never a throw › U29 askSystemOne checks the request before reading any field, and every failure has a reason
    a JavaScript caller’s malformed input is a classified Result, never a throw › U32 the factories are plain constructors: a malformed factory-built question is refused at askSystemOne
    a Proxy whose traps throw is a classified failure, never a throw › U36 askSystemOne refuses a throwing request, questions, question or criteria, with nothing sent
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ question id or choice label is invalid-request, with nothing sent
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 a nested __proto__ in the state, an instruction or any criterion is invalid-request, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 askSystemOne refuses a cycle anywhere in the request, with nothing sent
    an EntryType is JSON: text, a JSON object or array, or null, all the way down › U31 a state, instruction or criterion that is not JSON is refused, with nothing sent
    askSystemOne › U10 an empty question set, or a score question with one level, is invalid-request with no request made
    every entry point reads the caller’s input once, and uses only what it converted › U35 askSystemOne bounds, sends and validates against one read of the request
    the input bound › U27 malformed input is invalid-request, resolved, with no request made
R43 a malformed model list is quoted [must go red: U19]: VERIFIED (2 red)
    listSystemOneModels › U19 a malformed model entry is named by index, and nothing it carries is quoted
    listSystemOneModels › U19 an element missing name is invalid-response
R44 a base URL with whitespace is accepted [must go red: U24]: VERIFIED (1 red)
    createSystemOneClient › U24 rejects a relative or non-http(s) baseUrl and a blank model; accepts an empty apiKey
R45 askSystemOne reads its request unchecked [must go red: U29]: VERIFIED (11 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U27b a malformed question is invalid-request in unchecked mode too, with nothing sent
    a JavaScript caller’s malformed input is a classified Result, never a throw › U29 askSystemOne checks the request before reading any field, and every failure has a reason
    a JavaScript caller’s malformed input is a classified Result, never a throw › U32 the factories are plain constructors: a malformed factory-built question is refused at askSystemOne
    a Proxy whose traps throw is a classified failure, never a throw › U36 askSystemOne refuses a throwing request, questions, question or criteria, with nothing sent
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ question id or choice label is invalid-request, with nothing sent
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 a nested __proto__ in the state, an instruction or any criterion is invalid-request, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 askSystemOne refuses a cycle anywhere in the request, with nothing sent
    an EntryType is JSON: text, a JSON object or array, or null, all the way down › U31 a state, instruction or criterion that is not JSON is refused, with nothing sent
    askSystemOne › U10 an empty question set, or a score question with one level, is invalid-request with no request made
    every entry point reads the caller’s input once, and uses only what it converted › U35 askSystemOne bounds, sends and validates against one read of the request
    the input bound › U27 malformed input is invalid-request, resolved, with no request made
R46 measureSystemOneInput measures questions of the wrong shape [must go red: U28]: VERIFIED (8 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U28 measureSystemOneInput fails invalid-request without quoting the input
    a Proxy whose traps throw is a classified failure, never a throw › U36 askSystemOne refuses a throwing request, questions, question or criteria, with nothing sent
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ question id or choice label is invalid-request, with nothing sent
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 a nested __proto__ in the state, an instruction or any criterion is invalid-request, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 measureSystemOneInput refuses a circular state or question without throwing
    an EntryType is JSON: text, a JSON object or array, or null, all the way down › U31 a state, instruction or criterion that is not JSON is refused, with nothing sent
    every entry point reads the caller’s input once, and uses only what it converted › U35 measureSystemOneInput measures one read of the state and questions
    the input bound › U27 malformed input is invalid-request, resolved, with no request made
R47 a conversion that throws is not caught [must go red: U30, U34]: VERIFIED (10 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U28 measureSystemOneInput fails invalid-request without quoting the input
    a Proxy whose traps throw is a classified failure, never a throw › U36 askSystemOne refuses a throwing request, questions, question or criteria, with nothing sent
    a Proxy whose traps throw is a classified failure, never a throw › U36 createSystemOneClient refuses throwing parameters as invalid-request
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 askSystemOne refuses a cycle anywhere in the request, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 createSystemOneClient refuses a cycle or a bigint in its parameters
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 measureSystemOneInput refuses a circular state or question without throwing
    response validation is total over a Proxy whose traps throw › U36 validateSystemOneBody fails a throwing answer set or distribution instead of throwing
    response validation never throws, whatever it is handed › U34 describeModelList names a circular entry instead of throwing
    response validation never throws, whatever it is handed › U34 validateSystemOneBody fails a circular or bigint body instead of throwing
    the input bound › U27 malformed input is invalid-request, resolved, with no request made
R48 the request's top level is converted unguarded, so a bigint request throws [must go red: U30]: VERIFIED (2 red)
    a Proxy whose traps throw is a classified failure, never a throw › U36 askSystemOne refuses a throwing request, questions, question or criteria, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 askSystemOne refuses a cycle anywhere in the request, with nothing sent
R49 the client parameters' top level is converted unguarded [must go red: U30]: VERIFIED (2 red)
    a Proxy whose traps throw is a classified failure, never a throw › U36 createSystemOneClient refuses throwing parameters as invalid-request
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 createSystemOneClient refuses a cycle or a bigint in its parameters
R50 a body field is described unguarded, so a circular or bigint field throws [must go red: U34]: VERIFIED (2 red)
    response validation is total over a Proxy whose traps throw › U36 validateSystemOneBody fails a throwing answer set or distribution instead of throwing
    response validation never throws, whatever it is handed › U34 validateSystemOneBody fails a circular or bigint body instead of throwing
R51 a question is converted unguarded, so a circular question throws [must go red: U30]: VERIFIED (3 red)
    a Proxy whose traps throw is a classified failure, never a throw › U36 askSystemOne refuses a throwing request, questions, question or criteria, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 askSystemOne refuses a cycle anywhere in the request, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 measureSystemOneInput refuses a circular state or question without throwing
R52 the input limit is converted unguarded, so a circular limit throws [must go red: U30]: VERIFIED (1 red)
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 askSystemOne refuses a cycle anywhere in the request, with nothing sent
R53 the body is converted unguarded [must go red: U34]: VERIFIED (2 red)
    response validation is total over a Proxy whose traps throw › U36 validateSystemOneBody fails a throwing answer set or distribution instead of throwing
    response validation never throws, whatever it is handed › U34 validateSystemOneBody fails a circular or bigint body instead of throwing
R54 an unconvertible body is described unguarded [must go red: U34]: VERIFIED (1 red)
    response validation never throws, whatever it is handed › U34 validateSystemOneBody fails a circular or bigint body instead of throwing
R55 the answer set is described unguarded [must go red: U34]: VERIFIED (2 red)
    response validation is total over a Proxy whose traps throw › U36 validateSystemOneBody fails a throwing answer set or distribution instead of throwing
    response validation never throws, whatever it is handed › U34 validateSystemOneBody fails a circular or bigint body instead of throwing
R56 each answer is described unguarded [must go red: U34]: VERIFIED (2 red)
    response validation is total over a Proxy whose traps throw › U36 validateSystemOneBody fails a throwing answer set or distribution instead of throwing
    response validation never throws, whatever it is handed › U34 validateSystemOneBody fails a circular or bigint body instead of throwing
R57 each model card is described unguarded [must go red: U34]: VERIFIED (1 red)
    response validation never throws, whatever it is handed › U34 describeModelList names a circular entry instead of throwing
R58 an EntryType is not checked as JSON [must go red: U31]: VERIFIED (4 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U29 askSystemOne checks the request before reading any field, and every failure has a reason
    a JavaScript caller’s malformed input is a classified Result, never a throw › U32 the factories are plain constructors: a malformed factory-built question is refused at askSystemOne
    an EntryType is JSON: text, a JSON object or array, or null, all the way down › U31 a state, instruction or criterion that is not JSON is refused, with nothing sent
    the input bound › U27 malformed input is invalid-request, resolved, with no request made
R59 a bare number or boolean is accepted as an EntryType [must go red: U31]: VERIFIED (3 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U27b a malformed question is invalid-request in unchecked mode too, with nothing sent
    a JavaScript caller’s malformed input is a classified Result, never a throw › U29 askSystemOne checks the request before reading any field, and every failure has a reason
    an EntryType is JSON: text, a JSON object or array, or null, all the way down › U31 a state, instruction or criterion that is not JSON is refused, with nothing sent
R60 a received or request record may carry an own __proto__ key [must go red: U33]: VERIFIED (2 red)
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ probability, legend level or answer id is invalid-response
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ question id or choice label is invalid-request, with nothing sent
R61 a __proto__ question id is not named as reserved [must go red: U33]: VERIFIED (1 red)
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ question id or choice label is invalid-request, with nothing sent
R62 a reserved answer id is not counted [must go red: U33]: VERIFIED (1 red)
    a reserved __proto__ key cannot slip past an exact-key check › U33 a __proto__ probability, legend level or answer id is invalid-response
R63 a request's fields are converted unguarded, so a circular field throws [must go red: U30]: VERIFIED (3 red)
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 askSystemOne refuses a cycle anywhere in the request, with nothing sent
    a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw › U30 createSystemOneClient refuses a cycle or a bigint in its parameters
    the input bound › U27 malformed input is invalid-request, resolved, with no request made
R64 createSystemOneClient builds the client from the caller's parameters after the gate [must go red: U35]: VERIFIED (1 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 createSystemOneClient builds the client from one read of each parameter
R65 askSystemOne bounds the caller's request rather than the converted one [must go red: U35]: VERIFIED (1 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 askSystemOne bounds, sends and validates against one read of the request
R66 askSystemOne sends the caller's request rather than the converted one [must go red: U35]: VERIFIED (1 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 askSystemOne bounds, sends and validates against one read of the request
R67 the answers are validated against the caller's questions rather than those sent [must go red: U35]: VERIFIED (1 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 askSystemOne bounds, sends and validates against one read of the request
R68 measureSystemOneInput measures the caller's input rather than the converted one [must go red: U35]: VERIFIED (1 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 measureSystemOneInput measures one read of the state and questions
R69 a question is converted from the caller's object, so its type is read twice [must go red: U35]: VERIFIED (2 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 askSystemOne bounds, sends and validates against one read of the request
    every entry point reads the caller’s input once, and uses only what it converted › U35 measureSystemOneInput measures one read of the state and questions
R70 the input limit is a oneOf, whose failed alternative reads the caller's object first [must go red: U35]: VERIFIED (1 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 askSystemOne bounds, sends and validates against one read of the request
R71 a noul's criteria are a oneOf, whose failed alternative reads the caller's object first [must go red: U35]: VERIFIED (1 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 measureSystemOneInput measures one read of the state and questions
R72 the logger's methods are not bound to the caller's logger [must go red: U23, U35]: VERIFIED (1 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 createSystemOneClient builds the client from one read of each parameter
R73 retry overrides are passed through, so the SDK reads the caller's object [must go red: U35]: VERIFIED (2 red)
    a JavaScript caller’s malformed input is a classified Result, never a throw › U28 createSystemOneClient converts its parameters before reading any field
    every entry point reads the caller’s input once, and uses only what it converted › U35 createSystemOneClient builds the client from one read of each parameter
R74 the reserved-key probe is not guarded, so a throwing Proxy trap throws [must go red: U36]: VERIFIED (2 red)
    a Proxy whose traps throw is a classified failure, never a throw › U36 askSystemOne refuses a throwing request, questions, question or criteria, with nothing sent
    response validation is total over a Proxy whose traps throw › U36 validateSystemOneBody fails a throwing answer set or distribution instead of throwing
R75 any string is accepted as a logger level [must go red: U37]: VERIFIED (1 red)
    a logger’s level is one ts-utils publishes › U37 a level ts-utils does not publish is invalid-request
R76 a nested __proto__ in a JSON entry is not refused [must go red: U38]: VERIFIED (1 red)
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 a nested __proto__ in the state, an instruction or any criterion is invalid-request, with nothing sent
R77 the reserved-key walk does not descend into arrays [must go red: U38]: VERIFIED (1 red)
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 a nested __proto__ in the state, an instruction or any criterion is invalid-request, with nothing sent
R78 the reserved-key walk does not descend into objects [must go red: U38]: VERIFIED (1 red)
    a reserved __proto__ key is refused at any depth of a JSON entry › U38 a nested __proto__ in the state, an instruction or any criterion is invalid-request, with nothing sent
R79 the JSON converter reads the caller's value again rather than the walk's snapshot [must go red: U35]: VERIFIED (1 red)
    every entry point reads the caller’s input once, and uses only what it converted › U35 measureSystemOneInput measures one read of the state and questions
H1 an unknown option is accepted [must go red: S1]: VERIFIED (1 red)
    S1 an unknown or repeated option is refused before any output, naming the flag but not its value
H2 a noul's criteria are not checked [must go red: S2]: VERIFIED (2 red)
    S2 --check validates a noul's criteria as the SDK and askSystemOne accept them
    S9 --check refuses a __proto__ key nested anywhere in the state, an instruction or a criterion
H3 the unknown-model probe records no status [must go red: S3]: VERIFIED (1 red)
    S3 the probe records how an unknown model is refused, and nothing the server sent
H4 a model-listing failure does not fail the probe [must go red: S4]: VERIFIED (1 red)
    S4 a model-listing failure fails the probe; when both fail, the ask is reported
H5 a URL with whitespace is accepted [must go red: S5]: VERIFIED (1 red)
    S5 a base URL with whitespace is refused, as the client refuses it
H6 --check may be given twice [must go red: S6]: VERIFIED (1 red)
    S6 --check given twice is refused
H7 questions given as a list are accepted [must go red: S7]: VERIFIED (1 red)
    S7 questions given as a list are refused
H8 a noul criterion must be text [must go red: S2]: VERIFIED (3 red)
    S2 --check validates a noul's criteria as the SDK and askSystemOne accept them
    S8 --check validates the state, instructions, choice descriptions and score levels as askSystemOne does
    S9 --check refuses a __proto__ key nested anywhere in the state, an instruction or a criterion
H9 the state is not checked [must go red: S8]: VERIFIED (2 red)
    S8 --check validates the state, instructions, choice descriptions and score levels as askSystemOne does
    S9 --check refuses a __proto__ key nested anywhere in the state, an instruction or a criterion
H10 instructions are not checked [must go red: S8]: VERIFIED (2 red)
    S8 --check validates the state, instructions, choice descriptions and score levels as askSystemOne does
    S9 --check refuses a __proto__ key nested anywhere in the state, an instruction or a criterion
H11 choice descriptions and labels are not checked [must go red: S8]: VERIFIED (2 red)
    S8 --check validates the state, instructions, choice descriptions and score levels as askSystemOne does
    S9 --check refuses a __proto__ key nested anywhere in the state, an instruction or a criterion
H12 score levels are not checked [must go red: S8]: VERIFIED (2 red)
    S8 --check validates the state, instructions, choice descriptions and score levels as askSystemOne does
    S9 --check refuses a __proto__ key nested anywhere in the state, an instruction or a criterion
H13 a __proto__ question id is accepted [must go red: S8]: VERIFIED (1 red)
    S8 --check validates the state, instructions, choice descriptions and score levels as askSystemOne does
H14 a nested __proto__ key is not checked [must go red: S9]: VERIFIED (1 red)
    S9 --check refuses a __proto__ key nested anywhere in the state, an instruction or a criterion
H15 the nested __proto__ check does not descend into arrays [must go red: S9]: VERIFIED (1 red)
    S9 --check refuses a __proto__ key nested anywhere in the state, an instruction or a criterion

97 rows; 0 not VERIFIED
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

## Gate-time review (independent) and disposition

No P1s.

- **P2-A — classification must be total.** **Fixed** (deviation 15). U27 asserts a resolved
  `invalid-request` with no request made for: a `score` with `criteria: undefined`, a `choice` with
  `criteria: null`, `inputLimit: undefined`, `inputLimit: { maxChars: '10' }`, a circular state and a
  `bigint` state; and that `measureSystemOneInput` fails rather than throws. Revert row **R34**
  (uncaptured measure) is VERIFIED by U27.
- **P2-B — the state must not reach a log through a failure message.** **It did leak; fixed**
  (deviation 16).
  - **What the SDK does (read at `dist/index.mjs` @ 0.6.0):** `APIError`'s message is
    `"<status> " + extractMessage(body)`: the body's `error` string, `error.message`, `message` or
    `detail` string; for a `detail` array, `loc: msg` pairs (excluding `"body"`); and when none of
    those yields text, the raw body (`JSON.stringify` for an object) **truncated to 200 characters**.
    So the FastAPI/pydantic fixture without `msg` (`{"detail":[{"loc":["body","state"],"input":"MARKER"}]}`)
    put the whole body, marker included, into the message, and a `msg` or `error` string quoting the
    state did the same. The SDK logs bodies only at `debug` (`<- body`, `<- error body`, `-> url`
    with the request body), which this package never selects; its `info` lines carry the status,
    timing and request id (`<- 422 in 3ms`, `retrying in 1ms … after 503`, `connection error after …`
    with the error object); it never calls `warn` or `error`.
  - **A second path, found while fixing it:** a 2xx failure's converter message quoted the rejected
    value (`Field model not found in: {…}`), and the semantic checks quoted the received `choice`,
    received keys and extra answer ids. All replaced by descriptions with no received values.
  - **Test:** U23 "a server that echoes the state …" — logger at `all`, `TYPESAFE_LOG_LEVEL=debug`,
    retries on — over eleven echoing replies: pydantic 422 with and without `msg`, a 400 `error`
    string, a 400 text body, a retried 503 (twice), a 2xx echo object, a 2xx text echo, a 2xx whose
    `choice` is the marker, one whose probability key is the marker, an extra answer id that is the
    marker, and a malformed answer under the marker. It asserts that every call fails, that no
    failure message contains the marker, that the retry log path ran, and that nothing logged
    (messages and parameters, errors rendered by name and message) contains it.
  - **Revert rows:** **R35** (body-derived `APIError` message restored), **R36** (converter message
    restored) and **R37** (rejected `choice` quoted) are each VERIFIED by the U23 echo test.
- **P3-1** raw `?` / `#` in `baseUrl`. **Fixed** (deviation 18); U24 covers `http://cfg.test/?` and
  `http://cfg.test/#`.
- **P3-2** whitespace-only descriptions. **Fixed, differently from the suggestion** (deviation 17): the
  suggested "treat as empty" would under-measure a long whitespace description with a short key; the
  measure takes the larger of the two. Test: U4 "a whitespace-only description …".
- **P3-3** in-place guard. **Fixed:** `--pkg` is refused when it is this package, when its `src` is a
  symlink or resolves to this package's `src`, or when any file a row mutates has this package's
  device and inode (a hard link). Each was exercised: `--pkg .`, a copy whose `src` is a symlink,
  and a `cp -al` hard-link copy each exit 2 with the reason; the usage notes say so.

## Copilot round 1 on fgv#721 (against `78ad9b83`) and disposition

All six threads were verified, and all six are fixed.

1. **`checkBaseUrl` echoed the rejected URL**, credentials included. **Fixed** (deviation 21); U24
   refuses `https://user:hunter2-secret@…`, a `?token=` and a `#` value, and asserts `hunter2`
   appears in none of the messages. Revert row **R38** is VERIFIED by U24.
2. **`perf/systemOneLive.js --check` accepted URLs the client rejects, and printed them.** **Fixed:**
   `absoluteUrl` applies the client's constraints (absolute `http:`/`https:`, no raw `?` or `#`, no
   userinfo); a rejected value is printed with userinfo, query and fragment removed (an unparseable
   one is not printed at all); the URL is normalized as the SDK does (trailing slashes stripped) and
   the model id trimmed, so `--check` reports exactly what a live run would send. `endpoint` no longer
   echoes `<url,model>` either. Exercised by hand (the script is outside the jest suite): credential,
   query, fragment, bare `?`, `ftp:` and unparseable values each exit 3 with a redacted message, and
   `http://127.0.0.1:8700/` with model ` clm-latest ` reports `http://127.0.0.1:8700` and `clm-latest`.
3. **2xx failures quoted the received sum, `noul` and `score`.** **Fixed** (deviation 20). A sweep of
   every `${…}` in `validate.ts` found no other received value: the remaining interpolations are
   question ids, request labels and levels, configured bounds, counts, and the answer `type`, which
   the discriminated converter has already confined to `noul` / `choice` / `score`. U16f, U16g and
   U16i assert the received value is absent; rows **R39**, **R39b** and **R39c** are VERIFIED by them.
4. **The sum tolerance was asymmetric under binary rounding.** **Fixed** (deviation 19); U16i asserts
   both boundaries pass and a value just outside each fails. Row **R40** (allowance removed) is
   VERIFIED by U16i.
5. **The matrix wrote its mutations before the `try`/`finally`.** **Fixed:** every write is inside the
   protected region; the `finally` restores every file from its original (all read before any write),
   attempts each restore even if another fails, and stops the run if any copy is left mutated.
6. **`result.md` said the largest file has about 310 lines.** **Fixed:** `validate.ts`, 387 lines,
   measured after items 3 and 4.

## Copilot round 2 on fgv#721 (against `9b076e47`) and disposition

One inline thread plus four findings from the review summary, all confirmed by the orchestrator and
all fixed. Items 1–4 are in `perf/systemOneLive.js`.

1. **Unknown options were silently ignored** (`--max-char 2400 --check` exited 0 and reported
   `maxChars: "unchecked"`). **Fixed:** each mode has a fixed set of flags. An unknown flag, a
   repeated flag and a stray argument each exit 3 before any output or request. The message names
   the flag and never its value; an unknown mode is no longer echoed either. Self-test **S1**;
   matrix row **H1**.
2. **`--check` did not validate a `noul`'s criteria.** **Fixed:** they are optional (absent or
   `null`, as the SDK's type allows); when present they must be a non-array object whose keys are
   exactly `true` and/or `false`, with string values. An empty object is refused. Self-test **S2**
   covers four valid and five invalid shapes; matrix row **H2**.
3. **The probe did not record the unknown-model status that L1 and OQ-6 require.** **Fixed:**
   - After the ask and the listing, `probe` asks once with `fgv-probe-unknown-model-<12 hex>` and
     records `unknownModel: { model, outcome, reason, status }`.
   - The outcome is `refused as expected` for `invalid-request`, `refused, with an unexpected reason`
     otherwise, and `accepted (surprising …)` for a success.
   - It never fails the probe.
   - Only the reason and the status are recorded. The package's message, and anything the server
     sent, are not.
   - **The package's result does not expose the HTTP status as a field.** Its `DetailedResult`
     carries the reason as its detail, and the status appears only in the `(status N)` segment the
     package itself composes at the head of its message. The harness reads it from there with a
     regex anchored to that format. I did not widen the public surface for the harness. If a
     consumer needs the status structurally, the additive change would be a `status` (and
     `requestId`) on the failure detail; that is a design decision, flagged here and not taken.
   - The plan's L1 row and § 8 `probe` bullet now say where L1's unknown-model status comes from.
   - Self-test **S3** checks the stub's 422 is recorded as `invalid-request` / 422 with none of the
     stub's text, and that an accepting stub is recorded as surprising. Matrix row **H3** (status
     not recorded).
4. **A model-listing failure did not fail the probe.** **Fixed:** the record becomes `ok: false` with
   `failedStep: 'listSystemOneModels'`, the listing's classified reason and the package's message,
   so `probe` exits 2 and `parity` refuses the probe.
   - **When both the ask and the listing fail, the ask's failure is reported**, as `failedStep:
     'askSystemOne'`. The ask is the round trip L1 exists to establish, and a server that cannot
     answer it has not shown wire compatibility, whatever its model list says. The listing's failure
     stays in `listModels`, and the choice is written in the harness's usage notes.
   - Self-test **S4**; matrix row **H4**.
5. **A stale "Not run: a repo-wide rush test" paragraph remained under Gates.** **Removed**; the gate
   evidence above it supersedes it.

**Exercised by hand** (stub servers from a scratch `stub.js` on 127.0.0.1; `$SCRATCH` is the session
scratchpad; the stub's bodies carry the text `SERVER-TEXT`, which appears in no record):

```
$ node perf/systemOneLive.js probe --url http://127.0.0.1:8700 --model clm-latest --max-char 2400 --check
exit 3
systemOneLive: unknown option --max-char for probe; it accepts --url, --model, --key-env, --max-chars and --check

$ node perf/systemOneLive.js probe --url http://127.0.0.1:8700 --model clm-latest --max-chars 2400 --check
exit 0

$ node perf/systemOneLive.js parity --a http://127.0.0.1:8700,clm-latest --b http://127.0.0.1:8701,clm-latest --questions $SCRATCH/badnoul.json --max-chars 2400 --min-top-agreement 0.9 --max-mean-abs-diff 0.1 --check
exit 3
systemOneLive: --questions item 0 question 'n': noul criteria, when given, must be an object whose keys are 'true' and/or 'false', each with a string description

$ node perf/systemOneLive.js parity --a http://127.0.0.1:8700,clm-latest --b http://127.0.0.1:8701,clm-latest --questions $SCRATCH/goodnoul.json --max-chars 2400 --min-top-agreement 0.9 --max-mean-abs-diff 0.1 --check
exit 0

# stub: answers clm-latest, refuses any other model with 422, lists models
$ node perf/systemOneLive.js probe --url http://127.0.0.1:18781 --model clm-latest
exit 0

  record: {"ok":true,"listModels":true,"unknownModel":{"model":"fgv-probe-unknown-model-d2348e90a19a","outcome":"refused as expected","reason":"invalid-request","status":422}} server-text-in-record=0
# stub: as above, but /v1/models answers 500
$ node perf/systemOneLive.js probe --url http://127.0.0.1:18781 --model clm-latest
exit 2

  record: {"ok":false,"failedStep":"listSystemOneModels","reason":"server","listModels":false,"unknownModel":{"model":"fgv-probe-unknown-model-5a85c51e454c","outcome":"refused as expected","reason":"invalid-request","status":422}} server-text-in-record=0
# stub: /v1/systemone answers 503 for every model, /v1/models answers 500
$ node perf/systemOneLive.js probe --url http://127.0.0.1:18781 --model clm-latest
exit 2

  record: {"ok":false,"failedStep":"askSystemOne","reason":"server","listModels":false,"unknownModel":{"model":"fgv-probe-unknown-model-404e2cf62120","outcome":"refused, with an unexpected reason","reason":"server","status":503}} server-text-in-record=0
# nothing listens on 127.0.0.1:9 (unreachable)
$ node perf/systemOneLive.js probe --url http://127.0.0.1:9 --model clm-latest
exit 2

  record: {"ok":false,"failedStep":"askSystemOne","reason":"connection","listModels":{"ok":false,"reason":"connection"},"unknownModel":{"model":"fgv-probe-unknown-model-814c411e8ad6","outcome":"refused, with an unexpected reason","reason":"connection"}}
```

`parity` against two endpoints whose listing returns 500 exited **2** with `refused: "a probe failed:
refused, not a parity result"`, both probes `listSystemOneModels/server`.

## Copilot round 3 on fgv#721 (against `502b2067`) and disposition

Three threads and five summary findings, all reproduced by the orchestrator. All eight are fixed,
except the part of item 1 that would have reversed a plan decision, described under item 1.

**Library**

1. **Malformed public input threw** (thread r4210798244).
   - Repros: `createSystemOneClient({ baseUrl, model: 5 })` and `createSystemOneClient(undefined)`.
   - **Fixed** (deviation 22): each entry point converts its input first. The repros now return
     `invalid-request: invalid [model] in the client parameters` and `invalid-request:
     createSystemOneClient takes { baseUrl, model, apiKey, timeoutMs?, retry?, logger?, fetch? }`.

   **Entry-point sweep:**

   | export | malformed input from a JS caller | now |
   |---|---|---|
   | `createSystemOneClient` | `undefined`, `null`, a number, an array, a non-string `baseUrl` / `model` / `apiKey`, a non-number `timeoutMs`, a non-object `retry`, a logger without methods, a non-function `fetch` | `checkClientParams` first: `invalid-request`, naming the fields. U28; **R41** |
   | `askSystemOne` | request `undefined` / `null` / a string, a non-`EntryType` or missing state, questions missing or a list, a non-`AbortSignal` signal, no `inputLimit`, any malformed question; a forged client (`undefined`, `null`, a number, `{}`) | `checkRequest` before any field is read; the client through the `WeakMap` lookup (no throw for any key). Resolved `invalid-request`, nothing sent. U29, U27b; **R45**, **R42** |
   | `listSystemOneModels` | a forged client (`undefined`, `null`, a number, `{}`) | `invalid-request: client was not created by createSystemOneClient`. U28 |
   | `measureSystemOneInput` | questions `undefined` or a list, any malformed question, an unserializable state | `checkQuestions`, then the measure in `captureResult` with a fixed message. U28, U27; **R46**, **R34** |
   | `noul`, `choice`, `score` | wrong-shaped criteria | **Not changed. Decided at round 4 (deviation 24).** These are the SDK's own builders, re-exported by identity. Plan § 3.1 decided "identity, not wrappers", and U25 asserts it. A `Result`-returning builder could not be used inline in a `questions` literal, which is what the builders are for. The SDK throws its `TypeSafeError` synchronously for a `choice` given a list or a `score` given a map. A JS caller that hands plain question objects to `askSystemOne` gets `invalid-request` instead. **This is the one part of the sweep not done as asked; it needs your decision.** |
   | `allSystemOneFailureReasons` | — | a constant; takes no input |
   | types | — | no runtime surface |

2. **A malformed question was unclassified in `'unchecked'` mode** (thread r4210798344).
   - Before: `detail: undefined`. The check in `validate.ts` threw on the response, and the
     rejection lost the reason.
   - **Fixed:** the request gate checks every question before the limit is read. U27b runs seven
     malformed questions in both modes and asserts `invalid-request`, the fixed message and zero
     requests. **R42** points at the request gate's question check.

   **Every `fail` / `failWithDetail` / `captureResult` that reaches the public surface:**
   - **`client.ts`:**
     - `checkBaseUrl`: two fixed messages.
     - `clientFrom`: blank model, fixed.
     - The SDK constructor in `captureResult`: the SDK's own message about the caller's options,
       prefixed `invalid-request`.
     - `bindingFor`: fixed.
     - `startCall`'s `captureResult`: the SDK's synchronous question check, which names question
       ids and counts; `withFailureDetail('invalid-request')`.
     - The pending call's rejection: `classifyError`, with a detail always set.
     - `answerFrom`: `withFailureDetail('invalid-response')`.
     - `listSystemOneModels`: `describeModelList`; the SDK's fixed unwrap text through
       `classifyError`; `classifyError` on the HTTP error.
   - **`measure.ts`:**
     - The `inputLimit` shape: fixed.
     - `maxChars`: quotes the caller's own number.
     - The measure: fixed.
     - The over-limit message: ids, the part and counts.
   - **`shapes.ts`:** every gate's message is fixed, naming fields or question ids.
   - **`validate.ts`:**
     - The semantic checks: ids, request labels and levels, bounds and counts.
     - `describeUnconvertible`, `describeAnswerSet`, `describeModelList`: fields, request ids,
       indices and counts.
   - **Reasons:** every `askSystemOne` step carries a detail. Every message from the three
     `Result`-returning entry points starts with its reason (deviation 23).
   - **What remains:** a throw inside the response validation itself. Its inputs are now gated
     (the questions on the way in, the body by converters), so none is expected. It would surface
     as a failure without a detail, and no test can reach it.

3. **A model-list failure echoed server data.**
   - Repro: `Field name not found in: {"secret":"SERVER-SECRET-VALUE"}`.
   - **Fixed:** the message is now `the model list is not [{ name, description, release_date }]:
     entries [i, …] are malformed`. U19 plants `SERVER-SECRET-VALUE` in two entries and asserts it
     appears in no message. **R43** restores the quoting.

   **Sweep of failures that can carry received data:**
   - The model list: fixed here.
   - Non-2xx bodies in `classify.ts`: already only the error class (`err.name`), since the
     gate-time review.
   - 2xx bodies (`validate.ts`): fixed descriptions since the gate-time review and round 1.
   - The SDK's own texts that reach a message:
     - the models-unwrap message (fixed text);
     - `Request timed out after Nms`;
     - the abort text (fixed);
     - `Connection error: <fetch's own message>`: the platform's or the caller's `fetch`, not the
       server.

   None of these quote a body.
4. **Whitespace in the base URL.**
   - Repro: `' http://cfg.test '` was accepted and requests went to `" http://cfg.test /v1/models"`.
   - **Fixed** by refusing any whitespace in the raw string, consistent with the bare `?` and `#`.
   - U24 covers a leading, a trailing, a tab and a newline case. **R44** removes the check.

**Harness (`perf/systemOneLive.js`)**

5. **`absoluteUrl` matches the client:** whitespace is refused. Self-test **S5** (probe and parity
   `--check`); row **H5**.
6. **A `noul`'s criteria values are any `EntryType`** (thread r4210798437). The keys are only `true`
   and/or `false`; each value is text, a JSON object or array, or `null`. `{}`, `{ false: null }` and
   object or array values are accepted, matching the SDK and `askSystemOne`'s gate. Numbers and
   booleans are refused. **S2** was updated (seven valid shapes, five invalid); row **H8**.
7. **`--check --check` is refused** (exit 3, no output). Self-test **S6**; row **H6**.
8. **Questions given as a list are refused** by the question-file check. Self-test **S7**; row **H7**.

**Repros, run by hand against the built `lib/` after the fixes:**

```
createSystemOneClient({ baseUrl, model: 5 }) -> {"message":"invalid-request: invalid [model] in the client parameters"}
createSystemOneClient(undefined) -> {"message":"invalid-request: createSystemOneClient takes { baseUrl, model, apiKey, timeoutMs?, retry?, logger?, fetch? }"}
createSystemOneClient({ baseUrl: ' http://cfg.test ' }) -> {"message":"invalid-request: baseUrl must be an absolute http(s) URL with no whitespace, query, fragment or credentials"}
askSystemOne unchecked, choice criteria null -> {"message":"invalid-request: [q] are not well-formed noul, choice or score questions","detail":"invalid-request"}
askSystemOne(c, undefined) -> {"message":"invalid-request: the request must be an object { state, questions, inputLimit, signal? }","detail":"invalid-request"}
listSystemOneModels(undefined) -> {"message":"invalid-request: client was not created by createSystemOneClient"}
measureSystemOneInput(s, undefined) -> {"message":"invalid-request: questions must be an object of named questions"}
```

## Copilot round 4 on fgv#721 (against `6514b3c2`) and disposition

Six inline threads. The orchestrator reproduced the three library findings at `6514b3c2`. All six
are handled: five fixed, and the stale-counts thread left to the orchestrator as instructed.

**Library**

1. **A shape conversion could throw** (thread r4213291217).
   - Repro: a question `{ instructions: 'q', self: <itself> }`. At `6514b3c2`, `measureSystemOneInput`
     threw and `askSystemOne` rejected, both with `Converting circular structure to JSON`. The
     discriminated converter's failure path calls `JSON.stringify(from)`.
   - **Fixed** (deviation 26). Every conversion of a caller's or a server's value goes through
     `safeConvert`. The repro now gives `invalid-request: [q] are not well-formed noul, choice or score
     questions` from both entry points.
   - Each gate converts per field and per question, so a cycle in one question still names that
     question. A cycle the gate cannot attribute (a `bigint` request, or a `bigint` parameter
     object) gets the gate's fixed top-level message.
   - Found by the sweep and not in the thread: a circular `inputLimit` threw the same way, from
     `oneOf`'s failure path (`No matching converter for ${JSON.stringify(from)}`). It is fixed by the
     same change and covered by U30 and **R52**.
   - Tests:
     - **U30** covers circular or `bigint` client parameters, request, state, question, choice
       criterion, noul criterion and input limit. None throws; each is `invalid-request` with nothing
       sent, and the planted secret appears in no message.
     - **U34** covers the response side through the internal functions: a circular and `bigint`
       body, a `bigint` answer set, and a circular model-list entry. A parsed JSON body cannot hold
       either, so these pin only that the formatting cannot throw.
   - Rows: **R47** (`safeConvert` itself) and **R48–R57** (one per call site).

   **Sweep: every converter call a caller's or a server's value can reach, after the fix.** These
   are all the `.convert(` / `.validate(` calls in `src/`, from `grep -nE "\.convert\(|\.validate\("`.

   | site | value from | guarded by | row |
   |---|---|---|---|
   | `shapes.ts` `safeConvert` | — | the guard itself (`captureResult`) | R47 |
   | `shapes.ts` `checkClientParams`: the parameter object | caller | `safeConvert(callerRecord, params)` | R49 |
   | `shapes.ts` `rejectedFields`: each declared field (client parameters, request `state` / `signal`, and the 2xx body's fields when describing it) | caller, server | `safeConvert(fields[field], …)` | R50 |
   | `shapes.ts` `checkRequest`: the request object | caller | `safeConvert(callerRecord, request)` | R48 |
   | `shapes.ts` `checkQuestions`: the questions object | caller | `safeConvert(callerRecord, questions)`; a reserved id is refused before it | R61 (the reserved check) |
   | `shapes.ts` `checkQuestions`: each question | caller | `safeConvert(question, record[id])` | R51 |
   | `shapes.ts` `checkInput`: the measure's state | caller | `safeConvert(entry, state)` | R34 |
   | `shapes.ts` `ownRecordOf`: `record.convert` | caller, server | runs only inside a converter that a `safeConvert` call above or below runs | R47 |
   | `shapes.ts` `entry`: `JsonConverters.jsonValue.convert` | caller | runs only inside `safeConvert` (state, instructions, criteria) | R47, R58 |
   | `measure.ts` `checkInputLimit`: the input limit | caller | `safeConvert(inputLimitShape, inputLimit)` | R52 |
   | `validate.ts` `validateSystemOneBody`: the 2xx body | server | `safeConvert(body, data)` | R53 |
   | `validate.ts` `describeUnconvertible`: the body as a record | server | `safeConvert(jsonRecord, data)` | R54 |
   | `validate.ts` `describeBadAnswers`: the answer set | server | `safeConvert(jsonRecord, answers)` | R55 |
   | `validate.ts` `describeBadAnswers`: each answer | server | `safeConvert(answer, record[id])` | R56 |
   | `validate.ts` `optionalBillingUnits`: `finiteNumber.validate` | server | runs only inside the body conversion | R53 |
   | `validate.ts` `describeModelList`: each entry | server | `safeConvert(modelCard, entry)` | R57 |
   | `client.ts` `listSystemOneModels`: the model list | server | `safeConvert(modelCards, received.data)` | none; see below |

   - **No row for the last site.** `received.data` is the SDK's `JSON.parse` output, unwrapped by
     the SDK from `{ models: [...] }`, and it cannot hold a cycle or a `bigint`. No input reachable
     through `fetch` makes `modelCards` throw, so the guard cannot be shown load-bearing from the
     suite. It is kept so the rule "every conversion is guarded" has no exception.
   - The same holds for every server-side row in practice. R53–R57 are VERIFIED only through U34,
     which calls the internal functions directly.
   - **Other throw sources checked:**
     - `classify.ts` and `logging.ts` call no converter.
     - `bindingFor` is a `WeakMap.get`, which does not throw for a primitive key.
     - `measure.ts`'s `JSON.stringify(value)` runs only on values the gate has checked as JSON. A
       non-finite number is the one value that check passes and JSON cannot hold; `JSON.stringify`
       writes it as `null` rather than throwing (see the note under item 2).

2. **An `EntryType` was not checked as JSON** (thread r4213291188).
   - Repro: `state: new Map()` in `'unchecked'` mode was accepted and sent as `{}`.
   - **Fixed** (deviation 25). Now: `invalid-request: invalid [state] in the request`, nothing sent.
   - **U31** covers:
     - a state that is a `Map`, a `Date`, a `bigint`, `{ a: undefined }`, `{ a: [new Map()] }`, a
       bare number or a bare boolean, at `askSystemOne` and at `measureSystemOneInput`;
     - a `Map` instruction, a `Date` choice description, a `bigint` score level and a `Set` inside a
       noul criterion;
     - JSON states of each allowed kind, which are still accepted.
   - Rows: **R58** (the JSON check) and **R59** (the bare number or boolean).
   - Note: `ts-json-base`'s `jsonPrimitive` accepts `Infinity` (it refuses only `NaN`), and
     `JSON.stringify` writes `Infinity` as `null`. A non-finite number nested in a state is therefore
     sent as `null` rather than refused. This is left as is, since the converter belongs to
     `ts-json-base`; it is recorded for the same upstream pass as `recordOf`.

3. **A reserved `__proto__` key slipped past exact-key checks** (thread r4213291067).
   - Repro: a choice answer with probabilities `{"x":0.5,"y":0.5,"__proto__":0}` was accepted.
   - **Fixed** (deviation 27). Now: `invalid-response (status 200): the body is not a System-1
     response: invalid [answers]; answers that are not a noul, choice or score answer: [q] and 0 with
     no question`.
   - **U33**:
     - a `__proto__` probability, legend level or answer id is `invalid-response`, and the answer id
       is counted as one "with no question";
     - a `__proto__` question id is `invalid-request: [__proto__] is a reserved key and cannot be a
       question id`;
     - a `__proto__` choice label is `invalid-request` at `askSystemOne` and at the measure, with
       nothing sent.
   - Rows: **R60** (`ownRecordOf`), **R61** (the question-id message) and **R62** (the answer-id
     count).
   - `ts-utils` is not changed. The upstream issue is recorded in deviation 27 for the orchestrator.

**Harness**

4. **The revert matrix ran a misspelt row id as an empty run** (thread r4213291115). **Fixed:** an
   id that names no row in `MUTATIONS` stops the run before anything is read or mutated, with exit 2
   and the unknown ids named. Verified by hand:
   - `--check R1 R999 X` exits 2 with `mutationMatrix: no row named [R999, X]; nothing was run`.
   - `--check R1` exits 0.

   The matrix cannot carry a row for itself.
5. **`--check` did not check `EntryType` values** (thread r4213291150). **Fixed:** the question-file
   check now refuses the following, by the rule of item 2:
   - a state, an instruction, a choice description or a score level that is a bare number or
     boolean;
   - a `__proto__` question id or choice label, as `askSystemOne` does.

   The file is parsed JSON, so everything nested is JSON already, and only the top level needs the
   check. Self-test **S8** runs 15 cases across all three question kinds, 6 accepted and 9 refused;
   it went red without the fix. Rows **H9–H13**.

**Process**

6. **The PR description's counts are stale** (thread r4213291255). As instructed, this is left to the
   orchestrator, who updates the PR body at merge. This file, `state.md` and `docs/WORKSTREAMS.md`
   carry the current counts: 86 tests and the revert matrix below.

**Repros, run by hand against the built `lib/`:**

```
--- at 5efb395d (fixed)
measure circular q: invalid-request: [q] are not well-formed noul, choice or score questions
ask circular q: invalid-request invalid-request: [q] are not well-formed noul, choice or score questions
Map state: invalid-request invalid-request: invalid [state] in the request calls 0
__proto__ probs: invalid-response invalid-response (status 200): the body is not a System-1 response: invalid [answers]; answers that are not a noul, choice or score answer: [q] and 0 with no question calls 1
--- at 6514b3c2
measure THREW Converting circular structure to JSON
ask REJECTED Converting circular structure to JSON
Map state: undefined undefined calls 1
__proto__ probs: ACCEPTED calls 2
```

## Copilot round 5 on fgv#721 (against `07ddadd7`) and disposition

Four inline threads, which the orchestrator confirmed by reading the code at `07ddadd7`. All four
are fixed.

**1–2. The caller's input was read again after its check** (threads r4213669430 and r4213669461).
- Before: the gates only reported validity, and `createSystemOneClient`, `askSystemOne` and
  `measureSystemOneInput` then read the caller's objects again. A getter or a Proxy could pass the
  check and then return something else, or throw, on the second read.
- **Fixed** (deviation 28). Each gate returns a converted copy, and the entry points use only that
  copy.
- **U35:** for each entry point, every getter answers valid data on its first read and throws on
  any later read. Each entry point succeeds without throwing, and what was sent or measured is the
  first-read value:
  - the URL, the bearer key and the model id that went out;
  - the exact JSON body;
  - the measure, equal to that of the plain first-read values.

  Rows **R64–R73**, one per place the converted value is used.
- Run against the `07ddadd7` source, with only the new test file added, U35–U37 fail 5 of 7:
  - **the client:** `createSystemOneClient` **throws** `read twice`, because `clientFrom` re-read
    `params.model` outside any guard;
  - **the ask:** `invalid-request: [q] are not well-formed …`, because the old question converter
    read `type` twice, once to dispatch and once for the literal. It never reached the re-reads in
    `checkInputLimit` and `startCall`; R65 and R66 show those separately;
  - **the measure:** `invalid-request: [y] are not well-formed …`, because the `oneOf` over a noul's
    criteria formatted the object on its failed `null` alternative, reading the getter before the
    object alternative did;
  - **U36:** `askSystemOne` **throws** from `hasReservedKey` (`Proxy.hasOwnProperty`);
  - **U37:** `'debug'` is accepted.

  Each use site has its own revert row, so the matrix shows every re-read on its own.

**Entry-point sweep: every exported entry point, and the value it uses after its check**

| export | the caller's input | read | what is used afterwards |
|---|---|---|---|
| `createSystemOneClient(params)` | `params` | once, as a snapshot of its own enumerable fields | `ICheckedClientParams`. `baseUrl`, `model` and `apiKey` are strings; `timeoutMs` is a number. `retry` is a new object of `RetryPolicy`'s declared fields, with `httpStatuses` a new `Set`. `logger` is a new `{ logLevel, detail, info, warn, error }`: the level converted, and each method read once and bound to the caller's logger. `fetch` is the caller's function, **passed through**: it is called, never read, and calling it is its purpose. |
| `askSystemOne(client, request)` | `client` | never: only a `WeakMap` key | the binding stored when the client was created |
| | `request` | once, as a snapshot | `ICheckedRequest`. `state` is a JSON copy. `questions` is a new object of new questions: each is snapshotted, then converted, with instructions and criteria values as JSON copies, choice criteria a new record, score levels a new tuple, and noul criteria a new object or `null`. `inputLimit` is the snapshot's value, converted once by the bound into `'unchecked'` or a new `{ maxChars }`. `signal` is the caller's `AbortSignal`, **passed through**: it is the caller's cancellation channel, which the SDK must observe changing, and this package never reads it as data. The same converted questions are bounded, sent and used to validate the answers. |
| `listSystemOneModels(client)` | `client` | never: only a `WeakMap` key | the binding |
| `measureSystemOneInput(state, questions)` | `state`, `questions` | once each | the same conversions as the request's `state` and `questions`; the measure is of the copies |
| `noul`, `choice`, `score` | their arguments | — | the SDK's own constructors, unchanged (deviation 24) |
| `allSystemOneFailureReasons` | — | — | a constant |

**Pass-throughs, and why each value is never read again:**
- The snapshot (`callerRecord`, over `anyValue`) holds the caller's values. Each one a gate uses is
  then converted, and the rest are never read.
- `signal` and `fetch`: see the table.
- The logger's methods are bound functions. They hold the caller's logger only as `this`, and are
  called, never read.

**3. The reserved-key probe sat outside the throw guard** (thread r4213669487).
- Before: `checkQuestions` probed the questions object for an own `__proto__` before its
  `safeConvert`, so a Proxy whose `getOwnPropertyDescriptor` trap threw made `askSystemOne` reject.
  The answer-set description had the same unguarded probe.
- **Fixed:** the probe is now `reservedKeyIn`, which returns a `Result` from inside `captureResult`.
  `ownRecordOf` and both former call sites go through it.
- **U36** builds Proxies whose `getOwnPropertyDescriptor`, `ownKeys` or `get` trap throws, for the
  client parameters, the request, the questions object, a question and a choice's criteria.
  - Request side: each is `invalid-request`, nothing is sent, and the trap's planted secret appears
    in no message. The questions object is also checked at the measure.
  - Response side: a throwing answer set or distribution fails `validateSystemOneBody` without
    throwing. `askSystemOne` reports that as `invalid-response`. A parsed body cannot be a Proxy,
    so this is pinned through the internal function.
- Row **R74**.

**4. A logger's level was any string** (thread r4213669510).
- **Fixed** (deviation 31). The level is now converted with `Logging.reporterLogLevel`, the
  converter ts-utils publishes, so Copilot's suggested name is the real one.
- **U37:** `'debug'`, `'verbose'`, `'INFO'` and `''` are `invalid-request: invalid [logger] in the
  client parameters`, and all six published levels are accepted.
- Row **R75**.

**Matrix rows re-pointed after the refactor:**
- R32, R34, R41, R42, R46, R51 and R60–R62 had their patterns moved.
- R50's `rejectedFields` now serves only the 2xx-body description, so it must turn U34 red, not U30.
  The gates' per-field guard is the new `named` helper, covered by **R63**.

## Copilot round 6 on fgv#721 (against `12e41c3f`) and disposition

Three threads; all fixed.

**1. A nested reserved key vanished from what was sent** (thread r4214989996).
- **Repro** (the orchestrator's, confirmed at `12e41c3f`): `askSystemOne` with the state
  `{"a":{"__proto__":{"x":1},"b":2}}` sent `{"state":{"a":{"b":2}}}`. `@fgv/ts-json-base`'s
  `jsonObject` copies keys with `obj[name] = v`. A nested `__proto__` therefore became the copy's
  prototype, or was ignored when its value was a primitive, and so disappeared from serialization.
- **Fixed** (deviation 32). The repro now gives `invalid-request: invalid [state] in the request`,
  and nothing is sent.
- **Request side:**
  - Covered: the state, every instruction, and every criterion value (choice descriptions, score
    levels and noul criteria).
  - The walk runs inside `entry`, so it is under the existing `safeConvert` guard.
  - **U38:**
    - State keys two levels down (with an object value and with a primitive value), inside an array,
      and four levels down are each `invalid-request`, at `askSystemOne` and at the measure.
    - A key two levels into an instruction, a choice description, a score level (inside an array)
      or a noul criterion fails as `[q] are not well-formed …`.
    - In every case nothing is sent.
    - Nested JSON without the key, including a *value* `'__proto__'`, is sent intact.
- **Response side, swept:**
  - No received value goes through `jsonValue`.
  - Every record converted below the top level goes through `ownRecordOf`: the answer set, each
    probability distribution and each legend, at every depth.
  - The answer, usage and model-card objects are converted field by field. An undeclared key,
    `__proto__` included, is dropped by construction, as `confidence` is.
  - So no response-side change was needed. U38 adds a reserved key whose value is an object, three
    levels down in a distribution: it is `invalid-response`. U33 already covered a primitive value.
- **Against the `12e41c3f` source,** only U38's request-side test fails: the nested key is accepted
  and the state is sent, with `detail` undefined. The response-side and "sent intact" tests pass
  there, which confirms the sweep above.
- **`--check` mirrors the rule:** an own `__proto__` key at any depth of the state, an instruction
  or a criterion value exits 3. Self-test **S9** has seven cases: the accepted one, the state two
  levels down, the state inside an array, an instruction, a noul criterion, a choice description
  and a score level. It goes red without the harness change.
- **Rows:**
  - **R76** turns the key check off.
  - **R77** stops the walk descending into arrays.
  - **R78** stops it descending into objects.
  - **R79** has the JSON converter read the caller's value again instead of the walk's snapshot,
    and U35 goes red.
  - **H14** and **H15** cover the harness.
  - **R58** was re-pointed to the new line.
- **Upstream:** `jsonObject` is added to the `recordOf` note in deviation 27; same flaw, same fix.

**2. Missing separators** (threads r4214990079 and r4214990123).
- `.ai/conventions/result-integration-boundary.md` line 19: a comma after
  `` `ts-extras-mcp` (`@modelcontextprotocol/sdk`) ``.
- `docs/WORKSTREAMS.md` line 463: a comma after `` `.ai/tasks/active/system-one-design-antagonist/` ``.

## Gates

Re-run on 2026-10-04 after the gate-time fixes, at `0584f819` (source as of the matrix commit plus
README/CAPABILITIES wording), from the repo root unless noted.

**`node common/scripts/install-run-rush.js rebuild`:** exit 0, `SUCCESS: 38 operations`.
- `grep -cE "not met|FAILURE|Operations failed|Error:|error TS"`: **0**.
- `grep -ciE warning`: **1**. That line is Rush's repo-state notice, "Detected 1 Git-tracked symlinks"
  (`.agents/skills`, from `c27dd647`, not this branch). There are no build or lint warnings.
- The log has no NUL padding.

**`change --verify --target-branch origin/integration/system-one-decisions`:** exit 0 (the one
`minor` change file).

**In the package:**
- `rushx build`: exit 0, 0 warnings.
- `rushx lint`: exit 0, 0 warnings.
- `rushx test`: exit 0; 70 passed, 0 failed; 100/100/100/100; 0 warnings; no `c8 ignore`.

**Capability and bundler scripts:** `verify-capability-docs.mjs`, `generate-capability-feed.mjs
--check` and `verify-bundler-resolution.mjs` (21 checked, 0 failed) all exit 0.

**Revert matrix:** 47/47 VERIFIED (above).

**Copilot round 1 (2026-10-07):** after the six fixes, `node common/scripts/install-run-rush.js test`
from the repo root: exit 0, `SUCCESS: 37 operations`, 11 m 35 s; `grep -cE "not met|FAILURE|Operations
failed|Error:|error TS"` **0**; the one `warning` line is the `.agents/skills` symlink notice; no NUL
padding. In the package: fixlint, build, lint and test all exit 0 with 0 warnings; 70 tests, 100%.

**Copilot round 2 (2026-10-07):** after the five fixes, the same repo-wide `rush test`: exit 0,
`SUCCESS: 37 operations`, 11 m 42 s; error grep **0**; the one `warning` line is the same symlink
notice; no NUL padding. In the package: fixlint, build, lint and test exit 0 with 0 warnings; 70
tests, 100%. `perf/systemOneLive.selftest.js`: 4 of 4 pass. Revert matrix 47/47 VERIFIED.

**Copilot round 3 (2026-10-07):** at `6514b3c2`, the repo-wide `rush test`: exit 0, `SUCCESS: 37
operations`, 9 m 42 s; error grep **0**; the one `warning` line is the symlink notice. In the
package: fixlint, build, lint and test exit 0 with 0 warnings; 76 tests, 100%. Self-test 7 of 7.
Revert matrix 57/57 VERIFIED.

**Copilot round 4 (2026-10-08):** at `05e8f95a`, in the package: fixlint, build, lint and test exit
0 with 0 warnings; 86 tests, 100%, no `c8 ignore`. Self-test 8 of 8. Revert matrix 78/78 VERIFIED.
`verify-capability-docs.mjs`, `verify-bundler-resolution.mjs` (21 checked, 0 failed) and `rush
change --verify --target-branch origin/integration/system-one-decisions` exit 0. The repo-wide `rush
test` at `89f189ea`: exit 0, `SUCCESS: 37 operations`, 10 m 39 s; error grep **0**; the one `warning`
line is the symlink notice; no NUL padding.

**Copilot round 5 (2026-10-08):** at `3fe623c1`, in the package: fixlint, build, lint and test exit
0 with 0 warnings; 94 tests, 100%, no `c8 ignore`. Self-test 8 of 8. Revert matrix 91/91 VERIFIED.
`verify-capability-docs.mjs` and `rush change --verify --target-branch
origin/integration/system-one-decisions` exit 0. The repo-wide `rush test` at `38136ed5`: exit 0,
`SUCCESS: 37 operations`, 8 m 42 s; error grep **0**; the one `warning` line is the symlink notice;
no NUL padding.

**Copilot round 6 (2026-10-08):** at `4edb198f`, in the package: fixlint, build, lint and test exit
0 with 0 warnings; 97 tests, 100%, no `c8 ignore`. Self-test 9 of 9. Revert matrix 97/97 VERIFIED.
The repo-wide `rush test` result follows.

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
