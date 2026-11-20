# `ai-assist-wire-followups`: verified endpoints, dropped defaults, turn-creation pre-flight, the Anthropic-tools root

**Shipped 2026-10-18** onto `integration/asks` (PR #743), stacked on `json-schema-pattern` (#742).
Origin: user decisions 3 and 6, 2026-10-18 (`personality-asks-2026-10/followups.md`), and the
`testbed-wire-probe` live run's one unsafe row. Builds on `json-schema-constraints` (#734),
`json-schema-shapes` (#736), `testbed-wire-probe` (#738), `json-schema-options` (#740) and
`json-schema-pattern` (#742).

---

## What it is

Four follow-ups on how `ai-assist` adapts a JSON Schema for the wire it is sent on:

- who decides which keyword table an endpoint override gets;
- what a wire that cannot carry `default` does with it;
- when a client tool the wire cannot carry is refused;
- what Anthropic tools do with a typeless root schema.

## What shipped

- **Verified endpoint override.** Use
  `verifiedEndpoint: { providerId: descriptor.id, verified: true }` beside `endpoint` on
  `callProviderCompletion`, `callProviderCompletionStream`, `executeClientToolTurn`,
  `clientToolSchemaKeywords` or `structuredOutputSchemaKeywords`. The override is then treated as
  the provider, `ft:` rule included. Without it, an override stays conservative. One internal
  helper, `schemaWireProviderId`, makes the call for every path.
- **`default` is dropped, not folded,** on the OpenAI/xAI table and on every unverified wire. A
  folded `Default: 3.` reads as though the default were applied. `format` and `examples` still
  fold.
- **Pre-flight.** `executeClientToolTurn` adapts every client tool's schema for the target wire
  when the turn is created. A tool the wire cannot carry returns a `Failure` naming the tool, the
  path and the wire, and nothing is sent. Before, it was a stream `error` event.
- **Anthropic tools refuse a typeless root.** The new shape rule is `untyped: 'pass-nested'`. `{}`
  nested is still passed. The root is not rewritten to `{ type: 'object' }`, because the root's
  validator accepts any value.

```ts
AiAssist.executeClientToolTurn({
  descriptor: openai,
  endpoint: 'https://egress.example/v1',
  verifiedEndpoint: { providerId: 'openai', verified: true },
  clientTools,
  ...
}); // Result: Failure up front if any client tool's schema cannot be sent on this wire
```

**Before merge,** the user re-runs the wire probe live. The `anthropic-tools/untyped-root` row
should read `refuse · rejected · agrees · refused here`.

See `result.md` for the fixtures touched and the gate counts, and `state.md` for the design
reasoning (field shape, the untyped-root decision, why the stream-time check stays).
