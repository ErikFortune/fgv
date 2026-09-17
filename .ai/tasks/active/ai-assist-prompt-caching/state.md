# State — `ai-assist-prompt-caching`

**Branch:** `claude/ai-assist-prompt-caching` (design/research lineage); C1 implemented on
`claude/ai-assist-cache-observability`, branched from this lineage's tip (which already
carries `release` merged in) rather than from bare `release`, since the design/research
docs this slice's brief requires only exist here.

| phase | status | artifact |
|---|---|---|
| A — research | ✅ complete (2026-09-07) | `research.md` |
| B — design | ✅ complete (2026-09-08); all 5 OQs closed 2026-09-17 | `design.md` |
| triage | not run — see design.md's process note (§ preamble); OQs decided directly | — |
| C1 — observability | ✅ implemented (this checkpoint) | `libraries/ts-extras/src/packlets/ai-assist/{usageTypes,usageNormalization}.ts` + adapters |
| C2 — diagnostics + vocabulary | ⛔ not started | — |
| C3 — emit | ⛔ not started; gated on C1 **and** C2 | — |

## Phase B checkpoint

**Deliverable:** `design.md`. No implementation, no PR, no surface committed to.

**Brief claims re-verified against the tree — all five hold.** No falsification.
Details in `design.md` §0.

**Four additions the brief did not have** (`design.md` §0):

- **F1** — `ts-prompt-assist` already depends on `@fgv/ts-extras` and already imports
  `AiAssist` (`outputPipeline.ts:7`). The dependency direction is enforced by the
  package graph, and the cache-plan type therefore belongs in `ai-assist`.
- **F2** — the tuple needs a third axis, the **wire endpoint**. `apiFormat: 'openai'`
  splits at runtime into Chat Completions vs Responses on `hasTools`, and cache-write
  reporting exists only on the latter.
- **F3** — xAI is reached over the OpenAI-compatible path, so `research.md` §3.2's proto
  field names are not the ones the code will see. Resolves research §3.4; opens **OQ-1**.
- **F4** — `IAiStructuredOutputCapability` (model-keyed, longest-prefix-wins) and
  `IAiEmbeddingResult.usage?` are the implementation and reporting templates.

**Principal decisions:** three-slice phase C (C1 observability ∥ C2 diagnostics, then C3
emit); a closed three-level vocabulary with provenance; at most **two** breakpoints ever,
so the shared four-cap is unreachable; offsets rather than content blocks at the
`ai-assist` boundary; no `prompt_cache_options` on OpenAI; Gemini explicit `CachedContent`
out of scope with five reasons; thresholds model-keyed or caller-supplied, never constant,
with "unknown" a first-class diagnostic outcome.

**Open questions carried to triage:** OQ-1 (xAI live check — cheap, do first), OQ-2
(second research pass is not a gate), OQ-3 (`prompt_cache_key` in C1 or C3), OQ-4
(Anthropic top-level auto-cache), OQ-5 (is C1 one stream or two).

## C1 checkpoint

**Deliverable, per design.md §8 and §11's C1 row, scoped further by the kickoff brief to
exactly this list — nothing else:**

- `AiCacheReportingLevel` and `IAiCompletionUsage` — new file
  `libraries/ts-extras/src/packlets/ai-assist/usageTypes.ts` (extracted from `model.ts`
  to stay under the 2000-line lint cap; same move `structuredOutputTypes.ts` made).
- `IAiCompletionResponse.usage?: IAiCompletionUsage` and `IAiStreamDone.usage?:
  IAiCompletionUsage` (streaming in scope per OQ-5 — see below).
- Per-adapter normalization filling §8's six-row table, in a new shared module
  `usageNormalization.ts` (one function per wire shape, imported by both the
  non-streaming adapters in `completionClient.ts` and the streaming adapters under
  `streamingAdapters/`, since streaming and non-streaming responses on the same route
  carry the identical JSON usage shape).

