# Ledger backfill — drafted entries for review

**These are drafts. Nothing here is in `docs/WORKSTREAMS.md` yet.**

`finalize-task` § "The governing split" says never to auto-commit a ledger entry, and its
retroactive mode adds: *"Batch them, but do not batch the review — each drafted entry is a
claim about what a stream did, and a reviewer skimming twenty at once will not catch a wrong
one."* So these are staged here, one per stream, each carrying the evidence it rests on, to
be moved into the ledger in whatever batches you want to actually read.

**Scope.** The 31 stream directories that `finalize-task` § 8's reconciliation reports as
having no ledger entry under their own name. **Five of those are false gaps** — already
narrated under another name via a pointer the reconciliation cannot see (§ A). Two are not
shipped streams (§ D). That leaves **24 genuinely un-narrated streams**, drafted in § B and
§ C.

**How each was verified.** Every PR number was checked against `release`'s history for a
merge commit, not taken from the artifact — and **matched against the commit *title*, not the
full message**. Grepping the whole message gives false positives: a later commit that merely
*cites* `(#585)` in its body matches, which is how the first pass briefly "confirmed" #585 and
#582 as landing on 2026-08-16 rather than their real 2026-07-31. Both were re-checked against
titles and are correct as stated below. Where an artifact's PR belongs to a *cluster
promotion* rather than to the stream itself, the entry says so — per `finalize-task`, a
sub-stream's PRs are the ones it authored, not the one that carried it to `release`.

---

# § A — naming mismatches: already resolved, nothing to do

**Correction, made while executing this backfill.** I expected to add `ledgerEntry:` pointers
here. **Five already existed** — someone had done this work already, and my reconciliation did
not see it because `finalize-task` § 8's `comm` compares *directory names* against *heading
names* and is blind to a pointer that resolves the mismatch.

| directory | `ledgerEntry:` | target heading exists |
|---|---|---|
| `safer-fetch` | `fetch-primitive-threat-model` | yes |
| `safer-fetch-s3` | `fetch-primitive-threat-model` | yes |
| `ts-prompt-assist` | `ts-prompt-assist-features` | yes |
| `json-schema-converter-alignment` | `json-schema-derives-t` | yes |
| `ts-agent-memory-vector` | `ts-agent-memory` | yes |

**All five are already narrated. None needs an entry, and none needed a pointer.** Two of them
— `json-schema-converter-alignment` and `ts-agent-memory-vector` — I had drafted full entries
for before checking; those drafts are struck through in § C and should NOT be added, or the
ledger gains a second account of a stream it already narrates.

> **Worth fixing at the source:** the reconciliation in `finalize-task` § 8 reports a
> pointer-resolved stream as a gap every time it runs. Teaching it to read `ledgerEntry:`
> would drop the reported gap from 31 to 26 and stop this being re-done. Filed as the first
> item under "Residue worth a decision".

---

# § B — the ai-assist cluster family

Four cluster parents and their sub-streams. **Read the parents first**; the sub-stream
entries are short because their parent carries the narrative.

### `ai-assist-client-tools` ✅ (cluster parent)

**Status:** ✅ shipped to `release` 2026-06-04 via **#451** (`12ab4613e`, cluster promotion),
cluster-closed via **#452** (`ff3a08591`). Artifacts at
`.ai/tasks/completed/2026-06/ai-assist-client-tools/`.
**Package surface:** `@fgv/ts-extras/ai-assist` (additive), plus a browser-barrel fix.

**What shipped.** The harness-supplied (Layer 1) half of tool use: `executeClientToolTurn`
and the `IAiClientTool` / `IAiClientToolConfig` surface, so a caller can implement tools the
provider then calls, across providers.

**Why it is worth reading.** This is the stream `TESTING_GUIDELINES.md` § "Coverage Gap
Resolution" cites as its canonical reference observation. Its exit artifact claimed a live
testbed run had succeeded while `executeClientToolTurn` never merged client tools into the
request `tools` array and three `call*Stream` signatures had never been widened — the model
could not have called a client tool. **All three were fixed inside #451 itself**; what
shipped broken was the *claim*, not the code. The lesson codified from it is the
sequencing one: run `code-reviewer` **before** chasing measured coverage.

