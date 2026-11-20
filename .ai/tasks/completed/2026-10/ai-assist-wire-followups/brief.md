# Brief: `ai-assist-wire-followups`: endpoint `verified`, drop folded `default`, turn-creation pre-flight

This brief is orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** user decisions 3 and 6, 2026-10-18 (followups § "Decisions, 2026-10-18").
**Base:** `integration/asks` **after `json-schema-pattern` merges**, because both touch the wire tables and `keywordAdaptation.ts`. **PR target:** `integration/asks`.

## Decisions

1. **Endpoint override escape hatch.**
   - Today any endpoint override drops the `providerId`, so schema adaptation uses the conservative table on every wire. That covers `completionClient.ts`, `streamingClient.ts` and `clientToolContinuationBuilder.ts`; see `schemaKeywordsFor`.
   - Add an explicit host assertion on the endpoint config, `{ providerId, verified: true }`. Choose the exact field shape and name, and document it in `state.md`. When it is present, the override is treated as that provider (including the `ft:` rule) for keyword-table selection.
   - Absent, behaviour is unchanged (conservative).
   - `clientToolSchemaKeywords` must honour it identically. Use one helper so the two cannot drift; the #736 review flagged duplicate switches.
2. **Stop folding `default`.** On wires that cannot carry it, drop `default` instead of folding `Default: …` into the description: a folded default reads as if the default were applied. Keep folding `format` and `examples`; `title` stays dropped. Update the `'drop'` rule tables and the fold-text tests, and record the behaviour change in the change file.
3. **Pre-flight at turn creation.** A host-written client tool that the target wire cannot carry currently fails as a stream `error` event once the turn runs. `executeClientToolTurn` (and the streaming entry points that take client tools) must instead adapt every client tool's schema for the target wire when the turn is created, and return `fail(...)` naming the tool, the path and the wire. Nothing may be sent. Keep the stream-time check as defence in depth, or remove it if pre-flight makes it unreachable, and say which. Update the `ts-extras-mcp` mismatched-table test (`shapes.test.ts`, "a table that does not match the wire") to expect the creation-time failure.

4. **Fix the probe's one unsafe row.** The `testbed-wire-probe` live run (2026-10-18; see its `result.md` § "Live run") shows Anthropic tools accept `{}` nested in properties and in items, but **reject it at the root** (`input_schema.type: Field required`). Today the Anthropic-tools table passes untyped nodes everywhere.
   - Make the root case refuse: the same refusal message family, naming the tool and `#`.
   - A typeless root `{}` is "an object with any properties" for a tool input, so consider instead emitting `{ "type": "object" }` with open properties, but only if that is exactly what the validator accepts. A JSON-Schema `{}` root also accepts non-objects, and tool inputs are always objects, so check whether the validator would loosen or tighten. Decide, and justify in `state.md`; refuse if unsure.
   - The MCP admission check and `clientToolSchemaKeywords` must agree with whatever you choose.
   - Re-run the probe's unit tests and add the row's expected classification. The user re-runs it live.

## Acceptance

- [ ] Tests for each decision: the `verified` override selects the provider table, with and without `ft:`; an unverified override stays conservative; `default` is dropped and `format`/`examples` are still folded, with emitted JSON pinned; pre-flight failure returns a `Result` with nothing sent, for each format that takes client tools.
- [ ] Docs: `ts-extras` and `ts-extras-mcp` `CAPABILITIES.md`; the endpoint-config TSDoc.
- [ ] Change files: `minor`; `BREAKING:` for the pre-flight, because the failure moves from an event to a `Result`.
- [ ] Gates: as for `json-schema-options`, including repo-wide `rebuild` and `test`.
- [ ] Close-out: as usual.

## Mechanics

As before. Push only to `ai-assist-wire-followups`. No sub-agents.