**Explicitly NOT in this slice** (per design.md §11's C1/C2/C3 split and the kickoff
brief's narrowing): `IAiCacheCapability`, registry `cache?` entries, and
`minCacheablePrefixTokens` thresholds — §11 lists these under C1 in the surface-summary
table, but they exist to serve §7's threshold diagnostics (C2) and the emit-path
breakpoint cap (C3); nothing in §8's usage-normalization spec needs a capability lookup,
so pulling them in here would be scope the brief explicitly excluded (F2's
`(descriptor, model, usesResponsesApi)` key applies to that lookup, not to which `reports`
value a completion response gets — that is answered per-adapter, and for the one case
where the same code path serves two providers with different answers (OpenAI vs. xAI
Responses), by the field-presence rule below).

**One resolution beyond what design.md §8 states verbatim.** The table lists "OpenAI
Responses" and "xAI Responses" as separate rows with different `reports` values, but both
route through the same `callOpenAiResponsesCompletion` / `callOpenAiResponsesStream`
code — `usesResponsesApi` alone can't tell them apart, and threading a provider
discriminator through would have meant new plumbing outside the stated deliverable.
Resolved instead by **reading the wire**: OpenAI's Responses `usage.input_tokens_details`
has `cache_write_tokens` **required** (research §1.5 — present even at `0`); xAI's never
sends it (confirmed live, design.md §12 OQ-1). So `reports` is derived from whether
`cache_write_tokens` is present in the actual response, not from provider identity — gets
OpenAI and xAI right today. **Round 4 correction (Copilot):** this field-presence read only
runs once a descriptor clears `AiAssist.supportsCacheUsageReporting` (`'openai'`/`'xai-grok'`
only) — the four usage-attaching call sites are shared by every `apiFormat: 'openai'`
descriptor (Groq, Mistral, Ollama, `openai-compat` too), none of which have any
cache-reporting concept, so an unconfirmed descriptor (including a third provider added to
this route later) gets `usage: undefined`, not a guessed answer; extending the gate to a
newly-confirmed provider is a one-line addition to that function.

**R-c held to the letter everywhere**, including one place the design doesn't spell out:
Gemini's `uncachedInputTokens` is computed as `promptTokenCount - cachedContentTokenCount`
**only when `cachedContentTokenCount` is present** — never assumed `0` when the field is
merely absent, even though proto3 JSON commonly omits zero-valued fields (which would have
made "absent → 0" a reasonable-looking shortcut). Applied uniformly: every derived field
in `usageNormalization.ts` requires its inputs to be individually present, or stays
`undefined` itself.

**Streaming, per OQ-5.** Anthropic's usage arrives split across two SSE events —
`message_start` (initial reads/writes) and `message_delta` (final `output_tokens`) — and
is merged. OpenAI Chat Completions streaming is silent about usage by default; the request
now sends `stream_options: { include_usage: true }` (additive, no effect on caching) so the
terminal `choices: []` chunk carries it. OpenAI/xAI Responses reads `response.completed`'s
`response.usage`. Gemini repeats `usageMetadata` on every chunk with running totals; the
adapter keeps the last one.

**The standing assertion (§8) is written but not run live.** Harness:
`libraries/ts-extras/perf/promptCacheObservability.js`, targeting **xAI** (retargeted
from an initial Anthropic version during Copilot round 1 — Anthropic's cache is opt-in
per content block via `cache_control`, which C1 never sends, so a plain `system` string
could never have produced a cache hit there regardless of prefix stability; xAI caches
automatically, already verified live in this stream's design phase, design.md §12/OQ-1),
with the prediction recorded in its header before any run, per `TESTING_GUIDELINES.md`
§ "Measurement Harnesses". This session had no `XAI_API_KEY` and no outbound path to
`api.x.ai` (the sandbox proxies HTTPS through an allowlist), so the harness's wiring was
verified (descriptor resolution, syntax, guard-on-missing-key) but the live prediction
was not evaluated. **Running it against a real key is the first thing to do before
treating C1 as fully validated** — everything else (types, normalization, adapter
wiring, tests, gates) is done and green, but this is the one piece that checks the
design's actual claim rather
than the code's internal consistency.

**Gates run and green:** `rushx build`/`lint`/`test` in `@fgv/ts-extras` (2836/2836 tests as
of round 5's regression-test additions — 2829/2829 at the original open, growing with each
Copilot round's fixes; see the round-by-round log below for the count at each point),
100% statements/branches/functions/lines, `rushx fixlint` (no changes needed),
repo-wide `rush rebuild` (36/36 packages, zero warnings). Repo-wide `rush test` — required
because C1 widens what `IAiCompletionResponse`/`IAiStreamDone` *carry* with no signature
moved (`CODING_STANDARDS.md`'s "a rebuild cannot see this class" rule) — was run; see the
PR/commit for its result.

**Docs:** `libraries/ts-extras/CAPABILITIES.md`'s `ai-assist` entry and
`.ai/instructions/LIBRARY_CAPABILITIES.md`'s decision-shortcuts both updated in this same
change (`verify-capability-docs.mjs` passing). `docs/WORKSTREAMS.md`'s entry for this
stream updated to record C1 shipped; the stream itself stays open (C2/C3 remain), so no
`finalize-task` migration to `completed/` — artifacts stay in `active/` per the kickoff
brief.

**code-reviewer / Copilot loop:** `code-reviewer` run on the diff before opening the PR —
one P2 (an unreachable `'none'` member on `AiCacheReportingLevel` with no producer;
`IAiCompletionResponse.usage === undefined` already is the "nothing reported" signal),
fixed, and one P3 (a cosmetic object-shape inconsistency between normalizers), dispositioned
as not worth touching. [PR #668](https://github.com/ErikFortune/fgv/pull/668) opened
against `claude/ai-assist-prompt-caching`.

**Copilot round 1 — substantive, not nitpicks.** A real bug: once
`stream_options.include_usage` is set, OpenAI Chat Completions sends literal `usage: null`
on every intermediate SSE chunk (only the terminal chunk carries the populated object).
The chunk validator required `usage` to be a `JsonObject` when present, so every
intermediate chunk failed validation and was dropped **whole** — losing `delta.content`
and `finish_reason` along with it, not just `usage`. This would have broken ordinary
Chat Completions streaming text in production the first time a caller exercised this
path with the flag set; the pre-existing tests never sent `usage: null` so never caught
it. Fixed (mirrors the file's existing `finish_reason` `stringOrNull` pattern) with a
regression test. Also real: the standing-assertion harness targeted Anthropic, whose
cache is opt-in per content block via `cache_control` — C1 sends no cache directive at
all, so the harness could never have produced a cache hit regardless of prefix
stability, a false-miss result that would have validated nothing. Retargeted to xAI,
already verified live to auto-cache with no opt-in (design.md §12/OQ-1), with the
prediction calibrated to those recorded numbers. Two doc-accuracy fixes (a stale ledger
status line, a README sentence describing the shared OpenAI/xAI Responses route as
uniformly write-reporting) and one style cleanup (redundant `optionalFields` alongside
`.optional()` — confirmed by reading `ObjectValidator`'s source that the two are simply
OR'd, so the pair was dead duplication, not a second guard). One suggested change
declined with reasoning posted on the PR: defaulting Anthropic's `cacheWriteTokens` to
`0` would violate R-c (never default a missing usage field to a number) and duplicate
what `reports: 'reads-and-writes'` + absent `cacheWriteTokens` already means per the
design's own contract — the likely cause was `cacheWriteTokens`'s own TSDoc only
spelling out the `'reads'` case, now fixed to state both inline. All fixes pushed in
9ac74080b; full suite re-verified (2829/2829, 100% coverage, clean lint). Round-1
threads replied to and resolved.

**Copilot round 2 — also substantive.** Real: the shared Chat Completions streaming
adapter carries every `apiFormat: 'openai'` descriptor, including arbitrary self-hosted
`openai-compat` servers whose tolerance for an unrecognized `stream_options` field is
unverified — a strict one can reject the whole request rather than ignore the field.
Added `supportsStreamUsageOption(descriptor)` (new `streamUsageCapability.ts`; `model.ts`
was at the max-lines cap again), mirroring the existing `usesMaxCompletionTokensField`
gate — `true` only for `descriptor.id === 'openai'`. Every other provider on this path
now gets exactly the pre-C1 request body; regression test added asserting the field is
absent for a non-OpenAI descriptor. Also real: the README claimed every completion
carries `usage`, but proxied completions never forward it (out of scope for this slice;
the proxy response parser still only returns `content`/`truncated`/`structuredOutput`) —
qualified the claim and stated the limitation, in both the README and `CAPABILITIES.md`.
One doc-accuracy fix: this file's harness section still described the retired Anthropic
version after round 1's retarget to xAI. All fixes pushed in 9b8279892; full suite
re-verified (2830/2830, 100% coverage, clean lint). Round-2 threads replied to and
resolved.

**Copilot round 3 — same bug class as round 1, sibling adapter.** Real: OpenAI/xAI
Responses' `response.completed` payload can carry `response.usage: null` (not just
absent) when a provider has no usage block for that response — the same
JsonObject-only-validator trap as round 1, just on the Responses adapter instead of
Chat Completions. Rejecting the whole payload over that one field silently lost
`status`/`incomplete_details` too, so an incomplete response would have read back as
`truncated: false`. Extracted the null-tolerant validator from `openaiChat.ts` into a
shared `jsonObjectOrNullValidator` in `common.ts` (now used by both adapters, avoiding
a second copy of the same fix) and applied it to `response.usage`; regression test
sends `usage: null` alongside an `incomplete` status and asserts `truncated`/
`incompleteReason` survive it. Checked whether the same null-vs-absent quirk plausibly
applies to Anthropic's `message_start`/`message_delta` usage or Gemini's
`usageMetadata` — no evidence either way (both APIs consistently report populated
usage objects, and proto3 JSON omits absent fields rather than nulling them), so left
untouched rather than adding unconfirmed defensive code. All fixes pushed in
cd3677031; full suite re-verified (2831/2831, 100% coverage, clean lint). Round-3
thread replied to and resolved; round 4 requested — three consecutive substantive
rounds, still short of the 10-round cap, continuing per "round count is not the
signal."

**Copilot round 4 — real design gap, not just a wire quirk.** All four usage-attaching
call sites (`callOpenAiCompletion`, `callOpenAiResponsesCompletion`, and their streaming
counterparts) are shared by every `apiFormat: 'openai'` descriptor — Groq, Mistral,
Ollama, and self-hosted `openai-compat`, not just OpenAI and xAI Grok — but only the
latter two are confirmed to report cache-relevant `usage` fields. An ordinary usage
block from one of the others (e.g. Groq's plain `prompt_tokens`/`completion_tokens`,
with no cache sub-object at all) was being normalized anyway, stamping `reports: 'reads'`
on a provider with no prompt-caching concept — a false cache-reporting signal, exactly
the kind of thing R-c exists to prevent, just one level up (a fabricated capability claim
rather than a fabricated number). Added `supportsCacheUsageReporting(descriptor)` to
`streamUsageCapability.ts` (`true` only for `'openai'`/`'xai-grok'`) and threaded it as a
boolean param into all four call sites, computed at each dispatcher (`completionClient.ts`'s
`callProviderCompletion` switch, `streamingClient.ts`'s `callProviderCompletionStream`
switch) where the descriptor is in scope — the per-format functions themselves take
`IAiApiConfig`/`IStreamApiConfig`, neither of which carries `descriptor`, so threading a
plain boolean (mirroring the existing `useMaxCompletionTokensField` pattern) was the
correct shape, not a wider config type. The Chat Completions streaming adapter reuses the
existing `includeStreamUsage` flag for this rather than a second param, since it's already
`supportsStreamUsageOption(descriptor)` and a strict subset of the new gate. Four
regression tests added: non-streaming Chat and Responses through the public
`callProviderCompletion` API with a `groq`-id descriptor and a present usage block
(asserting `usage` stays `undefined`), plus streaming siblings for both Chat and Responses
proving an *unprompted* usage chunk from a non-cache-reporting descriptor is still
dropped. All four reach the bug through `AiAssist.callProviderCompletion`/
`callProviderCompletionStream` with real routing (Groq can reach the Responses path
today — nothing currently validates `tools` against `descriptor.supportedTools` before
routing), not synthetic direct calls. All fixes pushed in `d67931a39`; full suite
re-verified (2835/2835, 100% coverage, clean lint, `rushx build` clean including
API Extractor's `etc/ts-extras.api.md` regen for the new `supportsCacheUsageReporting`
export). Round-4 finding was posted as suppressed (non-inline) comments, replied to via a
top-level PR comment; round 5 requested — four consecutive substantive rounds now, still
short of the 10-round cap, continuing per "round count is not the signal."

**Copilot round 5 — round 4's own fix had a gap, plus doc drift from the same change.**
Real: `executeClientToolTurn` calls `callOpenAiResponsesStream` directly
(`clientToolContinuationBuilder.ts`) rather than through `streamingClient.ts`'s
dispatcher, so round 4's new `reportsUsage` param — added with a `false` default —
was silently unset on this call site. Every client-tool stream, openai/xai-grok
included, lost usage regardless of provider, a regression round 4 itself introduced
one call site short of complete. Threaded `supportsCacheUsageReporting(descriptor)`
through; added a regression test in `clientToolTurn.test.ts` pinning that an openai
client-tool turn with `response.completed.usage` present now captures it. Also real:
round 4's gate made two existing doc claims (`README.md`, `CAPABILITIES.md`) false —
both said an unverified future `apiFormat: 'openai'` provider would get usage
reporting "automatically" via field presence, true before round 4's gate landed and
not after. Corrected both to state the gate explicitly, and caught the same stale
claim in this PR's own description while updating it (the description otherwise still
named the retired `ANTHROPIC_API_KEY` harness rationale, also fixed — round 5's one
suppressed finding). All fixes pushed in `7cf03858c`; full suite re-verified
(2836/2836, 100% coverage, clean lint, clean build). Round-5's three inline threads
replied to and resolved individually (all real findings this round, no suppressed
doc-only comments needing a separate top-level reply beyond the harness-citation
note); round 6 requested — five consecutive substantive rounds now, still short of
the 10-round cap. Notably this round caught a bug in the *previous* round's own fix
(an incomplete threading, not a new class of defect) — a useful data point for
"substantive vs. nitpick" judgment: still real, still worth another round.

**Copilot round 6 — pure doc-drift, but drift round 4 itself caused.** Real, though
lower-stakes than rounds 1-5: round 4's provider gate made two earlier passages in
this file (the Phase-C1 resolution note, the "Gates run and green" summary) and one
in `docs/WORKSTREAMS.md`'s ledger entry factually wrong — all three still described
the field-presence-derived `reports` on the Responses route as correct
"automatically" for a future `apiFormat: 'openai'` provider, a claim round 4's own
gate falsified without those earlier passages being revisited. Also caught: both
files' "gates green" headline was still the PR-open snapshot (2829/2829), stale
after round 5's regression-test additions (2836/2836). Corrected all four; this is
the same doc-lag failure mode CODING_STANDARDS.md's "Docs ship with the code"
section names, just intra-PR and self-inflicted rather than cross-stream — a
checkpoint file is itself a doc, and an earlier passage in it needs the same
revisit-on-contradiction discipline as README/CAPABILITIES when a later passage in
the same file changes the ground truth. All fixes pushed in `89898dd0e`; docs-only
change, so gates re-run were `verify-capability-docs.mjs` (still 0 failed) rather
than the full build/test/lint suite (unaffected by a docs-only diff). Round-6's two
threads replied to and resolved; round 7 requested — six consecutive substantive
rounds now, approaching but still short of the 10-round cap. Worth flagging per the
repo's diminishing-returns guidance: round 6 was lower-severity than 1-5 (doc
accuracy, not a runtime defect), which is the kind of signal that should sharpen
scrutiny of round 7 rather than automatically justify round 8.
