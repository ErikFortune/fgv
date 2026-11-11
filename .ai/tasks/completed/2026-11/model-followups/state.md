# State — model-followups

Worker-owned. Brief is frozen; questions and decisions live here.

## Progress

- [x] F1 — OpenAI-format client-tool `'none'` guard (red 5 → green 9/9)
- [x] F2 — luna/sol temperature beside an effort: decided NOT to list luna; OBSERVED rows added
- [x] 3 — `resolveModel` fails instead of throwing (walk moved to `modelSpecResolver.ts`: `model.ts` hit `max-lines`)
- [x] 4 — Groq `max_completion_tokens` (also xAI, documented; Mistral/Ollama not)
- [x] 5 — flake hardening: 4 fixed or confirmed fixed, egress narrowed (no repro)
- [x] 6 — held aliases re-check: both stay held; FUTURE entry for gemini-embedding-2
- [x] docs / change files / ledger / meta / result
- [x] gate (graded clean; testbed coverage gap found and fixed at the gate — result.md § 9)

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

- **D3 (item 3)** `resolveModel` keeps its `string` signature (an external consumer calls it
  directly); a malformed spec resolves to `''` there. `resolveProviderModel`, already a `Result`,
  carries the failure with provider id and path.
- **D4 (item 4)** xAI declared too: its API reference marks `max_tokens` deprecated. Mistral and
  Ollama document only `max_tokens`. docs.ollama.com does not resolve from this session; the same
  page was read from the ollama/ollama repository.
- **D5 (item 5, egress)** Not changed: no reproduction in 37 loaded runs, and the recorded failure
  (a full 15 s timeout) is not a margin a bound would fix. Entry narrowed instead.

## Questions

- Q1 — xAI's `max_completion_tokens` bounds visible output only; whether deprecated `max_tokens` also
  bounded reasoning is undocumented (result.md § 8).

## Review round 1 (independent review of `2f3ffa6dc`) — dispositions

All six applied; details and red/green in result.md § 10.

- **R1.1 (P2)** client-tool path now runs `checkTemperatureConflict` before `checkSamplingParams`;
  the Responses adapter no longer drops a temperature (its `temperatureAcceptedWithThinking`
  argument is removed). Two "adapter safety net" tests now expect the refusal. The result.md § 2
  "current behaviour" claim was wrong for the client-tool path and is corrected there, with "sol"
  disambiguated to `gpt-6-sol` throughout.
- **R1.2 (P3)** `anthropicThinkingDisabled` refusal keyed on `apiFormat === 'anthropic'`.
- **R1.3 (P3)** change file: `BREAKING (implementers only):` prefix, xAI open question.
- **R1.4 (P3)** `AiAssist.`-qualified `{@link}`s; no "does not have an export" warning of this
  stream's remains in `api.md`.
- **R1.5 (P3)** own-property lookups in the spec and in the tier fallback table (the table lookup
  was a second instance of the same defect: `'constructor'` made the walk throw).
- **R1.6 (P3)** comment and ledger wording.
