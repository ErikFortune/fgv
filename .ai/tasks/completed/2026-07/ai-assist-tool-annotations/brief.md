# Brief — `@fgv/ts-extras/ai-assist` + `@fgv/ts-extras-mcp`: client-tool behavior annotations + before-execute gate

> **STATUS: 🟢 ready to commission.** Precursor to the `agent-memory-l2-tools` stream (L2's `memory_write`/`memory_delete` tools consume this for annotations + write-gating). Design fully spiked 2026-07-07 (two read-only spikes over the ai-assist tool surface + the MCP adapter). Consumer: PersonAIlity (mediated agent writes).
>
> **Surface:** `@fgv/ts-extras/ai-assist` + `@fgv/ts-extras-mcp` — both **active** (additive/breaking OK). Additive throughout; no breaking change.
> **Ships under the enforced coverage gate** — 100% real.

## Why this stream exists

The `agent-memory-l2-tools` stream exposes `memory_write`/`memory_delete` as agent-callable `IAiClientTool`s. A consumer with a **mediated-writes** posture (PersonAIlity) needs (a) per-tool **behavior annotations** (readOnly/destructive/idempotent/openWorld) so a host can reason about a tool's side effects, and (b) a **before-execute seam** so a host can gate/deny a destructive call inside the tool-turn loop. Neither exists today, and the annotation home is a shared ai-assist concept (not memory-specific), so it lands here as a precursor rather than inside L2.

## Spike findings (the design rests on these — verified 2026-07-07)

**F1 — Hints are host-advisory-only; they never reach the model.** All three provider wire tool-schemas are strictly `{name, description, parameters}` — no annotation slot:
- OpenAI/xAI Responses: `toolFormats.ts:108-115` (`clientToolToResponsesApi`)
- Anthropic: `toolFormats.ts:171-177` (`clientToolToAnthropic`)
- Gemini: `toolFormats.ts:278-284`

MCP's SDK says the same explicitly (`@modelcontextprotocol/sdk` `types.d.ts:2351-2367`): *"all properties in ToolAnnotations are hints… clients should never make tool-use decisions based on ToolAnnotations received from untrusted servers."* → Annotations are consumed by the **host's tool loop**, never serialized to the LLM. Adding an `annotations` field is invisible to the (field-whitelisting) serializers.

**F2 — MCP `ToolAnnotations` shape** (`types.d.ts` `ToolAnnotationsSchema`, on `Tool.annotations`): five optional fields — `title?: string`, `readOnlyHint?: boolean`, `destructiveHint?: boolean`, `idempotentHint?: boolean`, `openWorldHint?: boolean`. (Note: the display title lives at `annotations.title`, distinct from the separate top-level `Tool.title`.)

**F3 — Canonical home = `IAiClientToolConfig`** (`ai-assist/model.ts:264-276`) — the declarative tool-definition half, reachable as `tool.config.annotations`, parallel to MCP's `Tool.annotations`. Client-tool-only: server tools (`IAiWebSearchToolConfig`, `model.ts:205-244`) are provider-executed and have no host-gating semantics, so do NOT hoist annotations to a shared base.

**F4 — MCP currently DROPS annotations at 3 stacked layers** (real data loss today): local `ISdkToolDescriptor` omits the field (`ts-extras-mcp/sdk.ts:71-75`); `_toDescriptor` doesn't copy it (`operations.ts:41-47`); `IMcpToolDescriptor` has no slot (`model.ts:131-143`); so `_adaptOne` can't propagate it (`adapter.ts:73-100`).

**F5 — `executeClientToolTurn` has NO pre-execute hook.** The full `IAiClientTool` (config incl. annotations) IS in scope at the execute site (`clientToolContinuationBuilder.ts:547-552` builds `toolsByName`; execute at `:683-719` already reads `tool.config.parametersSchema`), but there is no host callback between the `client-tool-call-done` event and `tool.execute(...)`. A gate must be added as a new param on `IExecuteClientToolTurnParams` (`:413-470`).

## Scope (do) — Components 1 + 2 + 3

### Component 1 — annotations data model (`@fgv/ts-extras/ai-assist`)
- Add `IAiToolAnnotations` (all optional, **MCP-native names** for 1:1 passthrough): `title?`, `readOnlyHint?`, `destructiveHint?`, `idempotentHint?`, `openWorldHint?`.
- Add `readonly annotations?: IAiToolAnnotations` to `IAiClientToolConfig` (`model.ts:264`). Export both from `index.ts`. **Additive, non-breaking** — the three serializers whitelist fields, so they ignore it (no serializer change; add a test asserting annotations never appear in any provider's wire tool schema).

### Component 2 — MCP passthrough (`@fgv/ts-extras-mcp`)
Thread MCP `Tool.annotations` → `IAiClientToolConfig.annotations` through the four hops (each stays optional; no behavior change to existing tools):
1. `ISdkToolDescriptor` (`sdk.ts:71`) — declare `readonly annotations?: {...}` so the SDK field survives narrowing.
2. `_toDescriptor` (`operations.ts:41`) — copy it through. **Validate/normalize, do NOT trust raw** (per the untrusted-server warning): run the raw annotations through a Converter/validator that keeps only the five known boolean/string fields and drops anything malformed.
3. `IMcpToolDescriptor` (`model.ts:131`) + a local `IMcpToolAnnotations` interface — add the slot.
4. `_adaptOne` (`adapter.ts:91`) — set `annotations: descriptor.annotations` on the `config` literal.
- A tool with no annotations stays exactly as today (field absent). Add a test: an MCP tool declaring `destructiveHint`/`readOnlyHint` round-trips onto the adapted `IAiClientTool.config.annotations`; a malformed annotations blob is dropped/normalized, not propagated raw.

### Component 3 — before-execute gate hook (`@fgv/ts-extras/ai-assist`)
- Add an optional `onBeforeToolExecute?` callback to `IExecuteClientToolTurnParams` (`clientToolContinuationBuilder.ts:413`):
  `onBeforeToolExecute?(tool: IAiClientTool, args: unknown) => Promise<Result<IToolExecutionDecision>>`
  where `IToolExecutionDecision = { action: 'proceed' } | { action: 'deny'; reason: string }`.
- Invoke it in the execute path (`:683-719`) **after** arg validation, **before** `tool.execute(...)`. The full `tool` (with `.config.annotations`) is passed so host gate logic can key off annotations (e.g. deny a `destructiveHint` call pending confirmation).
- **Deny-semantics (LOCKED):** on `{ action: 'deny', reason }`, do NOT run `execute`; **synthesize a tool-result carrying the reason and continue the turn** — ride the exact same result→`continuation.messages` path a normal/failed execute result already uses (the model sees "that call was denied because <reason>" and can react). Emit a `client-tool-result` event for the denied call so the event stream stays coherent. A callback that itself returns `Result.fail` (or rejects) is caught like `execute` failures and treated as a hard error (not a deny) — `deny` must be explicit.
- `proceed` (or an absent callback) → unchanged behavior.

## Constraints

- No `any`; `Result<T>` for fallible ops; Converters/validators for the MCP annotation normalization (no manual-typeof-then-cast); `__`-prefix unused params. Additive on both active surfaces. Regenerate `etc/ts-extras.api.md` and `etc/ts-extras-mcp.api.md`. **100% coverage enforced.**

## Tests

- **C1:** annotations field present/absent on a client tool; **annotations never appear in any provider wire tool schema** (Anthropic/OpenAI-Responses/Gemini) — the host-advisory-only guarantee.
- **C2:** MCP tool with hints → adapted `config.annotations` (all five fields); tool without annotations → field absent; malformed/partial annotations → normalized (known fields kept, junk dropped), never raw-propagated; the graceful-degradation path (skipped tools) unaffected.
- **C3:** `proceed` → tool runs (unchanged); **`deny` → execute NOT called, a synthesized denial tool-result lands in `continuation.messages`, turn continues, `client-tool-result` event emitted with the reason**; callback `fail`/reject → hard error (not a silent deny); absent callback → unchanged; a host gate that keys off `tool.config.annotations.destructiveHint` denies a destructive tool and proceeds a readOnly one (the end-to-end annotations→gate composition).
- **Testbed:** extend/author a `samples/testbed` client-tools scenario that exercises the deny path (a gate that denies one tool call and proves the continuation stays coherent). STOP-FLAG if a live model turn is needed — build ready, principal runs keyed.

## Sequence

Implement (C1 → C2 → C3) → `code-reviewer` SYNCHRONOUSLY on the diff **before** coverage-chasing → `rushx fixlint`/`lint`/`build`/`test` @100% in both `ts-extras` and `ts-extras-mcp` + api-extractor regen (both `.api.md`) → `rush change --bulk --bump-type minor --target-branch origin/release` (both packages; committed) → PR onto `release`.

## Proof of work

`git log --oneline -3`; build/lint/test tails (100%, both packages); both `.api.md` diffs (new `IAiToolAnnotations` + `annotations?` field + `onBeforeToolExecute` param + `IToolExecutionDecision`; MCP `IMcpToolAnnotations` + descriptor field); the C3 deny-path test output (synthesized tool-result in continuation); the MCP round-trip + malformed-normalization test output; the annotations-never-on-the-wire test; `code-reviewer` findings + dispositions; STOP-FLAG note if the testbed scenario needs a live run.

## Downstream

`agent-memory-l2-tools` consumes this: its five tools populate `config.annotations` (`memory_search`/`memory_context`/`memory_read` → `readOnlyHint: true`; `memory_write` → `destructiveHint: false, idempotentHint: false`; `memory_delete` → `destructiveHint: true, idempotentHint: true`; `openWorldHint: false` throughout — closed store), and a consumer wires `onBeforeToolExecute` to mediate `memory_write`/`memory_delete`. Commission this stream **before** L2.
