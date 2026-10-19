# State: `ai-assist-wire-followups`

Worker-owned. The brief is frozen; decisions and open questions live here.

Branch `ai-assist-wire-followups` at `383161f2c` (brief), merged with `origin/integration/asks` and
then `origin/json-schema-pattern` (PR #742, unmerged) at `c4d4bb1ac`. Both merges were clean.

## Decision 1 — the `verified` field shape

```ts
/** @public — exported as AiAssist.IAiVerifiedEndpoint */
interface IAiVerifiedEndpoint {
  readonly providerId: AiProviderId;
  readonly verified: true;
}
```

A sibling field `verifiedEndpoint?: IAiVerifiedEndpoint` beside `endpoint` on
`IProviderCompletionParams`, `IProviderCompletionStreamParams` and `IExecuteClientToolTurnParams`,
and in the options of `clientToolSchemaKeywords` and `structuredOutputSchemaKeywords`.

Why a sibling and not a widened `endpoint: string | {…}`: `endpoint` is a URL on eleven entry
points (embeddings, images, list-models, the settings record) that never carry a schema. Widening
it would have touched all of them for a concern only the schema paths have.

**Honoured only when all hold**, otherwise ignored, so the conservative table applies, which is
always safe:

- `endpoint` is set. With none, the request already goes to the provider's own endpoint, and the
  assertion changes nothing. This includes an assertion that names another provider.
- `verified === true`, checked at runtime, so a JS caller's `'true'` or `1` does not count.
- `providerId === descriptor.id`.

**Why `providerId` must equal the descriptor's id.** The keyword table is chosen by the wire format,
which comes from `descriptor.apiFormat`, together with the provider id. If the ids could differ, an
Anthropic-format descriptor asserted as `openai` would select `anthropic-tools` in
`schemaKeywordsFor`, whose Anthropic and Gemini branches do not check the id. Requiring equality
means the assertion can only say "this endpoint is the provider this descriptor already names".
That is the use case: a regional host, or a pass-through egress proxy. It also means a stale or
copied setting cannot vouch for a different provider.

A mismatch is ignored, not failed. `clientToolSchemaKeywords` returns a table, not a `Result`, and
the brief requires it to behave exactly like the request path. A loud failure on one path and not
the other would be the drift the single helper exists to prevent.

**One helper.** `schemaWireProviderId(descriptor, endpoint, verifiedEndpoint)` in
`schemaKeywords.ts` is now the only code that decides the trusted provider id. It is called by:

- `completionClient.ts` (structured output);
- `streamingClient.ts`;
- `clientToolContinuationBuilder.ts`;
- `clientToolSchemaKeywords`;
- `structuredOutputSchemaKeywords`.

`clientToolWireFormat(apiFormat)` is the one mapping from `apiFormat` to the client-tool wire. Both
`clientToolSchemaKeywords` and the pre-flight use it. The three inline `endpoint === undefined ?
descriptor.id : undefined` expressions and the inline format switch are gone.

**Not threaded:** the settings record `IAiProviderConfig.endpoint` and `ts-app-shell`'s
`useAiAssist`, which forwards it. Both are outside this stream's package surface. A host using
settings gets the conservative table on an override, which is today's behaviour. Threading it is a
follow-up if a settings consumer asks for it.

## Decision 2 — `default` dropped

- `unverifiedWireSchemaKeywords.default` and `openAiFamilySchemaKeywords.default` change from
  `'fold'` to `'drop'`.
- Gemini and Anthropic JSON outputs already passed `default`. Anthropic tools passes everything.
- So no table folds `default` any more.
- `format` and `examples` still fold. `title` still drops.

`foldedKeywordsText` still renders a `Default:` sentence for a host's own table that folds it, and
`SchemaAnnotationRule` still allows `'fold'` for `default`. I did not narrow the type. The decision
is about what the shipped tables do, and narrowing would be a further implementer break for no
consumer.

## Decision 3 — pre-flight

`executeClientToolTurn` builds its `IStreamApiConfig`, then runs `adaptClientToolParameters` for
every client tool that survived the conflict policy. These are exactly the tools that will be sent.
The pre-flight uses `clientToolWireFormat(descriptor.apiFormat)` with the config as the target, so
the table matches the one the adapter will use. A failure returns
`fail('executeClientToolTurn: tool '<name>': <path>: … (<wire>)')`.

The return happens before the stream IIFE is created. That IIFE starts `fetch` eagerly, so nothing
is sent.

**Entry points covered:** `executeClientToolTurn` only, for all three formats (OpenAI Responses,
Anthropic, Gemini). It is the only public entry point that takes client tools.
`callProviderCompletionStream` takes server tools only, so its formatters cannot fail. The proxied
paths take no client tools.

**Stream-time check: kept, as defence in depth.** The adapters (`callAnthropicStream`,
`callGeminiStream`, `callOpenAiResponsesStream`) still turn a formatter `Failure` into a `Failure`.
Through `executeClientToolTurn` this cannot fire, because the pre-flight ran the same adaptation
with the same target. The adapters are `@internal`, so it is unreachable from the public surface.
Removing it would mean ignoring a `Result` the formatter returns. The direct-adapter tests in
`schemaShapes.test.ts` still cover it, and a comment at each site says why it remains.

## Decision 4 — untyped root on Anthropic tools: **refuse**

The new shape rule is `ISchemaShapeCapabilities.untyped: 'pass' | 'pass-nested' | 'refuse'`.
`'pass-nested'` passes an untyped node beneath the root and refuses one at `#`. The message is the
existing one: `#: a schema with no 'type' (matching any value) cannot be sent on this wire`.
`anthropicToolsSchemaKeywords.untyped` is now `'pass-nested'`.

**Why not emit `{ "type": "object" }`:**

1. **It is not what the validator accepts.** A typeless root is `JsonSchema.anyValue()`, whose
   validator is `jsonValue`: it accepts `1`, `"x"`, `null` and arrays, not only objects. A root
   `type: 'object'` therefore states a narrower schema than the validator enforces. That is the one
   direction the adaptation rules forbid ("a node with no `type` is never given one"). The brief's
   bar was "only if that is exactly what the validator accepts", and it is not.
2. **The tool-input argument does not rescue it.** It is true that a tool input is always an
   object on this wire. But that makes the wire's acceptance set smaller, not the validator's. The
   two would still disagree, and #740 / #742 require them to agree. A host that means "any object"
   can say so with `JsonSchema.record(JsonSchema.anyValue())`, which carries `type: 'object'` and
   whose validator accepts exactly objects.
3. "Refuse if unsure" points the same way.

**Agreement:**

- `clientToolSchemaKeywords(anthropic)` returns this table.
- MCP admission uses whatever table it is given, so it agrees by construction. An MCP
  `inputSchema` is always `type: object`, so the root case cannot arise there anyway.
- Forced-tool structured output uses the same table, so a root `anyValue()` is now a capability
  mismatch under `onUnsupported` (tested).
- The probe reads the table from the library. The row's verdict is now `refuse`, and against the
  observed raw rejection it classifies as `agrees` (a new probe test pins this).

## Gates

See `result.md` § Gates.

## Open questions

None blocking.
