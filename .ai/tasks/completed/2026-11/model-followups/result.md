# Result — model-followups

**Shipped:** the client-tool path refuses a caller-built OpenAI-format `'none'` effort on a
thinking-required model; a malformed `ModelSpec` fails with the provider and the offending key instead
of throwing; Groq and xAI send `max_completion_tokens` through a new descriptor declaration; four
flaky tests are deterministic and a fifth entry is narrowed; `gpt-6-luna` stays off the
sampling-restricted list, with two report-only canary rows to settle it; both held aliases stay held.

Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`), `@fgv/ts-extras-mcp` (tests, `none`),
`@fgv/ts-res-cli` (tests, `none`), `@fgv/testbed` (private, `none`). Branch `model-followups`, based on
`origin/integration/asks` @ `f66b7f0c0`. PR: #774.

Logs are under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/followups/`.

## 1. F1 — OpenAI client-tool `'none'` guard

**Changed.** `executeClientToolTurn` (`streamingAdapters/clientToolContinuationBuilder.ts`) now refuses,
before the wire, a `resolvedThinking` whose OpenAI-format effort is `'none'` when the model is on the
descriptor's `thinkingRequiredModelPrefixes`:
`executeClientToolTurn: gpt-6.1-sol cannot run with thinking off: set openAiEffort to an effort other than 'none'`
— the same family as the existing Anthropic refusal (`… cannot run with thinking off: drop
anthropicThinkingDisabled or set an anthropicEffort`).

- Data-driven: the condition is `isThinkingRequiredModel(descriptor, model)` plus the descriptor's
  `apiFormat === 'openai'` (the wire whose adapter sends `openAiEffort ?? xaiEffort`). No provider id.
  So it also refuses `xaiEffort: 'none'` on `grok-4.7` / `-4.6` / `-4.5`, which the provider rejects for
  the same reason (state.md D1). An Anthropic-format descriptor ignores `openAiEffort` and is not refused.
- The `resolvedThinking` TSDoc now states both refusals.

**Red → green.** New `src/test/unit/ai-assist/openAiThinkingAndTemperature.test.ts`: before the guard,
5 of 9 red — the four refusals (`gpt-6.1-sol`, `@openai:flagship`, `gpt-6-astra`, `@openai:pro`) and
the `grok-4.7` refusal all returned `Success` (`f1-red.log`); after, 9/9 (`f1-green.log`). The
pass-through rows (luna and gpt-6-sol send `reasoning.effort: 'none'`; sol sends `low`; Anthropic
ignores `openAiEffort`) pass both ways by design.

**Record closed:** `live-run-corrections/state.md` F1.

## 2. F2 — `gpt-6-luna` / `gpt-6-sol` with `temperature: 1` beside an effort

"Sol" below always means `gpt-6-sol`, the older Sol model reachable only by `modelOverride` — not
`gpt-6.1-sol` (`@openai:flagship`), which is on the sampling-restricted list.

