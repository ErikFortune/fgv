# Result — prompt-assist-horizontal-composition

Horizontal (multi-contributor) prompt-slot composition for `@fgv/ts-prompt-assist` — provenance-ordered, directive-aware merge of N peer contributors into one prompt (the message-role generalization). PersonAIlity consumer request; design accepted **A-Now / B-Committed**.

- **Phase A** — `IResolvedPrompt.slots` (`IResolvedPromptSlot`: `name`/`value`/`directive`/`source`/`wasEnforced`/`winningScope`) — the supported per-slot resolved-value surface (promotes what was buried in `trace.mergedBindings`). **PR #491**.
- **Phase B** — `HorizontalComposer`: `create` (synchronous build-time logical-slot-map validation) + `compose` (directive-aware merge → `applySafeguards` over the **merged whole** → Mustache render → `IComposedPrompt`). Closes the interim safety gap Phase A left for external composers. **Constraints concatenate provenance-ascending first and are never dropped under any strategy.** **PR #492**.
- Promoted to `release` via **PR #490** (squash — design + A + B + this finalization).

**OQ resolutions:** composed descriptor YAML-authored (OQ-2); `ILogicalSlotConfig` code-first (OQ-3); separator `'\n\n'` per-slot overridable (OQ-4); **no cross-slot `{{…}}` refs today (OQ-5)** → B+1 deferred.

**Ratified phase-B impl forks:** `composedBody` param added (`IPromptDescriptor` carries no body — bodies live on candidates); `LogicalSlotStrategy` unprefixed (repo convention); `allowedDirectives` screened at `compose()` (merged directive only known post-merge). *Open for the consumer at adoption:* the composition body template is supplied directly via `composedBody`, not resolved from the composed descriptor's candidates — confirm that matches their YAML authoring model (additive follow-up if they want it resolved/conditional).

**Phase B+1 (topo-sort render-merge-reinject) → `docs/FUTURE.md`** — parked per OQ-5; trigger = the first cross-slot `{{…}}` ref the consumer authors. The shipped RFC-8785 cycle machinery (`buildCycleKey`) is directly reusable; phase-A/B kept the forward-compat guards (declared slot order = tiebreaker, not semantic processing order).