### `ai-assist-client-tool-id-fix` ✅

**Status:** ✅ shipped to `release` 2026-06-30 via **#504**. Artifacts at
`.ai/tasks/completed/2026-06/ai-assist-client-tool-id-fix/`.
**Parent:** `ai-assist-client-tools`.

A field-reported bug fix, and the reason it deserves its own line rather than a mention:
**this defect survived its parent's PR, its 100% coverage gate, and its live testbed run**,
and was reported 26 days later by PersonAIlity as intermittent Anthropic "malformed
identifier" errors on client-tool turns. Same package, same files the parent's own review had
touched. It is *not* one of the three fixes bundled into #451, and not one of the
coverage-sequencing defects `TESTING_GUIDELINES.md` cites — those were caught inside the
parent. This one got past everything.

### `ai-assist-cross-provider-continuation` ✅

**Status:** ✅ shipped to `release` 2026-06-04, carried by the `ai-assist-client-tools`
cluster promotion (**#451**); the stream's own work is **#453**. Artifacts at
`.ai/tasks/completed/2026-06/ai-assist-cross-provider-continuation/`.

Extended client-tool continuation wire-forwarding from Anthropic-only to **all four
providers**. The per-provider fidelity difference is the durable fact: OpenAI Responses and
xAI pass entries through verbatim, while Anthropic and Gemini project to `{role, content}` /
`{role, parts}` and drop extra fields — so a consumer must not assume arbitrary fields
round-trip everywhere.

### `ai-assist-tool-continuation` ✅

**Status:** ✅ shipped to `release` 2026-06-09 via **#488** (`5cc4b76ff`). Artifacts at
`.ai/tasks/completed/2026-06/ai-assist-tool-continuation/`.

Made `IAiClientToolContinuation.messages` **cumulative** across `executeClientToolTurn`
rounds, so the natural consumer pattern — replace `continuationMessages` each round — is the
correct one. Before this, the natural-looking call was wrong in a way that only showed up on
multi-round conversations.

### `ai-assist-message-ordering` ✅

**Status:** ✅ shipped to `release` 2026-06-06 via **#478** (`7b614ff32`). Artifacts at
`.ai/tasks/completed/2026-06/ai-assist-message-ordering/`.

**The two turn entry points put conversation history on opposite sides of the current user
turn** — completion used `tail:`, the client-tool turn prepended. Unified on
`{ system?, messages }`, where the last entry is the current turn and everything before it is
history, and the proxy wire body changed to match. A breaking wire change, deliberately taken
rather than preserving two orderings.

### `per-provider-testbed-scenarios` ✅ (cluster parent)

**Status:** ✅ shipped to `release` 2026-06-05 via **#459** (`202c9f6be`, cluster promotion),
closeout **#458**. Artifacts at `.ai/tasks/completed/2026-06/per-provider-testbed-scenarios/`.

Stood up live-wire-verification testbed scenarios for **OpenAI Responses**, **Gemini** and
**xAI grok**, paralleling the existing Anthropic one. The point of the cluster is that these
scenarios hit the real APIs, which is how several of the library fixes below were found.

### `ai-assist-cross-provider-fixes` ✅

**Status:** ✅ shipped to `release` 2026-06-05, carried by the `per-provider-testbed-scenarios`
cluster promotion (**#459**); the stream's own PR is **#457**, which targeted the integration
branch rather than `release`. Artifacts at
`.ai/tasks/completed/2026-06/ai-assist-cross-provider-fixes/`.
**Parent:** `per-provider-testbed-scenarios`.

The library fixes the live scenarios surfaced — the class of defect that only appears when
you call the real API.

### `ai-assist-responses-reasoning-events` ✅

**Status:** ✅ shipped to `release` 2026-06-05, carried by **#459**; the stream's own PR is
**#458**, the cluster **closeout**. Artifacts at
`.ai/tasks/completed/2026-06/ai-assist-responses-reasoning-events/`.
**Parent:** `per-provider-testbed-scenarios`.

Bundled a library fix, a Gemini scenario fix, **provider-drift instrumentation**, and the
live-run verification. The drift instrumentation is the piece with ongoing value: the
`ai-assist:unrecognized-event` warn prefix that lets a deployment alert when a provider's SSE
wire shape changes.

### `ai-assist-gemini-image-refusal` ✅

**Status:** ✅ shipped to `release` (2026-07, off `release` directly). Artifacts at
`.ai/tasks/completed/2026-07/ai-assist-gemini-image-refusal/`.

Gemini's API forbids combining built-in grounding (`web_search`) with function calling in one
request. This turns the provider's opaque `INVALID_ARGUMENT` 400 into a named `Result.fail`
**before any wire call**. First stream to ship under the newly enforced coverage gate
(#517/#518) — its artifact notes 100% coverage was real and had to be hit for real.

### `ai-assist-openai-frontier-responses` ✅

**Status:** ✅ shipped to `release` (2026-07, off `release` directly). Artifacts at
`.ai/tasks/completed/2026-07/ai-assist-openai-frontier-responses/`.

OpenAI frontier-model routing over the Responses API, including the
`responsesOnlyModelPrefixes` routing that keeps Responses-only models reachable via
`modelOverride` without making them a tier default. Also shipped under the enforced coverage
gate.

### `ollama-native` ✅

**Status:** ✅ shipped to `release` 2026-06. Artifacts at
`.ai/tasks/completed/2026-06/ollama-native/`.

First-class Ollama support across two activities: the `/v1`-compat completion path owned by
`ai-assist`, and `@fgv/ts-extras-ollama` for the native-only surface (model management,
streamed pull, grammar-constrained `chatStructured`). **Native `embed` was CUT** (OQ-1,
resolved by `ai-assist-embeddings`): Ollama embeddings are owned by
`AiAssist.callProviderEmbedding` via `/v1`, and a parallel native path would have added only
marginal diagnostics.

### `ts-extras-mcp` ✅

**Status:** ✅ shipped to `release` 2026-06-06 via **#469/#471/#479** (`7a8f19f90`, promotion).
Artifacts at `.ai/tasks/completed/2026-06/ts-extras-mcp/`.

`@fgv/ts-extras-mcp` — the MCP → ai-assist client-tools bridge, so any MCP server's tools
become callable across all four providers with no per-provider work. The load-bearing
behaviour is **graceful degradation**: a tool whose `inputSchema` is outside the
`JsonSchema.fromJson` subset is excluded from `tools`, surfaced structurally on `skipped`, and
NOISY-warned — the model is never offered a tool whose arguments cannot be validated.

---

# § C — the rest

### `agent-memory-fragment-id` ✅

**Status:** ✅ shipped to `release` 2026-07-31 via **#585** (`67e128480`). Artifacts at
`.ai/tasks/completed/2026-07/agent-memory-fragment-id/`.

Durable, opaque fragment identity: optional `fragmentId` (stored and returned verbatim, never
parsed) alongside the **advisory** `locator`, with at-least-one-of enforced by the converter
and both index implementations. **Neither field discriminates a fragment hit from a record
hit** — that is determined by which index produced it — and the consumer's own proposed fix
(discriminate on `fragmentId`) has the same flaw one level down.

> Its `result.md` says PR #585 "not merged"; it merged. Corrected in the stream's README
> appendix, with `result.md` left unedited per the artifact protocol.

### `agent-memory-index-injection-seam` ✅

**Status:** ✅ shipped to `release` 2026-07-31 via **#582** (`6593668ad`). Artifacts at
`.ai/tasks/completed/2026-07/agent-memory-index-injection-seam/`.

One additive optional `index?: IMemoryIndex` param on the store factory; omitting it is
byte-identical to before. **Its premise was later found wrong** and is worth recording as
such: the seam was read as the resident-memory fix, but the ceiling was in the read
*contract* — every read returned whole records by construction — which
`agent-memory-index-partial-read` then corrected.

### ~~`ts-agent-memory-vector`~~ — DO NOT ADD

**Struck.** Already narrated under `ts-agent-memory`, via a `ledgerEntry:` pointer that was
already in its `meta.yaml`. I drafted an entry before checking; adding it would give the
ledger two accounts of one stream. See § A.

### `async-result-family` ✅

**Status:** ✅ shipped to `release` 2026-08-02 via **#596** (`1220dae50`), design **#595**.
Artifacts at `.ai/tasks/completed/2026-08/async-result-family/`.

Five bounded-parallel collectors plus two serial-by-contract members, each mirroring its sync
sibling's name, parameter order and fold. **They take deferred work, never materialized
promises** — a promise that already exists has already started, so a collector handed one has
nothing left to bound. That constraint is the design, not an ergonomic detail.

> Reconstructed from git history; no `result.md` was ever written. `diverged` is blank
> because the evidence to fill it does not exist.

### `safer-fetch-s3` ✅

See `fetch-primitive-threat-model` — this is its S3 sub-stream (browser entry points, retry,
docs). Needs a `ledgerEntry:` pointer, not its own entry. Its own PRs: **#599**, **#601**.

### `testbed-web-scenarios` ✅

**Status:** ✅ shipped to `release` 2026-07-27 via **#570** (`9af7826bd`, Phase B) over
**#569** (Phase A). Artifacts at `.ai/tasks/completed/2026-07/testbed-web-scenarios/`.

An additive `ICliScenarioImpl.webRunnable?: boolean` opt-in plus a shell-generic
`ScenarioRunnerPanel`, so browser-clean CLI scenarios run from the testbed web UI without a
bespoke React component each. Absent/false preserves CLI-only behaviour.

> Reconstructed from git history; no `result.md` survives.

### `heft-rig-coverage-gate` ✅

**Status:** ✅ shipped to `release` 2026-07-07 via **#518** (`8e84cf0e6`), with **#517**
(`e0300c1c4`) enforcing jest coverage-threshold misses as build failures. Artifacts at
`.ai/tasks/completed/2026-07/heft-rig-coverage-gate/`.

Made the coverage gate **actually enforced in CI** rather than nominally required — CI now
runs `rush test`. Several later streams' artifacts note they were the first to ship "under the
enforced gate", which is how you can tell it changed behaviour.

> Reconstructed from git history; no `result.md` survives.

### `esm-emit-design` ⚠️ / `esm-emit-impl` ⚠️ (a pair)

**Status:** ⚠️ shipped to `release` 2026-08-09 inside **#607** (`71787e798`); the
implementation's own **#603** did not merge under that number. Artifacts at
`.ai/tasks/completed/2026-08/esm-emit-{design,impl}/`.

**The design's central recommendation does not work**, and the implementation is what found
that: the `dist` ESM emit contains extensionless directory imports, which is why Node could
not load it — the bug that started the whole effort. The design assumed bundlers tolerate
that.

**The design doc is deliberately left uncorrected.** That a signed-off design was wrong and
step-zero verification caught it is the most valuable thing this pair records; correcting it
would make the divergence read as an oversight.

### `crypto-utils-base64url-hardening` ✅

**Status:** ✅ shipped to `release` 2026-07-07 via **#519** (`479e20bd3`). Artifacts at
`.ai/tasks/completed/2026-07/crypto-utils-base64url-hardening/`.

base64url-no-pad helpers and a branded `MultibaseSpkiPublicKey`. Two PersonAIlity V2 identity
asks (RFC 9421 signatures + WebAuthn), bundled because both are additive on `crypto-utils`
and tightly coupled. This is the stream behind the guidance that
`fromBase64Strict` — not `fromBase64`, and not `Buffer.from(s,'base64')` — is what you reach
for when the base64 came from somewhere you do not control.

### ~~`json-schema-converter-alignment`~~ — DO NOT ADD

**Struck.** Already narrated under `json-schema-derives-t`, via a `ledgerEntry:` pointer that was
already in its `meta.yaml`. I drafted an entry before checking; adding it would give the
ledger two accounts of one stream. See § A.

### `ks-encoding` ✅

**Status:** ✅ shipped to `release` 2026-05. Artifacts at
`.ai/tasks/completed/2026-05/ks-encoding/`.

A top-level `--encoding <text|base64|hex>` flag on `ks get` / `ks export`; default `text`
preserves prior behaviour exactly. Enables binary-safe secret retrieval.

**Left open deliberately:** whether `ks get` / `ks export` should ever *auto-detect*
non-UTF-8 secret bytes and default to base64. Recorded rather than decided.

### `prompt-assist-horizontal-composition` ✅

**Status:** ✅ shipped to `release` 2026-06-19 via **#490/#491/#492** (`1daac07c5`). Artifacts
at `.ai/tasks/completed/2026-06/prompt-assist-horizontal-composition/`.

`HorizontalComposer` — provenance-ordered, directive-aware merge of N peer contributors into
one composed prompt. The load-bearing rule: **`constraint`-directive contributions are always
concatenated first and never dropped, regardless of strategy**. It closes the safety gap of
the consumer-side external-composer path, which read `IResolvedPrompt.slots` directly and had
to self-screen.

Four open questions were resolved in-stream (composed descriptor YAML-authored;
`ILogicalSlotConfig` code-first; `'\n\n'` separator, per-slot overridable), and the phase-B
implementation forked from the ratified design in named ways — both recorded in the artifact.

### `ts-prompt-assist-observability` ✅

**Status:** ✅ shipped to `release` 2026-06-04 — Phase A **#455**, Phase B (`34ef9443`), Phase
C **#456** on a dedicated integration branch. Artifacts at
`.ai/tasks/completed/2026-06/ts-prompt-assist-observability/`.
**Workflow:** `design-triage-implement`.

`PromptObservationStore` and the `IPromptObserver` fan-out, plus **`RetainingRingBuffer` in
`@fgv/ts-utils`** — the generic bounded most-recent-N ring underneath it. The ring is the
piece with reach beyond this package: it is the answer for any retain-and-page surface, and
exists because this stream declined to hand-roll one.

### `retaining-logger-ring-buffer-refactor` ✅

**Status:** ✅ shipped to `release` 2026-06-06. Artifacts at
`.ai/tasks/completed/2026-06/retaining-logger-ring-buffer-refactor/`.

Moved `RetainingLogger` onto the shared `RetainingRingBuffer` rather than its own circular
buffer — the follow-through that made the primitive above actually shared instead of
merely available.

> Its artifact records **PR: TBD (see commit SHA)**, so the PR number is not recoverable from
> the artifact. Left blank rather than guessed.

### `result-should-not-fail` ✅

**Status:** ✅ shipped to `release` 2026-05-21 via **#400** (`d1e4e2fb1`). Artifacts at
`.ai/tasks/completed/2026-05/result-should-not-fail/`.

`Result.shouldNotFail()` for declaration-time invariants — the case where a failure means the
program is wrong rather than the input is.

---

# § D — not shipped streams; no ledger entry appropriate

| directory | why |
|---|---|
| `agent-memory-mcp-server` | **PROPOSED, conditional.** Explicitly gated: *"do not start until `task-corpus-index` has shipped and been shown insufficient."* Internal motivation, not a consumer ask. Belongs in the backlog, not the shipped ledger. |
| `packaging-prepublish-fixes` | **Not a stream.** No brief, no result — an orphaned findings inbox. Its one finding (MIT declared with no LICENSE file) is dispositioned as resolved in its README. Marked `status: abandoned`. |

---

# Residue worth a decision

- **The reconciliation over-reports.** `finalize-task` § 8 compares directory names to heading
  names and does not read `meta.yaml`'s `ledgerEntry:`, so five already-narrated streams are
  reported as gaps on every run — and I re-derived entries for two of them before catching it.
  Teaching the script to honour the pointer is a small change that stops this recurring.

- **`retaining-logger-ring-buffer-refactor` has no recoverable PR number.** Its artifact says
  "TBD (see commit SHA)" and the SHA is not in the file. Recoverable with a targeted
  `git log -S` if you want it; left blank rather than guessed.
- **Four ledger entries have no directory** — `ai-assist-thinking-events`,
  `fetch-primitive-threat-model`, `personaility-asks-2026-08`, `ts-prompt-assist-features`.
  Three are the mismatch targets in § A. `ai-assist-thinking-events` is marked 🟡 in the
  ledger and has no stream directory at all, which is worth a look: either it never started,
  or its directory is named something else again.
