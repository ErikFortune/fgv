# State — model-followups

Worker-owned. Brief is frozen; questions and decisions live here.

## Progress

- [x] F1 — OpenAI-format client-tool `'none'` guard (red 5 → green 9/9)
- [x] F2 — luna/sol temperature beside an effort: decided NOT to list luna; OBSERVED rows added
- [ ] 3 — `resolveModel` fails instead of throwing
- [ ] 4 — Groq `max_completion_tokens`
- [ ] 5 — flake hardening (5 tests)
- [ ] 6 — held aliases re-check
- [ ] docs / change files / ledger / meta / result
- [ ] gate

## Decisions

- **D1 (F1)** The guard keys on `descriptor.apiFormat === 'openai'` (the wire that reads
  `openAiEffort ?? xaiEffort`) and on `isThinkingRequiredModel` — no provider id. It therefore also
  refuses `xaiEffort: 'none'` on `grok-4.7` / `-4.6` / `-4.5`, the same 400 by the same rule. An
  Anthropic-format descriptor ignores `openAiEffort` (its adapter never reads it), so it is not
  refused there.
- **D2 (F2)** `gpt-6-luna` stays OFF `samplingParamsRejectedModelPrefixes`. That list is
  effort-blind: listing luna would refuse `temperature: 0.3` with effort `'none'` before the wire,
  which the GPT-6 guide documents as supported ("When reasoning effort is not none, remove
  temperature…") and which the testbed's `base temp=0.3+effort=none` row expects to PASS. The 400
  for 0.3 ("Only the default (1) value is supported") was at the default effort (`medium`), so it is
  evidence about luna *with* reasoning on, not about luna in general. What it suggests — that `1` is
  taken beside an effort — is now an OBSERVED row; if it reads `accepted`, the fix is an
  effort-conditional accepted temperature, which is a new descriptor shape, not this list.
  gpt-6-sol is not a tier model, so no row reaches it; the same reasoning applies.

## Questions

(none)
