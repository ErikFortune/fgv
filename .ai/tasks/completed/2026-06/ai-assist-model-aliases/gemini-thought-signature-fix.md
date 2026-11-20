# Bug-fix brief: Gemini `thoughtSignature` round-trip on client-tool continuations

**Branch:** `ai-assist-model-aliases` (fold into the existing alias integration branch; PR #508 will carry it — same pattern as the #504 Anthropic fix that rode this branch).
**Package surface:** `@fgv/ts-extras` / `ai-assist` packlet (active-development surface — additive changes, no compat burden).
**You are the worker.** Do not sub-delegate. Make the edits, write the tests, run the gates, push to the branch, prove the work with command output.

## The bug (root-caused)

Surfaced by the live `gemini-client-tools` testbed canary. With thinking enabled, Gemini stamps a `thoughtSignature` on each `functionCall` part and **requires it echoed back** on the model turn of the continuation. We never captured or replayed it, so the continuation turn 400s:

```
AI streaming API returned 400: "Function call is missing a thought_signature in functionCall parts.
This is required for tools to work correctly... function call `default_api:recall_memory`, position 2."
```

`thought_signature` / `thoughtSignature` currently appears nowhere in the codebase — this is a pre-existing latent wire-fidelity gap, not an alias regression. The first turn (resolution + tool call) works; only the continuation replay is broken.

Reference: https://ai.google.dev/gemini-api/docs/thought-signatures — `thoughtSignature` is a **Part-level field, sibling of `functionCall`/`text`** (base64 string). Echo it back on the same part that carries the `functionCall` in the model turn.

## The fix (5 additive points, two files)

### `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/gemini.ts`

1. `IGeminiStreamPart` (~line 67): add `readonly thoughtSignature?: string;` (sibling of `text`/`functionCall`).
2. `geminiStreamPart` validator (~line 105): add `thoughtSignature: Validators.string.optional()` and add `'thoughtSignature'` to `optionalFields`.
3. `IAccumulatedGeminiFunctionCall` (~line 53): add `readonly thoughtSignature?: string;`.
4. Accumulation (~line 170-174): capture `part.thoughtSignature` onto the pushed call, e.g.
   ```ts
   } else if (part.functionCall?.name) {
     const { name, args } = part.functionCall;
     /* c8 ignore next 1 - defensive: Gemini always sends args; {} fallback unreachable in practice */
     const callArgs = args ?? {};
     functionCalls.push({ name, args: callArgs, thoughtSignature: part.thoughtSignature });
     yield { type: 'client-tool-call-done', toolName: name, args: callArgs };
   }
   ```
   (Keep `thoughtSignature` optional — non-thinking calls won't have one.)

### `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts`

5. `buildGeminiContinuation` (~line 343-350): echo it back as a sibling of `functionCall` on the model part, only when present:
   ```ts
   const modelParts: JsonArray = calls.map(
     (call): JsonObject => ({
       functionCall: { name: call.name, args: call.args },
       ...(call.thoughtSignature ? { thoughtSignature: call.thoughtSignature } : {})
     })
   );
   ```
   Update the function's TSDoc to note the signature round-trip. Leave the `functionResponse` user turn unchanged.

## Constraints

- No `any`; Validators (not manual type checks); additive only — no signature changes to exported functions.
- `__`-prefix any unused params (lint mandates it).
- 100% coverage required.

## Tests

- `src/test/unit/ai-assist/streamingAdapters.test.ts` — extend the Gemini stream-translator coverage: a `functionCall` part carrying a `thoughtSignature` accumulates it onto the call; a part without one leaves it `undefined`.
- `src/test/unit/ai-assist/clientToolContinuationBuilder.test.ts` — `buildGeminiContinuation` emits the `thoughtSignature` sibling on the model part when the accumulated call has one, and omits the key entirely when it doesn't (assert the key is absent, not just falsy).

## Sequence (layer-1 discipline)

1. Make the edits + scenario-driven tests (signature present / absent, both files).
2. Run `code-reviewer` on the diff **before** chasing coverage; resolve P1/P2.
3. `rushx build && rushx lint && rushx coverage` in `libraries/ts-extras` — all green, 100%.
4. `rushx fixlint` before the final commit.
5. Commit to `ai-assist-model-aliases`, push (`git push -u origin ai-assist-model-aliases`).

## Proof of work (paste in your final report)

- `git log --oneline -3` showing your commit on the branch.
- The tail of `rushx build`, `rushx lint`, `rushx coverage` (coverage summary table showing 100%).
- The `code-reviewer` findings + dispositions.

## Out of scope

Do NOT touch the alias map, registry, idPattern, or any other adapter (Anthropic/OpenAI). This is the Gemini thoughtSignature round-trip only. The live canary re-run (needs Gemini creds) is the orchestrator's gate, not yours.
