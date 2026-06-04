# `per-provider-testbed-scenarios` — state

**Stream:** `per-provider-testbed-scenarios`
**Integration branch:** `per-provider-testbed-scenarios`
**Status:** commissioned 2026-06-04 — awaiting agent kickoff

---

## Phases

### OpenAI (`openaiClientTools/`)

- [ ] Read provider descriptor, streaming adapter wire shape, model-alias research
- [ ] Draft scenario
- [ ] Register in scenarios index
- [ ] `rushx build` + `rushx test` + `rushx lint` clean
- [ ] Live API verification (if `OPENAI_API_KEY` present) OR document verification gap
- [ ] Checkpoint

### Gemini (`geminiClientTools/`)

- [ ] Read provider descriptor, streaming adapter wire shape, model-alias research
- [ ] Verify server-tool support via `getProviderDescriptor('google-gemini').supportedTools`
- [ ] Draft scenario
- [ ] Register in scenarios index
- [ ] `rushx build` + `rushx test` + `rushx lint` clean
- [ ] Live API verification (if `GEMINI_API_KEY` / equivalent present) OR document verification gap
- [ ] Checkpoint

### xAI (`xaiClientTools/`)

- [ ] Read provider descriptor, streaming adapter wire shape, model-alias research
- [ ] Verify server-tool support via `getProviderDescriptor('xai').supportedTools`
- [ ] Draft scenario
- [ ] Register in scenarios index
- [ ] `rushx build` + `rushx test` + `rushx lint` clean
- [ ] Live API verification (if `XAI_API_KEY` present) OR document verification gap
- [ ] Checkpoint

### Close-out

- [ ] `code-reviewer` agent run on the cumulative diff (BEFORE 100%-coverage closure per L37)
- [ ] Findings resolved or dispositioned
- [ ] `result.md` written with empirical-gate matrix per provider
- [ ] Artifact migration drafted in the close-out PR

---

## Decisions made

(empty — agent records architectural decisions here as they're made)

---

## Follow-up findings filed

(empty — agent files findings in `findings/inbox/<YYYY-MM-DD>-<topic>.md`)
