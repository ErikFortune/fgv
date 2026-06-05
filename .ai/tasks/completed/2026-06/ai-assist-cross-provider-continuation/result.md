# `ai-assist-cross-provider-continuation` — result

**Completed:** 2026-06-04
**Work branch:** `claude/ai-assist-continuation-impl-ZlQ7C` (forked off the
`per-provider-testbed-scenarios` integration branch)
**Final commit:** `ef761b61`

---

## What shipped

Client-tool continuation wire-forwarding extended from Anthropic-only to **all
four providers**. `executeClientToolTurn`'s `continuationMessages` (the prior
turn's reconstructed assistant turn + tool outputs) now flow through to every
provider's request builder as `rawTail`, so the follow-up request body carries
the reconstructed items. xAI inherits the fix via `apiFormat: 'openai'`.

### Files changed

| File | Change |
|------|--------|
| `chatRequestBuilders.ts` | `buildMessages` (OpenAI/xAI Responses) and `buildGeminiContents` (Gemini) now consume `IBuildMessagesOptions.rawTail`. Added two `@internal` converters: `openAiRawTailItemConverter` (verbatim passthrough with `isJsonObject` guard) and `geminiRawTailMessageConverter` (projects to `{ role: 'user'\|'model', parts: unknown[] }`). `buildMessages` return type widened to `Array<Record<string, unknown>>`; `buildGeminiContents` `parts` widened to `unknown[]`. `IBuildMessagesOptions.rawTail` TSDoc generalized to per-builder behavior. |
| `streamingAdapters/openaiResponses.ts` | `callOpenAiResponsesStream` gains a trailing optional `continuationMessages?: ReadonlyArray<JsonObject>`, threaded to `buildMessages` as `rawTail`. |
| `streamingAdapters/gemini.ts` | `callGeminiStream` gains a trailing optional `continuationMessages?: ReadonlyArray<JsonObject>`, threaded to `buildGeminiContents` as `rawTail`. |
| `streamingAdapters/clientToolContinuationBuilder.ts` | `executeClientToolTurn`'s `openai` and `gemini` switch arms now forward `continuationMessages` (mirroring the `anthropic` arm). `IExecuteClientToolTurnParams.continuationMessages` TSDoc rewritten to per-provider behavior. |
| `test/unit/ai-assist/streamingAdapters.test.ts` | +7 tests: OpenAI request-body shape, OpenAI malformed-skip, Gemini request-body shape, Gemini malformed-skip, xAI inheritance (end-to-end via `executeClientToolTurn`), and two no-options builder tests covering the `options?.rawTail` short-circuit. |

### Verified, not assumed

- **xAI routing:** `registry.ts` `xai-grok` descriptor (line 229) declares
  `apiFormat: 'openai'`, so `executeClientToolTurn`'s `case 'openai'` handles it
  and forwards `continuationMessages` to `callOpenAiResponsesStream`. The xAI
  test drives this end-to-end through `executeClientToolTurn`.
- **Anthropic untouched:** no behavior change to `callAnthropicStream`,
  `buildAnthropicMessages`, or the `anthropic` switch arm. Existing Anthropic
  tests pass unmodified.
- **Public API unchanged:** all new parameters/converters are `@internal`;
  re-running API Extractor produced no diff to `etc/ts-extras.api.md`.

---

## code-reviewer pass (run BEFORE coverage closure, per L37)

Run on the post-implementation / pre-coverage-closure diff. Findings:

| Pri | Finding | Disposition |
|-----|---------|-------------|
| P1 | `continuationMessages` TSDoc described stale Anthropic-only `{ role, content }` projection | **Fixed** — rewritten to per-provider shape handling. |
| P2 | `geminiRawTailMessageConverter` `parts` guard was a type lie (`Array.isArray` asserting `Record<string,unknown>[]`) | **Fixed** — narrowed to sound `unknown[]`; widened `buildGeminiContents` return type to match. |
| P2 | `openAiRawTailItemConverter` is a runtime guard on a typed path | **Kept + documented** — preserves the Anthropic "malformed better omitted than transmitted" posture; continuation messages can round-trip through untyped JSON. Rationale added to TSDoc. |
| P2 | Imperative `toSucceed()` + `isSuccess()` guard in new tests | **Dispositioned** — parallels the established Anthropic continuation test; the post-success step is an async stream consumption that doesn't fit a sync `toSucceedAndSatisfy` callback. Sibling consistency + brief's "parallel the Anthropic pattern" directive. |
| P3 | Pre-existing Anthropic test could adopt the new body-capture helper | **Dispositioned** — left to minimize blast radius (Anthropic is out of this stream's behavior scope). |
| P3 | `buildMessages` TSDoc gap on `rawTail` + return widening | **Fixed** — TSDoc added. |

No new `c8 ignore` directives. The one coverage gap surfaced after the review
(the `options === undefined` short-circuit of `options?.rawTail`) was closed
with a real functional test (no-options builder calls), not a directive.

---

## Gates

- ✅ `rushx build` — PASS (`@fgv/ts-extras`)
- ✅ `rushx lint` — PASS, no warnings
- ✅ `rushx test` — PASS, 100% coverage (all four modified source files at
  100% statements/branches/functions/lines; global gate green)
- ✅ `rushx fixlint` — run before final commit
- ✅ Anthropic regression check — existing Anthropic continuation tests pass unmodified

---

## Branch/PR note

The harness rule for this session is "do not open a PR unless explicitly
asked," so the agent pushed the work branch but did **not** open the PR. When
opened, the PR targets the **`per-provider-testbed-scenarios`** integration
branch (NOT `release`), per the brief. After it merges onto integration, the
paused testbed PR #453 can rebase onto the new integration HEAD and resume —
the scenarios were intentionally left in final form and should light up on the
next live run with no scenario edits.

The Copilot review loop (layer 2) runs once the PR is open.
