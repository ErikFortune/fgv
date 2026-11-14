# final-model-fixes — what the first live testbed run showed

**Shipped**: 2026-11-09, PR #769 (targets `integration/asks`).
Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`) and `@fgv/testbed` (private).

## Summary

The user's first keyed run of the #768 canaries passed everywhere except two wires, and showed one
mis-declared:

- **Sonnet 5.5 turns thinking off with `between_tools`.** It rejects `disabled`, so it had been listed
  as thinking-required and `'none'` was degraded to `'low'`. It now has a per-model off value, declared
  as data in the new `IAiProviderDescriptor.anthropicThinkingOffTypes` (read through
  `AiAssist.resolveAnthropicThinkingOffType`), and `'none'` sends `thinking: {type: 'between_tools'}`
  on the completion, streaming and client-tool paths, with no effort beside it. The model does not
  think before responding, but its inter-tool-call notes still come back as thinking blocks.
- **Gemini 3.x Flash cannot be turned off by a budget.** `gemini-3.5-flash-lite` rejects budget 0;
  `gemini-3.8-flash` accepts it and goes on thinking. Both join `thinkingRequiredModelPrefixes`, so
  `'none'` becomes `'low'` (or is refused). Interim until ai-assist sends `thinkingLevel`
  (`docs/FUTURE.md`).
- **OpenAI `temperature: 1` on sol/astra is now a report-only probe.** The canary sends it past the
  library's gate in an `'other'` block and prints `[OBSERVED] accepted` or `rejected: …`. The registry
  is unchanged until a live run answers it.

## What a reader should know

- No live call was made here. `result.md` § 4 is the run sheet for the changed rows.
- The new symbols live in `ai-assist/anthropicThinkingOff.ts` because `model.ts` would otherwise
  have crossed the 2000-line lint limit.
- Each dispatch site's argument is pinned by its own request-body test, verified by reverting each
  site in turn (`state.md` § Red-then-green).

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions D1–D7, follow-ups, parked Q1
- `result.md`: changes, red/green evidence, run sheet and gates
- `meta.yaml`
