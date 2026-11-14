# Result — ai-assist-tool-continuation

Made `IAiClientToolContinuation.messages` **cumulative** across `executeClientToolTurn` rounds, so the natural consumer pattern — `continuationMessages = outcome.continuation.messages` (replace) — is correct for all N rounds. Kills the multi-round footgun where replace silently dropped earlier tool results and the model looped to the round cap.

- **Seam:** prepend the inbound `continuationMessages` to the per-round built tail at the continuation-assembly point in `executeClientToolTurn`. `toolCallsSummary` stays per-round.
- **Test:** multi-round (N≥3) regression on Anthropic + OpenAI proving cumulative growth (2→4→6). Backward-compatible — single-continuation path unchanged (no existing tests needed updates).
- Shipped to `release` via **PR #488**. Consumer (PersonAIlity) batches adoption (drops their manual `[...prior, ...]` concat → plain replace when they bump the alpha).
