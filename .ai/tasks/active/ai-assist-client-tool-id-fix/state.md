# ai-assist-client-tool-id-fix — state

**Library:** `@fgv/ts-extras` (`ai-assist` packlet, active surface)
**Branch:** `claude/client-tool-id-mismatch-leu8do` (off `release`) — PR target `release`
**Type:** bug-fix + hardening + root-cause. No public API surface change (api-extractor report unchanged).

## Symptom (consumer: PersonAIlity)

Anthropic intermittently returns `invalid Prompt - malformed identifier`, **only** on turns
where the model calls a client tool. More tools offered → more frequent. Direct-answer turns
on the same agent/model succeed.

## Root cause

The per-provider continuation builders never enforced that each
`tool_result.tool_use_id` (Anthropic) / `function_call_output.call_id` (OpenAI) is drawn from
the set of assistant `tool_use.id`s actually present in the accumulation buffer. They
independently keyed the id off the tool-result record with
`tool_use_id: r.callId ?? r.toolName`. Two compounding defects make that catastrophic rather
than merely fragile:

1. **Name fallback (`?? r.toolName`).** When `callId` is nullish, the builder emitted the tool
   *name* as the id. A tool name is never a `toolu_*` / `call_*` id, so the provider rejects it
   as a "malformed identifier." (`clientToolContinuationBuilder.ts` Anthropic ~line 151, OpenAI
   ~line 219.)
2. **`??` does not treat empty-string as missing.** An empty id flows straight through as
   `tool_use_id: ''` — also a malformed identifier — with no fallback even firing.

Because the builder *trusted* `callId` blindly and never cross-checked it against the buffered
assistant `tool_use.id`s, **any** upstream loss/divergence of the id surfaced as a malformed
wire body at the provider instead of a loud, field-attributable failure in our code.

### The identified upstream divergence path (anthropic.ts:~333, the silent orphaned-block drop)

`content_block_start` handling buffered a `tool_use` block only when
`block.type === 'tool_use' && block.id && block.name`. A `tool_use` block_start that failed that
guard (missing/empty id or name — provider drift or a truncated stream) fell through **silently**:
no buffer entry, no `client-tool-call-start`, no `logger.warn`. Its subsequent
`input_json_delta` chunks (same SSE index) then hit `if (block?.type === 'tool_use')` at
~line 368 with `block === undefined` and were **silently ignored** too. The block simply vanished.

This is a real silent-corruption path: the model's intended `tool_use` is dropped from the
assistant turn with zero diagnostic. Note it does **not**, by itself, manufacture a
*name-as-id* tool_result (a dropped block emits no `client-tool-call-done`, so no tool-result is
produced for it). The decisive, end-to-end-reproducible divergence that *does* yield a
tool_result whose id is absent from the final assistant turn is **buffer-index reuse**: if two
`tool_use` blocks share an SSE `index` (e.g. an absent/duplicated `index`, which the payload type
already marks optional and defaults to `0`), the later block overwrites the earlier one in the
buffer after the earlier one already emitted its `client-tool-call-done`. The executed result is
then keyed to an id no longer present in the buffer → the builder used to mask this with the name
fallback; it now fails loud. This is captured as an end-to-end test (see below).

**Honest scope note on the live trigger:** within a single, well-formed Anthropic stream the
adapter's own guard means `callId` always equals a buffered id, so the pure single-turn path
can't fire the bug. The bug is reachable when the id correlation is lost upstream (orphaned-block
drop, index reuse, provider drift, or a multi-turn re-feed that loses the id). Rather than pin a
single live trigger speculatively, the fix makes **every** such loss loud and impossible to
mis-key, and adds a field-confirmable diagnostic so the consumer can corroborate on a live
failing turn by capturing the request body.

## Fix

1. **Single source of truth (`clientToolContinuationBuilder.ts`).** Both
   `buildAnthropicContinuation` and `buildOpenAiContinuation` now return
   `Result<IAiClientToolContinuation>`. They build the set of buffered assistant tool_use ids and,
   for each tool result, require `callId` to be non-empty **and** a member of that set; otherwise
   they return a clear `Result.fail` naming the tool and the offending id. `tool_use_id` /
   `call_id` is taken from the verified `callId` — **never** `toolName`. A buffered tool_use block
   with an empty id also fails loud (the assistant side can't carry a malformed id either).
2. **Empty-string = missing.** New `isUsableId(id)` predicate (`id !== undefined && id.length > 0`)
   replaces every `??`-based id check.
3. **No silent drop (`anthropic.ts`).** A `tool_use` `content_block_start` lacking a usable
   id/name now emits a loud `logger.warn` prefixed with the new stable
   `MALFORMED_TOOL_USE_WARN_TAG = 'ai-assist:malformed-tool-use'` (added to `common.ts`, sibling to
   `UNRECOGNIZED_EVENT_WARN_TAG`), and issues no tool call — instead of vanishing.
4. **OpenAI parity.** Same single-source-of-truth correlation on the Responses path; never key
   `function_call_output.call_id` by tool name.
5. **`executeClientToolTurn`** handles the Result-returning builders and fails `nextTurn` loud on a
   bad correlation. The Gemini builder is unchanged (correlates by name by design — no call ids)
   and is wrapped in `succeed()` at the call site.

## Diagnostic added

Both builders, when a `logger` is supplied, log the outgoing continuation's id pairing at
`detail` (debug) level — `ai-assist:anthropic-continuation tool_use.id↔tool_result.tool_use_id [...]`
and the OpenAI analogue. A failing turn is field-confirmable by capturing this line (or the
assembled request body). `executeClientToolTurn` threads its `logger` into the builders.

## Tests (all green; 100% coverage in ts-extras)

`clientToolContinuationBuilder.test.ts`:
- **Divergence repro → now fails loud (not mis-keys):** absent callId, empty-string callId,
  mismatched callId, and empty buffered tool_use id — each `toFailWith(...)` instead of mis-keying
  to the tool name (replaces the two old "uses toolName as fallback" tests).
- **Happy path id-equality:** `tool_use.id === tool_use_id` for single and parallel calls (parallel
  supplied out of order to prove correlation is by id, not position).
- **OpenAI parity:** absent / empty / mismatched call_id all fail loud.
- **Diagnostic logging:** asserts the detail-level pairing line for both builders.
- **End-to-end fail-loud through `executeClientToolTurn`:** buffer-index-reuse SSE makes an
  executed result's id diverge from the final buffered id → `nextTurn` fails loud
  (`/toolu_A.*does not match any buffered/`).

`streamingAdapters.test.ts`:
- **Orphaned-block surfaced, not dropped:** tool_use block_start missing name / missing id →
  `logger.warn` with the `ai-assist:malformed-tool-use` tag, no `client-tool-call-start/done`, empty
  buffer; plus a no-logger variant (covers the `logger?.` undefined branch, no throw).

## Gates

- `rushx build` ✅  `rushx lint` ✅ (clean, after `fixlint`)  `rushx test` ✅ (100% stmts/branches/funcs/lines)
- api-extractor report unchanged (builders are internal-only exports; `executeClientToolTurn`
  signature unchanged) — no regen needed.
- `code-reviewer` agent run on the final diff — findings: _(to be appended)_

## Scope held

Out: the Gemini builder (name-correlation by design), the alias refactor (separate stream). No
behavior change beyond id-correlation + the diagnostic + the loud orphaned-block surface.
