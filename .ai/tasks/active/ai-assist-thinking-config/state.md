# Stream State: ai-assist-thinking-config

**Status:** 🟢 phase A complete — awaiting signoff
**Last updated:** 2026-05-11 (implementing agent — design.md complete)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | ✅ done | `design.md` complete; PR open against `claude/ai-assist-features` |
| B — implementation | ⏸ blocked on phase A signoff AND on `ai-assist-image-generation` phase B landing | Brief written by orchestrator post-signoff |

---

## Design doc path

`.ai/tasks/active/ai-assist-thinking-config/design.md`

---

## Recommendation summary (one paragraph)

Recommend **Option C (capability-driven optional)**: add a single `IThinkingConfig` interface with an `effort?: 'low' | 'medium' | 'high' | 'max'` field (plus a `tokenBudget?: number` Gemini escape hatch) as an optional field on both `IProviderCompletionParams` and `IProviderCompletionStreamParams`. Each provider adapter translates `effort` to its wire format independently (Anthropic: `thinking: {type: "adaptive"}` + `output_config.effort`; OpenAI/xAI: `reasoning_effort`; Gemini: `thinkingConfig.thinkingBudget`). Temperature is auto-suppressed for Anthropic and OpenAI/xAI when thinking is active, and preserved for Gemini (which accepts it). Thinking content blocks are silently discarded in all response paths — backward compatibility is fully preserved for non-thinking callers. The registry gains `thinkingMode: 'optional' | 'required' | 'unsupported'` on each provider descriptor, and `'thinking'` is added to both `AiModelCapability` and `ModelSpecKey`. The one non-trivial implementation fix is Anthropic's non-streaming non-tools path: the `anthropicResponse` validator breaks when thinking blocks are present; the design recommends routing this path through the existing `extractAnthropicText` helper unconditionally.

---

## Decisions log

- **Recommended approach:** Option C (capability-driven) — single `IThinkingConfig` with `effort` field; provider adapters translate to wire format; registry adds `thinkingMode` per descriptor
- **Sampling params:** Auto-suppress temperature/top_p for Anthropic (4.7+) and OpenAI/xAI (when reasoning active); pass-through for Gemini (provider accepts temperature alongside thinkingConfig)
- **Thinking content in responses:** Silently discarded; `IAiCompletionResponse.content` is always final answer only; thinking-delta streaming events deferred to a future stream
- **ModelSpecKey:** Add `'thinking'` to allow providers with per-variant reasoning capability
- **AiModelCapability:** Add `'thinking'` capability tag for model discovery
- **Anthropic non-streaming fix:** Recommend unconditional use of `extractAnthropicText` for non-tools path

## Research findings (summary)

### Anthropic (as of 2026-05-11)
- Two modes: extended (deprecated on 4.6, rejected on 4.7+) and adaptive (current)
- Effort values: "low" | "medium" | "high" | "max" (max: Opus 4.6 only)
- Temperature: rejected entirely on Opus 4.7+ with adaptive thinking
- Response: thinking blocks (`type: "thinking"`) alongside text blocks; streaming adapter already silently discards them

### OpenAI (as of 2026-05-11)
- Wire: `reasoning_effort` (Chat) or `reasoning.effort` (Responses API)
- Effort values: "none" | "minimal" | "low" | "medium" | "high" | "xhigh" (varies by model)
- Temperature: rejected when reasoning active; allowed when effort="none" on gpt-5.1+

### Google Gemini (as of 2026-05-11)
- Wire: `generationConfig.thinkingConfig.thinkingBudget`; -1=dynamic, 0=disable (Flash only), N=token cap
- Temperature: NOT rejected; lives alongside thinkingConfig in generationConfig
- Models: 2.5 Pro (always thinks), 2.5 Flash (default auto), 2.5 Flash-Lite

### xAI Grok (as of 2026-05-11)
- Wire: `reasoning_effort: "none" | "low" | "medium" | "high"` in Chat Completions
- grok-4.3: supports reasoning_effort; grok-4: always reasons, param rejected
- Temperature: unclear whether rejected (open question)

---

## Open questions / blockers

1. **Q1 (BLOCKING for phase B):** Does xAI reject temperature when reasoning_effort is set? No authoritative source found. Phase B implementer must verify empirically.
2. **Q2:** Anthropic non-streaming fix — unconditional (recommended) or conditional? Awaiting approval.
3. **Q3:** Gemini 2.5 Pro "required" thinking inconsistency at descriptor level — accept or model-level fix? Recommendation: accept.
4. **Q4:** Anthropic "max" effort on 4.7+ — pass through or cap at "high"? Recommendation: pass through.
5. **Q5 (out of scope):** xAI registry stale (grok-4-1-fast retired May 15); orchestrator should decide if fixed in this stream.
6. **Q6:** Should `callProxiedCompletion` / `callProxiedCompletionStream` include thinking in phase B? Recommendation: yes (trivial addition).

## Research dead-ends / surprises

- **Surprise:** Anthropic has moved from `budget_tokens` to an `effort`-based adaptive model — much closer to OpenAI's `reasoning_effort` than expected. The two provider APIs are now structurally similar, which validates the cross-provider abstraction.
- **Surprise:** Gemini does NOT reject temperature alongside thinking — it's the only provider that accepts both. This created an asymmetry in the sampling suppression policy.
- **Dead-end:** WebFetch to docs.anthropic.com and platform.openai.com returned 403 (auth wall). All research was done via WebSearch summarization + cross-referencing multiple secondary sources. Confidence is high but not 100% — phase B should verify specific parameter names against the API reference.

## Excluded from design (and why)

- **Exposing thinking content to callers (`exposeThinkingContent`):** Deferred. Adds a new `IAiStreamEvent` variant and response field; changes the caller contract significantly; billing/UX implications need separate product discussion.
- **Per-model capability records:** Only provider-level `thinkingMode` in the descriptor. Model-level granularity (e.g., distinguishing Gemini Pro from Flash) deferred — would require maintaining a model list that goes stale.
- **Token accounting for thinking tokens:** `IAiCompletionResponse` doesn't gain `thinkingTokens` in this stream. Deferred.
- **xAI registry update (grok-4-1-fast retirement):** Out of scope; flagged for orchestrator.

---

## PR

See PR on `claude/ai-assist-features` ← `claude/ai-assist-thinking-config-xy1J8`
