# Brief — `json-schema-fromjson-widening`

**Orchestrator-owned. Frozen at kickoff.** Put questions and disagreements in `state.md`; do not edit
this file.

**Origin:** three PersonAIlity `fgv-ask`s, triaged as class B in
`.ai/tasks/active/personality-asks-2026-10/followups.md` (entries 4, 5 and 6). **Read each inbox file**
under `.ai/tasks/completed/2026-10/personality-intake/findings/inbox/`, not only the issue:

| entry | ask | inbox slug | req. priority |
|---|---|---|---|
| 4 | personaility#680: `anyOf`/`oneOf` `[T, null]` as nullable | `2026-10-01-0043-json-schema-anyof-null-nullable` | P1 |
| 5 | personaility#681: local `$ref`/`$defs` | `2026-10-01-0043-json-schema-local-ref-defs` | P2 |
| 6 | personaility#683: numeric enums, `pattern`, record, `{}` (any) | `2026-10-01-0043-json-schema-smaller-mcp-shapes` | P3 |

Entry 7 (personaility#682, constraint keywords through `toJson()`) is **out of scope**. It needs a
per-provider design and gets its own stream.

**Workflow shape:** `stream`, from `integration/asks`, with its PR onto `integration/asks`. **It
builds on #720** (`json-schema-open-object`, now on `release` and in `integration/asks`). Read that
stream's `result.md` in `.ai/tasks/completed/2026-10/json-schema-open-object/` first: it is the
latest work on this exact packlet, and it records two traps you would otherwise rediscover.

## Mission

Real MCP servers, especially FastAPI/pydantic and zod ones, advertise schemas that
`JsonSchema.fromJson` refuses, so `adaptMcpTools` skips those tools. Widen the accepted subset where
it can be represented **faithfully**: accept a shape only if the converter enforces what the schema
says, and the wire (`toJson()`) says what the converter enforces. **A shape that cannot be honoured
stays refused.** Refusal is the existing, documented safety behaviour, and silently loosening a
schema is the failure this packlet exists to prevent (see the header comment of `FORBIDDEN_KEYWORDS`).

## What the orchestrator believes — verify every line; do not build on it

This is from reading `release` @ `e5a40969`. **Nothing was run.** This orchestrator has been wrong
three times this cycle in claims it labelled verified, including about this packlet. Your job includes
deciding whether these are right.

1. `FORBIDDEN_KEYWORDS` (`fromJson.ts:34-44`) refuses `$ref`, `oneOf`, `anyOf`, `allOf`, `not`,
   `if`/`then`/`else` and `pattern`.
2. Nullability already exists, but only as `type: [T, 'null']`, via `_splitNullableType`
   (`fromJson.ts:163`), plus the nullable-enum form that carries `null` in both `type` and `enum`.
   Entry 4 asks for `anyOf`/`oneOf` of **exactly one supported schema plus `{type:'null'}`**,
   normalized to that existing form. General unions stay out.
3. **Most of entry 6 is a builder extension, not just a `fromJson` acceptance.** The `JsonSchema`
   builder has:
   - no numeric enum (`enumOf<T extends string>`);
   - no `pattern`;
   - no record (schema-valued `additionalProperties`);
   - no "any" node.

   `fromJson` can accept only what the builder can represent. Per `CODING_STANDARDS.md`
   § "Extending core libraries", the builder grows. It is an **established surface, so changes are
   additive only**.
4. **Record has a seam already.** #720's `_convertUndeclaredKeys` validates every undeclared key with
   `jsonValue`, and its docstring names itself as where a schema-valued `additionalProperties` would
   apply its schema. `fromJson.ts:371-373` currently refuses a schema value.
5. **Wire constraints to check before you emit anything new.** `ts-extras`' structured output sends
   the raw `toJson()` to Anthropic's JSON outputs (`anthropic-output-format`). Per
   `structuredOutput.ts:151`, that path requires `additionalProperties: false` where the keyword is
   present. #720 kept the open-object wire unchanged for exactly this reason.
   - A record (`additionalProperties: <schema>`), `pattern`, a numeric `enum`, a `$defs` block or an
     `{}` node may each be refused, or behave differently, on some provider's strict path.
   - **Read `ts-extras/.../ai-assist/structuredOutput.ts` and `toolFormats.ts`** and decide, per
     shape, whether `toJson()` emits it as-is, and whether anything downstream must refuse or adapt
     it. The orchestrator has not checked this.

## The design calls — yours; record each, with what you rejected

- **#680:** whether `oneOf`'s exactly-one semantics differ from `anyOf` for `[T, null]`. The
  orchestrator believes they coincide when `T` excludes `null`; verify it. And what `toJson()` emits
  afterwards: the normalized `type: [T, 'null']`, presumably.
- **#681:**
  - Inline local refs, or preserve `$defs` in `toJson()`? Inlining a recursive model is unbounded.
    The requester asked for "a bound on depth and cycles; remote refs stay rejected".
  - What happens to a recursive schema: refuse it with a clear error, or support it?
  - What does the wire say afterwards?
- **#683, per sub-shape.** The requester said "fgv decides which of these to support", so do not ask
  them. For each of numeric enum, `pattern`, record and `{}`, decide one of:
  - **support**: builder plus `fromJson` plus a faithful wire;
  - **refuse with a better message**;
  - **defer**: record it in `docs/FUTURE.md`, with the reason.

  Faithful means `pattern` is enforced by the converter, not merely carried. Think about ReDoS when a
  server supplies the regex (it is untrusted input). The repo's `no-unsafe-regexp` lint rule is
  relevant to source, not to runtime-supplied patterns.

## Package surface

- `libraries/ts-json-base/src/packlets/json-schema-builder/`, its tests, `etc/ts-json-base.api.md`
  (additive only) and `CAPABILITIES.md`.
- **Test-only edits** in other packages, where a test pins the old refuse/skip boundary.
  `ts-extras-mcp` has fixtures pinning which tool schemas are skipped (#655 broke one this way). Update
  only the assertion the widening changes, and list each one in `result.md`.
- `ts-extras` ai-assist **source** only if belief 5 shows a newly accepted shape would break a
  provider path. In that case, **stop and surface** before changing it.
- `common/changes/@fgv/<pkg>/*.json` for every package touched, typed per `ACTIVE_DEVELOPMENT.md`.
  `json-schema-builder` has never shipped on `main`, so a breaking change is `minor` with a
  `BREAKING:` prefix.
- `docs/FUTURE.md` for anything deferred. Update the "additively widen `fromJson`" headline entry to
  reflect what shipped.

## Out of scope

- Entry 7 (#682, constraint keywords).
- General unions (`anyOf` of two non-null types). The requester said explicitly that skipping these is
  right.
- Remote `$ref`.
- `.ai/tasks/active/personality-asks-2026-10/followups.md`: the orchestrator owns it; do not edit.
- **Concurrent stream:** `mcp-client-cancellation` runs at the same time in `ts-extras-mcp` source and
  tests, and in `ts-extras` ai-assist `toolTypes.ts` and `clientToolContinuationBuilder.ts`. Do not
  edit those source files. If you both touch the same `ts-extras-mcp` test file, whichever lands
  second merges.

## Acceptance criteria

- [ ] Each numbered belief has a verdict, and each design call is recorded with its rejected
      alternatives.
- [ ] **Load-bearing:** every newly accepted shape is honoured. For each one there is a test that:
      - a value the source schema rejects is rejected by the converter;
      - a value it accepts converts;
      - `toJson()` round-trips through `fromJson` to an equivalent validator.
- [ ] **Load-bearing:** every shape still refused is refused with a message naming the keyword and its
      JSON Pointer path. Nothing is silently dropped.
- [ ] **Load-bearing:** each requester example converts as they expect. Put the pydantic and zod
      shapes from the inbox files in tests verbatim.
- [ ] A revert matrix in `result.md`: each protection reverted on its own, and the named test going
      red. Choose fixtures where the right and wrong answers differ.
- [ ] `rushx build`, `rushx lint` and `rushx test` (100% coverage) pass with **zero warnings** in
      every touched package.
- [ ] **This widens what a function accepts, so `node common/scripts/install-run-rush.js test`
      repo-wide is the gate, not `rebuild`** (see `CODING_STANDARDS.md` § "`rush rebuild` covers a
      widened *type*. Only a repo-wide `rush test` covers a widened *behaviour*"). Run `rebuild` too
      if any exported type changes.
- [ ] `rushx fixlint` run; `change --verify --target-branch origin/integration/asks` passes.
- [ ] The `code-reviewer` agent run on your diff after the functional tests and before coverage
      closure. Findings dispositioned in `result.md`.
- [ ] `/finalize-task` run: migrate to `.ai/tasks/completed/2026-10/json-schema-fromjson-widening/`,
      write the ledger entry (anticipating the merge; the orchestrator fills in the PR number), and
      make the capability-feed decision.

## Mechanics

- Work on branch `json-schema-fromjson-widening`, created from `integration/asks` with this brief on
  it. Push there. **Do not open a PR.**
- Land the entries as separate commits, in the order #680, #681, #683. If #683 runs long, ship
  #680 and #681 complete, and record #683's undone sub-shapes in `result.md` and `docs/FUTURE.md`.
  That is better than a half-built shape.
- `rush` is not on PATH: use `node common/scripts/install-run-rush.js <cmd>` from the repo root.
  Commit before running long gates, and run every gate in the foreground.
- **Stop and surface**, with a final message of at most 300 words, if:
  - a shape can only be accepted by loosening what the converter enforces;
  - belief 5 shows a provider path that needs a `ts-extras` source change;
  - an established export would have to change incompatibly.

## Exit artifacts

- `state.md`: your working surface.
- `result.md`, covering:
  - what shipped, per entry and per sub-shape;
  - each belief's verdict and each design call;
  - the wire behaviour per new shape, and per provider path checked;
  - the revert matrix;
  - every test in another package that changed, and why;
  - the gate counts;
  - anything this brief got wrong.