**Current behaviour on the base** (established with no source change, `f2-base.log`), *corrected in
review round 1*: on the **completion and streaming** paths, on both models, a `temperature` beside any
non-`'none'` effort — `1` included — is refused locally by `checkTemperatureConflict` ("thinking mode is
not compatible with temperature on provider openai"), because neither is on
`samplingParamsRejectedModelPrefixes`, so `temperatureAcceptedWithThinking` is undefined for them;
`0.3` with effort `'none'` is sent. #771's 5a did not change this: its exemption applies only to listed
models. **The client-tool path was different, and the first version of this section missed it:**
`executeClientToolTurn` ran `checkSamplingParams` but not `checkTemperatureConflict`, so the same
temperature beside a caller-built `openAiEffort` reached the OpenAI Responses adapter, which dropped it
silently and the call succeeded. Fixed in review round 1 (§ 10).

**Decision: luna stays off `samplingParamsRejectedModelPrefixes`** (state.md D2). That list is
effort-blind: a listed model's every non-accepted temperature is refused with or without an effort.
Listing luna would refuse `temperature: 0.3` with effort `'none'` — which the GPT-6 guide documents as
supported ("When reasoning effort is not none, remove temperature, top_p, and top_logprobs") and which
the testbed's `base temp=0.3+effort=none` row expects to answer. The evidence, luna's 400 for 0.3
("'temperature' does not support 0.3 with this model. Only the default (1) value is supported."), was
taken with no effort set, so at luna's default `medium`: it describes luna *with* reasoning on, and
suggests — does not show — that `1` is taken there. If the probe below reads `accepted`, the fix is an
effort-conditional accepted temperature, a new descriptor shape, not this list.

**Evidence the decision is pinned.** Tests in `openAiThinkingAndTemperature.test.ts`: `0.3` +
effort `'none'` is sent to `gpt-6-luna`, `@openai:mini` and `gpt-6-sol`; `1` and `0.3` beside effort
`low` are refused on `gpt-6-luna` and `gpt-6-sol` — on the completion path in the first version, and
on all three paths after review round 1. Mutant — luna added to the list (`f2-mutant-luna-listed.log`):
4 red (`0.3`+`'none'` on luna and `@openai:mini` refused; luna `1` and `0.3` beside `low` no longer
the conflict message). Restored: all green.

**Testbed probe rows** (`samples/testbed/src/scenarios/modelTiers/index.ts`, OpenAI tier canary),
following the existing `raw` / `observed` pattern: `base temp=1+effort=low raw` and
`base temp=0.3+effort=low raw`, both on `gpt-6-luna`, `expect: 'observed'`. Each sends the temperature
in an `'other'` block beside a generic effort `low`, past the library's gate, and prints what the
provider said. Keyless they print `[PENDING] … (expect observed)`. Tests updated in
`modelTiers.test.ts` (keyless rows) and `modelTiersRequests.test.ts` (fake-provider outcomes and the
sent bodies `['gpt-6-luna', 1, 'low']`, `['gpt-6-luna', 0.3, 'low']`); 2 red before the probe edit
(`tb-red.log`), 146/146 after (`tb-green.log`). README tag table and probe list updated.

**Run sheet — new rows** (OpenAI scenario, keyed):

| row | prints | reading |
|---|---|---|
| `base temp=1+effort=low raw` (gpt-6-luna) | `[OBSERVED] … (accepted)` | luna takes its default beside an explicit effort → follow-up: an effort-conditional accepted temperature for luna |
| | `[OBSERVED] … (rejected: … temperature …)` | luna refuses even `1` beside an effort → the local conflict refusal is right; close F2 |
| `base temp=0.3+effort=low raw` (gpt-6-luna) | `[OBSERVED] … (rejected: … temperature …)` | the control: the raw value reached the provider. `accepted` here would contradict the 0.3 evidence |

**Record closed:** `live-run-corrections/state.md` F2 (decision recorded; the open question moves to
the two OBSERVED rows).

## 3. `resolveModel` fails instead of throwing

**Changed.** The `ModelSpec` walk is now a Result-returning internal `walkModelSpec` (new file
`modelSpecResolver.ts`, which also takes `resolveModel`, `MODEL_SPEC_BASE_KEY` and the tier fallback
table out of `model.ts` — that file was 2 lines under the 2000-line `max-lines` cap on the base and the
walk would have pushed it over). A value that is neither a model id nor an object fails with the
dotted path of its key. Public signatures:

- `resolveProviderModel` keeps `Result<string>` and now fails, rather than throws, with the provider id
  and the path: `provider "openai": model spec modelOverride.base is undefined: expected a model id or a
  model spec object`. The root is `modelOverride` or `defaultModel`, whichever was walked.
- `resolveModel` keeps `string` (external consumers call it, e.g. with `'tools'`) and resolves such a
  spec to `''`, as it already did for an empty spec; its TSDoc points at `resolveProviderModel` for the
  failure. The empty-spec branch is now covered by a test, and its pre-existing `c8 ignore` is gone.

**Red → green.** New `malformedModelSpec.test.ts`, one test per call site the record lists:
`resolveProviderModel` (override, nested path, descriptor default), `callProviderCompletion`,
`callProviderCompletionStream`, `executeClientToolTurn` (through the descriptor's default — its `model`
is a string), `resolveMaxOutputTokens` (returns `undefined`, no throw), and `resolveModel`. Before: 8
red, each a thrown `TypeError` (`item3-red.log`); after: 10/10, and the existing `model`, `modelAlias`
and `registry` suites unchanged (208/208, `item3-green.log`).

**Record closed:** `docs/TECH_DEBT.md` "[P3] `resolveModel` throws …" — removed.

## 4. Groq `max_tokens` deprecation

**Docs read (2026-11-11):**

| provider | source | verdict |
|---|---|---|
| Groq | console.groq.com/docs/api-reference, chat completions | `max_tokens` "Deprecated in favor of `max_completion_tokens`" → **set** |
| xAI | docs.x.ai/developers/rest-api-reference/inference/chat-completions | `max_tokens` "[DEPRECATED] … Deprecated in favor of `max_completion_tokens`" → **set** |
| Mistral | docs.mistral.ai/api | only `max_tokens`, no deprecation, `max_completion_tokens` absent → unchanged |
| Ollama | `docs/api/openai-compatibility.mdx` in ollama/ollama (docs.ollama.com does not resolve from this session) | supported fields list `max_tokens`; `max_completion_tokens` absent → unchanged |
| openai-compat | any server | unchanged (`max_tokens` is the only field such servers can be assumed to know) |

**Changed.** New `IAiProviderDescriptor.chatOutputTokensField?: ChatOutputTokensField`
(`'max_tokens' | 'max_completion_tokens'`, default `max_tokens`). `usesMaxCompletionTokensField` reads
it instead of `descriptor.id === 'openai'`. Declared `'max_completion_tokens'` on OpenAI, Groq and xAI
Grok, each with its source at the declaration. Doc comments on `maxTokens` in `completionClient.ts` and
`streamingAdapters/common.ts`, the ai-assist README and CAPABILITIES updated. The testbed wire probe
(which builds its raw body with `usesMaxCompletionTokensField`) now sends `max_completion_tokens` to
xAI, and its test expects that.

**Red → green.** New `chatOutputTokensField.test.ts`: completion and streaming request bodies for all
six OpenAI-format providers. With the descriptor change but no registry declarations: 9 red (OpenAI,
Groq, xAI on both paths, and the three `usesMaxCompletionTokensField` registry rows — `item4-red.log`);
with declarations: green (`item4-green.log`). The two existing synthetic-descriptor tests that relied on
`id: 'openai'` now declare the field.

**Disclosed:** a hand-built descriptor that relied on `id: 'openai'` to get `max_completion_tokens`
must declare the field (change file says so). xAI describes `max_completion_tokens` as bounding
*visible* output only, not reasoning tokens — recorded at the declaration; see Q1.

**Record closed:** `model-alias-refresh` Q5.

## 5. Flake hardening

Determinism runs: each test 20× with `--maxWorkers=1` while 8 CPU-bound `node` loops ran on the 4-core
machine (`determinism.txt`).

| entry | what was wrong | fix | evidence | record |
|---|---|---|---|---|
| `ts-extras` `saferFetchRetry` "an exhausted deadline …" (P2) | full-jitter delay drawn from `Math.random` | **already fixed** by #745 (`232067559`): fake clock + `pinRandom(0.0062)` | 20/20 under load | entry removed; `TECH_DEBT` (a)'s sibling list notes it |
| `ts-extras` `keyStoreArgon2id` "returns false when salt does not match" (P3) | a fresh random salt can share the fake KDF's weighted sum | flip one bit of the stored salt: the seed moves by exactly 1, and the low-8-bit LCG that produces each key byte is a bijection, so `key[0]` always differs | 20/20 under load; deterministic by construction | entry removed; the P2 "(c)" duplicate marked resolved |
| `ts-extras-mcp` cancellation "maxTotalTimeoutMs caps …" (P3) and its two progress siblings | 30 ms progress timers raced 80 ms / 70 ms deadlines on real timers | an `onFakeClock` helper fakes `setTimeout`/`setInterval`/`Date` (the in-memory transport's promise jobs stay real) and advances 200 ms | mutant advancing only 50 ms: 3 red (`cancel-mutant.log`), proving the fake clock drives them; 20/20 under load | entry removed |
| `ts-res-cli` "consistent output by building same input twice" (in the P3 wall-clock entry) | two CLI spawns inside Jest's 5 s default | explicit timeout `2 * SINGLE_SPAWN_BUDGET_MS` (10 s): the 5 s budget each single-spawn test in the file runs under, twice. One spawn is ~0.7 s idle | 20/20 under load | bullet removed from the wall-clock entry |
| `ts-extras-mcp` `egress.test` resumed-GET over-cap (P3) | unknown | **no change.** The recorded failure is a 15 s `Request timed out`, not a late over-cap failure, so the answer never reached the client — a lost resume, not a tight bound. 25 runs alone + 12 whole-file runs under 6–8 CPU loops: all pass | — | **narrowed**: failure analysis, the three SDK steps it could have lost, and what to capture on a second failure |

`sudoku` and `ts-res` `deltaGenerator` left alone. No `c8 ignore`, no skips.

## 6. Held aliases re-check

- **Q2 `@openai:image` → `gpt-image-2.6-sunburst`: stays held.** The models page (2026-11-11) still
  describes `gpt-image-2.5-sunburst` as "Our most capable model for image generation and editing" and
  2.6 as "Image generation and editing for detailed visual work"; neither now carries a "Default"
  badge. The 2.6 page states no sizes, qualities, `n` or performance tier; the image guide names no
  default (it recommends Sunburst vs Flare by use case) and its size/quality table is introduced in
  terms of the 2.5 models. The rotation condition (2.6 named default/recommended, and its sizes and
  qualities matching the descriptor) is not met. Noted, not acted on: the guide says the 2.5 models add
  `xhigh` and `max` quality, which the `gpt-image-` entry's `acceptedQualities` does not list.
- **Q4 `gemini-embedding-2`: stays held.** Google's embeddings page: both listed stable; "The embedding
  spaces between `gemini-embedding-001` and `gemini-embedding-2` are incompatible"; "you must re-embed
  all of your existing data"; and "You cannot use the `task_type` field for the `gemini-embedding-2`
  model". New `docs/FUTURE.md` entry "`ai-assist` — offer `gemini-embedding-2` without moving
  `@google-gemini:embedding`" records what a consumer must do (re-embed, a separate alias or
  `modelOverride`, no `taskType` — the Gemini embedding catch-all declares `supportsTaskType: true`, so
  a model entry must precede it).

## 7. Review (inline, code-reviewer rubric) before coverage closure

Run over the source diff before the full-coverage run. Findings and dispositions:

- P2 — `model.ts` would exceed `max-lines` (the build warning surfaced it): resolved by moving the
  walk to `modelSpecResolver.ts`; `model.ts` imports only `walkModelSpec`, the new file imports only
  types from `model.ts`, so there is no runtime cycle.
- P2 — `resolvedThinking` TSDoc did not say the client-tool path refuses anything: fixed.
- P3 — the existing `c8 ignore` on the empty-spec branch became reachable by a well-typed `{}`: removed
  and covered.
- Checked and clean: no `any`; no casts in source (the `typeof spec !== 'object'` check guards a typed
  value and fails, never casts); Result chaining in `resolveProviderModel` (`withErrorFormat` →
  `onSuccess`); no provider-id branch added (the one that existed was removed); no new public function.
- Rechecked after: `ChatOutputTokensField` is exported from the barrel with the field; `api.md`
  regenerated (the moved exports and the new type/field).

## 8. Open questions

- **Q1 (xAI `max_completion_tokens` semantics).** xAI documents it as bounding visible output only,
  "not … tokens used for reasoning or function calls". If deprecated `max_tokens` bounded reasoning
  too, a caller's `maxTokens` on a reasoning Grok model now caps less than before. The docs do not
  describe `max_tokens`' semantics beyond "Deprecated in favor of", so this is unverified; a keyed run
  with a small `maxTokens` on `grok-4.7` would show it.
- `testbed`'s `xaiCacheProbe` still sends raw `max_tokens: 1` on its own Chat Completions body (it does
  not go through the descriptor). Deprecated but accepted; left as is.

