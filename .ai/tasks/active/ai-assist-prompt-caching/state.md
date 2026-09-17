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
OpenAI and xAI right today, and gets a third `apiFormat: 'openai'` provider on this route
right automatically without a registry entry.

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

**Gates run and green:** `rushx build`/`lint`/`test` in `@fgv/ts-extras` (2829/2829 tests,
100% statements/branches/functions/lines), `rushx fixlint` (no changes needed),
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
resolved; round 3 requested.
