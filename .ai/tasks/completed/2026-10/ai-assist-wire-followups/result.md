# Result: `ai-assist-wire-followups`

**Shipped:** an endpoint override can be asserted as the provider's own
(`verifiedEndpoint: { providerId, verified: true }`), `default` is dropped rather than folded, a
client tool the wire cannot carry fails `executeClientToolTurn` at creation with nothing sent, and
Anthropic tools refuse a typeless root schema.

- **Branch:** `ai-assist-wire-followups`, from the brief commits (`1fae52d67`, `383161f2c`).
- **Stacked on** `origin/integration/asks` and `origin/json-schema-pattern` (PR #742, unmerged),
  merged at `c4d4bb1ac`. Both merges were clean.
- **Commits:** `a0b853352` (code, tests, docs, change files) and the close-out commit.
- **PR:** #TBD.

**Before merge, the user re-runs the wire probe live.** This session had no provider keys, so the
probe change is unit-tested over synthetic responses only. Expected live:

- `anthropic-tools/untyped-root` reads `refuse · rejected · agrees · refused here`, and the run no
  longer exits 1 on it;
- the Anthropic-tools summary moves from 1 unsafe to 0.

## What shipped

### `@fgv/ts-extras` (ai-assist)

- **Decision 1: verified endpoint.** The field shape is
  `IAiVerifiedEndpoint { readonly providerId: AiProviderId; readonly verified: true }`, exported as
  `AiAssist.IAiVerifiedEndpoint`. It is a `verifiedEndpoint?` field beside `endpoint` on
  `IProviderCompletionParams`, `IProviderCompletionStreamParams` and
  `IExecuteClientToolTurnParams`, and in the options of `clientToolSchemaKeywords` and
  `structuredOutputSchemaKeywords`.
  - **When it is honoured:** an `endpoint` is set, `verified === true` (checked at runtime), and
    `providerId === descriptor.id`.
  - **Otherwise it is ignored**, and the override stays conservative.
  - **When honoured,** the endpoint is the provider. An `ft:` model still gets the conservative
    table.
  - **One helper,** `schemaWireProviderId`, replaces the three inline
    `endpoint === undefined ? descriptor.id : undefined` expressions. `clientToolWireFormat`
    replaces the inline `apiFormat` switch in `clientToolSchemaKeywords`.
  - Reasoning is in `state.md` § Decision 1.
- **Decision 2: `default` dropped.**
  - `openAiFamilySchemaKeywords.default` is now `'drop'`, and so is
    `unverifiedWireSchemaKeywords.default` in ts-json-base.
  - No shipped table folds `default` any more. Gemini and Anthropic JSON outputs pass it; Anthropic
    tools passes everything.
  - `format` and `examples` still fold, and `title` still drops.
  - The behaviour change is in the `ts-json-base`, `ts-extras` and `ts-extras-ollama` change files.
- **Decision 3: pre-flight.**
  - `executeClientToolTurn` runs `adaptClientToolParameters` over every client tool that survives
    the conflict policy. It uses the wire format from `clientToolWireFormat` and the turn's own
    `IStreamApiConfig` as the target, so the table is the one the adapter would use.
  - On a failure it returns
    `executeClientToolTurn: tool '<name>': <path>: a schema with no 'type' … (<wire>)` before the
    stream IIFE exists. That IIFE starts `fetch`, so nothing is sent.
  - It covers all three client-tool formats. `executeClientToolTurn` is the only public entry point
    that takes client tools.
  - The stream-time check in the three adapters is **kept**, commented as defence in depth. It is
    unreachable through `executeClientToolTurn`, and the adapters are `@internal`.
- **Decision 4: Anthropic tools root.** `anthropicToolsSchemaKeywords.untyped` is now
  `'pass-nested'`, which **refuses** a typeless root. The root is not rewritten to
  `{ type: 'object' }`, because the root's validator (`jsonValue`) accepts non-objects. Reasoning
  is in `state.md` § Decision 4. It applies to client tools and to forced-tool structured output,
  where the root becomes a capability mismatch under `onUnsupported`.

### `@fgv/ts-json-base`

`ISchemaShapeCapabilities.untyped: 'pass' | 'pass-nested' | 'refuse'`. `'pass-nested'` refuses an
untyped node only at `#`, with the existing message. `unverifiedWireSchemaKeywords.default` is
`'drop'`. `foldedKeywordsText` still renders `Default:` for a host table that folds it.

### `@fgv/ts-extras-mcp`, `@fgv/ts-extras-ollama`

- **MCP:** docs only. The `schemaKeywords` TSDoc and `CAPABILITIES.md` now say that a mismatched
  table fails at turn creation, and that `clientToolSchemaKeywords` takes `verifiedEndpoint`.
- **Ollama:** `chatStructured` drops `default` through the unverified table. Its TSDoc and
  `CAPABILITIES.md` are updated.

## Tests (per acceptance item)

- **The `verified` override selects the provider table.**
  - Request path: `schemaKeywords.test.ts` › "an endpoint override is an unverified server, on
    every wire format". This is real `executeClientToolTurn` with the sent body inspected:
    - a verified override passes `minimum` on OpenAI, Anthropic and Gemini;
    - with an `ft:` model it still folds;
    - `verified: false`, `verified: 'true'` and a mismatched `providerId` all fold;
    - an assertion with no `endpoint` changes nothing;
    - `callProviderCompletion` structured output through a verified override passes `minimum`.
  - Lookup functions: `schemaShapes.test.ts` checks the same cases for `clientToolSchemaKeywords`
    and `structuredOutputSchemaKeywords`.
- **`default` dropped, `format`/`examples` still folded, emitted JSON pinned.**
  - `keywordAdaptation.test.ts` (ts-json-base) has a new test: `date-time`, a default and examples
    produce `When. Format: date-time. Examples: [...]` with no `default`.
  - `schemaKeywords.test.ts`: the OpenAI tools and OpenAI-strict expectations no longer carry
    `Default:`, and the Anthropic JSON-outputs pass is unchanged.
  - `chatStructured.test.ts` (Ollama).
- **Pre-flight failure returns a `Result` with nothing sent, per format.** `schemaShapes.test.ts` ›
  "executeClientToolTurn pre-flights every client tool at turn creation":
  - OpenAI, Gemini and Anthropic (through an unverified override) each fail naming tool, path and
    wire, with `fetch` never called;
  - an Anthropic untyped root fails naming `#`;
  - a verified Anthropic override passes pre-flight, and the sent `input_schema` is pinned.
  - `ts-extras-mcp` `shapes.test.ts` › "a table that does not match the wire" now expects the
    creation-time `Failure`.
- **Root refusal.**
  - `shapes.test.ts` (ts-json-base) tests `pass-nested` at the root, in properties and in items.
  - `schemaShapes.test.ts` covers `toAnthropicTools` refusing a root `anyValue()` and passing
    `items: {}`, and forced-tool output refusing a root.
- **Probe.** `wireProbe.test.ts`:
  - `ourVerdict(untyped-root, anthropicTools)` is `refuse`;
  - a new test reproduces the live observation (raw 400 `input_schema.type: Field required`) and
    expects `agrees` with no unsafe row;
  - the all-accepting run now counts `agrees 23 · conservative 1`.

## Fixtures touched

- **Updated deliberately:**
  - `ts-json-base`
    - `keywordAdaptation.test.ts`: the fold-order test uses `examples` in place of `default`.
    - `shapes.test.ts`: the `caps` helper is typed from the rule, and the "pass sends an untyped
      node" expectation now shows `Examples: [1].` with `default` dropped.
  - `ts-extras`
    - `schemaKeywords.test.ts`: four `Default:` pins removed.
    - `schemaShapes.test.ts`: the shape table and the `clientToolSchemaKeywords(anthropic).untyped`
      expectation are now `'pass-nested'`.
  - `ts-extras-ollama`
    - `chatStructured.test.ts`: one `Default: 30.` pin removed.
  - `ts-extras-mcp`
    - `shapes.test.ts`: the mismatched-table case changed from a stream `error` event to a creation
      `Failure`.
  - `samples/testbed`
    - `wireProbe.test.ts`: the all-accepting count, plus a fake that refuses a root `{}` the way the
      library now does.
- **Swept, no change needed:**
  - No other test in the repo pins `Default:` on a wire (`grep -rn "Default: "`; the other hits are
    unrelated `ts-res` / `ts-app-shell` text).
  - No consumer reads `untyped` except `adaptSchemaKeywords`.
  - The probe's `observeAdapted` keys on `cannot be sent`, which the pre-flight message still
    contains.
  - The repo-wide `rush test` passed, so no consumer elsewhere relied on the stream `error` event.

## Gates

Logs are in this session's scratchpad (`awf/`). Every log was graded by grep and checked for NUL
padding (`wc -c` equals `tr -d '\0' | wc -c`).

| gate | result |
|---|---|
| per-package `rushx test` (`ts-json-base`, `ts-extras`, `ts-extras-mcp`, `ts-extras-ollama`, `testbed`) | exit 0; no `not met`; coverage 100% |
| `rushx fixlint` then `rushx lint` (same five) | exit 0; 0 warnings, 0 errors |
| prettier | 2.8.8 through the `rush-prettier` autoinstaller (`rush prettier`, staged files) |
| `etc/*.api.md` `ae-*` | `git diff origin/json-schema-pattern...HEAD -- '*.api.md'` adds or removes **0** `ae-` lines. ts-json-base gains `'pass-nested'`. ts-extras gains `IAiVerifiedEndpoint` and the `verifiedEndpoint` fields. |
| repo-wide `install-run-rush.js rebuild` (on `a0b853352`) | exit 0; `SUCCESS: 38 operations`; error grep 0; `warning` (-i) 1, the symlink notice; 0 `ae-`; no NUL padding (8127 = 8127) |
| repo-wide `install-run-rush.js test` (on `a0b853352`) | exit 0; `SUCCESS: 37 operations` (10m38s, background, awaited); error grep 0; `warning` (-i) 1, the symlink notice; 0 `ae-`; no NUL padding (8284 = 8284); no flake this run |
| `change --verify --target-branch origin/integration/asks` | exit 0 |
| `verify-capability-docs` / `generate-capability-feed --check` | feed regenerated (5 targets updated), then `--check` exit 0; `verify-capability-docs` 0 failed, router 22,866/24,000 characters |

**Environment note.** The disk was full at kickoff: about 25 GB is held by sibling agent worktrees,
which I did not touch. I freed only what this session created. I then installed with
`RUSH_PNPM_STORE_PATH` pointed at an existing worktree's pnpm store, so packages were hard-linked
rather than downloaded again. Nothing in the tree depends on that.

## What the brief got wrong, or left open

1. **"the endpoint config".** No endpoint config object exists. `endpoint` is a bare string on
   each params type. The assertion is a sibling field. Widening `endpoint` would have touched
   eleven entry points that carry no schema.
2. **"treated as that provider".** The table follows `descriptor.apiFormat`. An assertion naming a
   different provider would therefore pick a table for the wrong wire: an Anthropic-format
   descriptor asserted as `openai` gets `anthropic-tools`, unchecked. So `providerId` must equal
   the descriptor's id.
3. **"the streaming entry points that take client tools".** There is only one, `executeClientToolTurn`.
   `callProviderCompletionStream` takes server tools only, and the proxied paths take no client
   tools.
4. **The `{ "type": "object" }` alternative** fails the brief's own test. The root validator
   accepts non-objects, so the emitted type would be tighter than the validator.
5. **Not covered:** the settings record `IAiProviderConfig.endpoint` and `ts-app-shell`'s
   `useAiAssist` are outside this stream's surface. A settings-driven override stays conservative,
   as today.

## Review

No independent `code-reviewer` ran, because the kickoff forbade sub-agents. My own pass found two
problems and fixed both:

- A `{@link AiAssist.IAiVerifiedEndpoint}` would have added `ae-unresolved-link` lines. It is now a
  code span.
- A test drained the stream into an unused variable. It now asserts the stub's error event.

The gate-time independent review is the orchestrator's.
