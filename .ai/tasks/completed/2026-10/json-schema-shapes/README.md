# `json-schema-shapes`: numeric enums, enforced `const` and `{}`, adapted or refused per wire

**Shipped 2026-10-17** onto `integration/asks` (PR #TBD).
Origin: ErikFortune/personaility#683, the part #682 left. Builds on `json-schema-constraints` (#734).

---

## What it is

Real MCP servers advertise three shapes `JsonSchema.fromJson` refused or mishandled: a numeric
`enum` (pydantic `Literal[1, 2]`) and `{}` (pydantic `Any`) were refused, so their tools were
skipped; a scalar `const` was accepted and silently dropped, so the validator accepted values the
schema forbade.

## What shipped

- **`numberEnumOf` / `integerEnumOf` / `booleanEnumOf`.** Closed sets compared with `===`, emitted
  as `{ type, enum }`. `fromJson` accepts a numeric or boolean `enum` whose `type` admits it.
- **Scalar `const` is enforced** as the one-value enum of its type and emitted as `enum: [v]`.
  Object, array and `null` values are refused. `BREAKING:` — a value once accepted is now rejected.
- **`anyValue()` and the `'any'` node kind.** Accepts any JSON value and emits `{}`; `fromJson` maps
  `{}` and annotations-only schemas to it.
- **The #682 tables state both shapes.** A numeric enum passes on OpenAI, xAI and both Anthropic
  wires, and folds on Gemini (string-only `enum`) and unverified servers. A schema with no `type`
  passes on Anthropic tools and is refused everywhere else: the tool request fails before anything
  is sent, naming the tool and the path, and structured output treats it under `onUnsupported`.
  Every pass entry is cited from documentation fetched 2026-10-17.
- **MCP end to end:** such a tool is adapted, and an out-of-set call is refused before the server
  sees it. `adaptMcpTools` admits each tool against the target wire's table
  (`schemaKeywords`, from `AiAssist.clientToolSchemaKeywords`), defaulting to the conservative one,
  so a server tool with `{}` is skipped — as before — unless the wire carries it (Anthropic tools).

## What changed shape

- **`adaptSchemaKeywords` and the internal tool formatters return a `Result`**, so a refusal can
  name its path.
- **A boolean `enum` is accepted too**, since the boolean node `const: true` needs is otherwise an
  emitter output `fromJson` would refuse.
- **`pattern` stays refused** (ReDoS), and Gemini's `parametersJsonSchema` route for `{}` is in
  `docs/FUTURE.md`.

See `result.md` for the per-wire table, citations, fixture sweep and gate counts, and `state.md`
for the deviations and open questions.