## 9. Gates

Graded by grep over each log, not by exit code: `not met|Operations failed|error TS|Jest tests? failed|FAILURE`
must be 0, and the only `warning` allowed is Rush's tracked-symlink notice. Every log checked for NUL
padding (byte count with and without NULs equal). Run from `/home/user/fgv-followups`, foreground,
after committing.

| gate | result | log |
|---|---|---|
| `rush install` | pass | `gate-install.log` |
| `rush change --verify --target-branch origin/integration/asks` | pass — change files found for `testbed`, `ts-extras-mcp`, `ts-extras`, `ts-res-cli` | `gate-change.log` |
| `rush rebuild` | `SUCCESS: 39 operations`, 0 graded hits, symlink notice only, 7m12s | `gate-rebuild.log` |
| `rush lint` | `SUCCESS: 34 operations`, 0 graded hits, symlink notice only | `gate-lint.log` |
| `rush test`, in three `--only` groups (each foreground run had to fit the tool's 10-minute limit; together they cover all 39 projects) | A (core + sudoku, 13 ops) and B (`ts-extras` family + `ts-res-cli`, 9 ops) clean. **C first run: `@fgv/testbed` `SUCCESS WITH WARNINGS` — branch coverage 99.95%**: the wire probe's `max_tokens` branch became unreached once xAI declared `max_completion_tokens` (my earlier testbed runs used `--disable-code-coverage`). Fixed with a test that a descriptor declaring no field gets `max_tokens` (commit after `915a93031`); testbed re-run alone: `SUCCESS: 1 operation`, 0 graded hits; `rush lint --only @fgv/testbed` clean. The other 15 C projects passed on the first run | `gate-test-A.log`, `gate-test-B.log`, `gate-test-C.log`, `gate-test-C2.log`, `gate-lint-C2.log` |
| prettier 2.8.8 `--check` on every changed `.ts` / `.json` / `.md` | pass (2.8.8 installed into the scratchpad only; the repo's store has 3.x, which disagrees on pre-existing lines) | — |
| `verify-capability-docs` | pass, 0 failed | — |
| `generate-capability-feed --check` | pass, 0 stale (regenerated: this stream's `headline`) | — |
| per-package `heft test --clean` with coverage | `ts-extras` 3617/3617, 100% (incl. new `modelSpecResolver.ts`); `testbed` 710/710, 100% | `x-test-full2.log`, `tb-full2.log` |

No `c8 ignore` added (one removed). No subagent spawned; review applied inline (§ 7).

## 10. Review round 1 (independent review of `2f3ffa6dc`, no P1)

Logs under the same directory, prefixed `r1-`.

1. **(P2) Silent temperature drop on the client-tool path — fixed.** `executeClientToolTurn` now runs
   `checkTemperatureConflict` before `checkSamplingParams`, the order the completion and streaming
   paths use, with the caller-built `resolvedThinking` (no degrade, so `noneDegraded` is false) and
   `temperatureAcceptedWithThinking`. The OpenAI Responses adapter's silent drop is gone: it now sends
   any temperature the caller provided, as the Chat adapter already did, and its
   `temperatureAcceptedWithThinking` argument is removed (both callers refuse a conflicting value
   first). Consequence, disclosed in the change file: on a provider with no thinking discriminator
   (Groq, Mistral, Ollama, `openai-compat`), a caller-built effort and temperature are both sent as
   built rather than the temperature being dropped.
   - **Red → green:** new rows for `gpt-6-luna` and `gpt-6-sol` × {0.3, 1} beside effort `low`, on
     completion, streaming and client-tool (plus `gpt-6-sol` 0.3 on completion, which was missing).
     Before the fix the four client-tool rows were red (each succeeded and sent the request),
     completion and streaming already green (`r1-p2-red.log`). After: green.
   - Two existing tests in `thinkingOffAndSampling.test.ts` pinned the drop ("adapter safety net",
     `gpt-6-luna` and `claude-haiku-4-5`); they now expect the refusal. The Anthropic adapter's own
     drop is unchanged and no longer reachable from the client-tool path for that case.
2. **(P3) Anthropic guard keyed on `apiFormat` — fixed.** The `anthropicThinkingDisabled` refusal now
   applies only to an Anthropic-format descriptor. Tests both ways: an OpenAI descriptor carrying the
   flag on `gpt-6.1-sol` is sent (`reasoning.effort: 'low'`), and the Anthropic refusal still fires.
   Red: with the `apiFormat` clause removed, the OpenAI-direction test fails (`r1-p3a-red.log`, 1 red).
3. **(P3) Change file** — now starts `BREAKING (implementers only):` for the `chatOutputTokensField`
   behaviour change on hand-built descriptors, states the xAI open question, and discloses items 1
   and 5 here.
4. **(P3) TSDoc links** — `ChatOutputTokensField` and the `usesMaxCompletionTokensField` remarks use
   `{@link AiAssist.IAiProviderDescriptor.chatOutputTokensField}`; the moved `modelSpecResolver.ts`
   links and the `resolveProviderModel` return note use `AiAssist.`-qualified links too.
   `etc/ts-extras.api.md`: "does not have an export" warnings 103 now (base 106, previous head 110),
   so none of this stream's remain; the qualified form carries api-extractor's
   "not supported yet by the resolver" note, as every sibling `AiAssist.` link does (320, base 311).
5. **(P3) Own-key lookup in `modelSpecResolver.ts` — fixed.** Both the spec and the tier fallback
   table are read through `Object.prototype.hasOwnProperty` (the package's `lib` is ES2018, so no
   `Object.hasOwn`). The table lookup mattered as much as the spec: `TIER_FALLBACK['constructor']` was
   `Object`, which made the walk throw `order.find is not a function`. Tests: `resolveModel` with
   contexts `constructor`, `toString`, `__proto__` falls back to `base`; `resolveProviderModel` with
   `'constructor'` resolves the base model. Red against the previous head: 4 red (`r1-p5-red.log`).
6. **(P3) Wording** — the cancellation test comment now says 90 ms have elapsed, past the 70 ms cap;
   the ledger says the CLI test got timeout headroom, not that it was made deterministic.

**Re-gate** — see § 11.

## 11. Gates, review round 1 (on `b84774f8d`)

Same grading as § 9; logs prefixed `r1-`; no log NUL-padded.

| gate | result | log |
|---|---|---|
| `rush install` | pass | `r1-gate-install.log` |
| `change --verify --target-branch origin/integration/asks` | pass | `r1-gate-change.log` |
| `rush rebuild` | `SUCCESS: 39 operations`, 0 graded hits, symlink notice only | `r1-gate-rebuild.log` |
| `rush lint` | `SUCCESS: 34 operations`, 0 graded hits, symlink notice only | `r1-gate-lint.log` |
| `rush test` (groups A / B / C, all 39 projects) | `SUCCESS: 13`, `SUCCESS: 9`, `SUCCESS: 16` operations, 0 graded hits, symlink notice only, no coverage warning | `r1-gate-test-{A,B,C}.log` |
| `ts-extras` `heft test --clean` | 3633/3633, 100% coverage, 0 warnings | `r1-x-test-full.log` |
| prettier 2.8.8 `--check`, `verify-capability-docs`, `generate-capability-feed --check` | pass | — |
