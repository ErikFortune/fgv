# luna-temperature-with-effort — accept the default temperature beside an effort on gpt-6-luna

**Base**: `origin/integration/asks` @ `c8a84c9d2` (includes #775). **Branch**: `luna-temperature-with-effort`.
**Worktree**: `/home/user/fgv-luna`. **Owner of this file**: orchestrator (frozen).

## Evidence (user's keyed run on integration/asks, 2026-11-11, `openai-model-tiers`)
- `[PASS] base temp=0.3+effort=none gpt-6-luna` — any temperature is accepted with thinking off.
- `[EXPECTED-REJECT] base temp=0.3 gpt-6-luna` (default effort medium) — 400 "Unsupported value:
  'temperature' does not support 0.3 with this model. Only the default (1) value is supported."
- `[OBSERVED] base temp=1+effort=low raw gpt-6-luna (accepted)`.
- `[OBSERVED] base temp=0.3+effort=low raw gpt-6-luna (rejected: …Only the default (1) value is supported.)`

So on luna the restriction holds **only while reasoning is on**, and the accepted value there is 1.
Today ai-assist refuses *any* temperature beside an effort on luna (`checkTemperatureConflict`, because
luna is not on `samplingParamsRejectedModelPrefixes`) — `temperature: 1` with an effort is a false
refusal. Listing luna on `samplingParamsRejectedModelPrefixes` is wrong: that list applies with
thinking off too and would refuse the documented, live-verified `0.3` + `'none'`.

## Decision
Add a declared, per-model rule for "sampling restricted only while thinking": e.g.
`samplingParamsRejectedWithThinkingModelPrefixes` on `IAiProviderDescriptor` (name it to match the
sibling fields), reusing `samplingParamsAcceptedTemperature` as the accepted value. Semantics:
- thinking off (effort `'none'`, or no effort on a model whose default is off): any temperature, as today;
- thinking on (any non-`'none'` effort, or the model's default when it thinks by default — luna defaults
  to `medium`): temperature must equal the accepted value; any other value is refused locally with the
  same message family as `checkSamplingParams` ("… does not accept a non-default temperature (x) while
  reasoning: remove temperature, send 1, or set effort 'none'").
- `temperatureAcceptedWithThinking` returns the accepted value for these models too, so
  `checkTemperatureConflict` stands aside for `1` exactly as it does for listed models.
Apply to OpenAI `gpt-6-luna` only (the evidence covers luna; do not extend to other ids).
Data-driven: no provider or model `if`s.

Paths: completion, streaming, client-tool (all three run the conflict/sampling checks since #774) —
red→green per path: luna `1`+`low` passes, `0.3`+`low` refused locally, `0.3`+`'none'` passes,
`0.3` with no effort (default medium) refused locally.

Testbed: turn the two `[OBSERVED]` luna rows into stated-outcome rows through the library
(`temp=1+effort=low` PASS, `temp=0.3+effort=low` REFUSED-LOCALLY), plus `temp=0.3` (no effort)
becomes REFUSED-LOCALLY instead of EXPECTED-REJECT. Keep one raw row so the provider's own answer
stays visible if useful.

## Rules
Same as prior streams: repo standards, no `c8 ignore`, no subagents (apply code-reviewer rubric
inline), change file `minor` for ts-extras and `none` for testbed, docs (ai-assist README, ts-extras
CAPABILITIES, TSDoc), close-out via finalize-task to `.ai/tasks/completed/2026-11/luna-temperature-with-effort/`
with ledger entry above `gemini-thinking-level` ("after #775") and `#TBD`. Commit first, then gate from
the worktree (install, change --verify --target-branch origin/integration/asks, rebuild, lint, test —
`rush test` backgrounded and waited for); logs only under the scratchpad `luna/`. Push when clean; no PR.
