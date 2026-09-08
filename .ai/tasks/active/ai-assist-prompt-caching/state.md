# State — `ai-assist-prompt-caching`

**Branch:** `claude/ai-assist-prompt-caching`

| phase | status | artifact |
|---|---|---|
| A — research | ✅ complete (2026-09-07) | `research.md` |
| B — design | ✅ complete (2026-09-08) | `design.md` |
| triage | ⏳ next — `/triage-cycle` | — |
| C — implement | ⛔ not started; scoped by triage | — |

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
