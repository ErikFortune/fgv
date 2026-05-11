# Stream State: ai-assist-image-generation

**Status:** 🔵 phase A complete — awaiting orchestrator/user signoff before phase B
**Last updated:** 2026-05-11 (phase A agent — design.md complete)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | ✅ complete | `design.md` written; PR open against `claude/ai-assist-features` |
| B — implementation | ⏸ blocked on phase A signoff | Brief to be written by orchestrator post-signoff |

---

## Decisions log

- Working branch: `claude/ai-image-generation-research-gtE2l` (session-designated; branched from `claude/ai-assist-features`)
- PR target: `claude/ai-assist-features`
- Recommendation: **Approach A** (unified type + registry-driven validation). Defends against Approaches B and C in §3.
- Registry shape: `IAiImageModelCapability` gains 7 new optional fields; concrete per-model entries proposed in §4.

**Key research findings:**
- `response_format: 'b64_json'` confirmed as root cause of gpt-image-1 400 bug (§2.4). Fix: conditional on `outputParamStyle: 'output-format'` capability flag.
- dall-e-3 quality is `'hd'` not `'high'`; our current type `'standard' | 'high'` is wrong for both dall-e-3 (`'hd'`) and gpt-image-1 (`'low'|'medium'|'high'|'auto'`).
- `grok-2-image-1212` is **deprecated as of February 28, 2026** (registry is stale). New models: `grok-imagine-image`, `grok-imagine-image-quality`.
- `imagen-3.0-generate-002` is **deprecated; shuts down June 24–30, 2026** (within weeks). Migration to Imagen 4 (`imagen-4.0-generate-001`) is urgent.
- xAI Imagine models use `aspect_ratio` (not `size` pixel strings). Our current code silently ignores the `size` param for xAI — callers have no dimension control.
- `responseModalities: ["IMAGE"]` is **required** in Gemini Flash Image requests but our code doesn't set it — all Gemini Flash Image calls may be producing text-only responses or failing silently. **Highest-priority bug** (worse than the gpt-image-1 400, which at least fails loudly).
- xAI new Imagine models support reference images but via JSON body (not multipart) — incompatible with our current `callOpenAiImagesEdits`. Blocked until a dedicated adapter is written.
- Gemini Flash Image currently outputs **JPEG only** regardless of request; `outputMimeType` config is not functional per live community reports.

**Excluded from design and why:**
- xAI reference image implementation — wire format (JSON body with `image_url` objects) is different from OpenAI multipart; scoped out to avoid bloating phase B. `acceptsImageReferenceInput: false` blocks the call up front. (§9, Q2)
- `dall-e-2` `/images/variations` endpoint — our reference-image path requires maskless input; dall-e-2's edits need a mask. Blocked via `acceptsImageReferenceInput: false`. Variations endpoint not exposed (no caller need identified).
- Gemini Flash multiple images (`candidateCount > 1`) — SDK bugs reported; `maxCount: 1` for now. (§9, Q10)
- `openai-compat` image generation — no known consumer need; correct to leave without `imageGeneration` entries.
- Audio/video generation — out of scope per brief.

---

## Open questions / blockers

See `design.md` §9. Key questions requiring orchestrator/user input before phase B:

1. **Is Gemini Flash Image already broken?** (`responseModalities` missing) — needs live test call.
2. **xAI reference images in phase B scope?** — currently blocked; defer or include?
3. **gpt-image-1 MIME type threading** — Option A (thread `outputFormat`) vs Option B (static default). Recommend Option A; confirm.
4. **`acceptedQualities: []` semantics** — vs explicit `supportsQualityParam?: boolean` flag.
5. **xAI `usesAspectRatio`** vs new `AiImageApiFormat` value — recommend flag, confirm.
6. **`imagen`/`imagenOptions` rename** — recommend rename + move `aspectRatio` to top-level.
7. **Imagen Ultra `maxCount: 1`** — explicit registry entry or let provider 400?
8. **Consumer quality-field verification** — grep `personaility` and `ts-app-shell` for `quality` usage before accepting zero-cost blast radius.

---

## PR

*(to be opened — `design.md` + `state.md` targeting `claude/ai-assist-features`)*
