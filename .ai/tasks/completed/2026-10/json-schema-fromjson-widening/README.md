# `json-schema-fromjson-widening`: `fromJson` reads pydantic/zod MCP schemas it used to skip

**Shipped 2026-10-04** onto `integration/asks` (PR number filled in by the orchestrator). Origin:
ErikFortune/personaility#680, #681, #683. Builds on `json-schema-open-object` (#720).

---

## What it is

Real MCP servers, especially FastMCP (pydantic) and zod-based ones, advertise schemas that
`JsonSchema.fromJson` refused, so `adaptMcpTools` skipped those tools. This stream widens the accepted
subset only where the converter can enforce what the schema says and `toJson()` can say what the
converter enforces. Anything else stays refused, with the keyword and its JSON Pointer path named.

## What shipped

- **Nullable unions (#680).** An `anyOf`/`oneOf` of exactly one supported schema plus
  `{type:'null'}` (pydantic `Optional[T]`) is normalized to the existing `type: [T,'null']` form.
  A `oneOf` whose branch already admits `null` is refused, because exactly-one would then reject
  `null`.
- **Local `$ref` (#681).** Any `#/…` pointer is resolved by inlining, so `toJson()` emits no
  references. The following are refused:
  - recursive, remote and anchor references;
  - validation keywords beside `$ref`;
  - references under or through a nested `$id`.

  Expansion is bounded at 32 nested refs, 1000 expansions and 100000 nodes. `$dynamicRef` and
  `$recursiveRef`, previously ignored, are now refused.
- **Record (#683).** A new additive `JsonSchema.record(values)` factory. `fromJson` reads a
  schema-valued `additionalProperties` that has no declared properties as a record.
- **Deferred (#683), each recorded in `docs/FUTURE.md`:**
  - numeric `enum`: Gemini allows `enum` only on strings;
  - `pattern`: the regex comes from the server and would run untrusted, risking ReDoS;
  - `{}`: a schema with no `type` is unsendable to Gemini and to OpenAI strict mode.

  Numeric enums and `{}` get clearer refusal messages; `pattern` keeps its existing one.

## What changed shape

- **Two of the four #683 shapes are blocked by providers, not by the converter.** Numeric enums and
  `{}` can be represented, but emitting either would break Gemini requests. Fixing that needs a
  `ts-extras` adapter decision, which the brief reserves for a stop-and-surface. Both are deferred
  rather than stopping the stream.
- **The `code-reviewer` pass found three real P1s, all fixed:**
  - a record could ignore `patternProperties`, `propertyNames` and `unevaluatedProperties`, making
    it looser than its source;
  - a node budget was needed, because the expansion count alone bounds references, not what each
    one inlines (the reviewer estimated about 10M nodes from about 230 KB);
  - `CAPABILITIES.md` was stale.

  The same pass found a pointer-through-`$id` mis-resolution and a pre-existing `__proto__` property
  loss. Both now refuse.
- **Record is accepted even though Gemini and Ollama strip its value schema.** The distinction from
  the numeric-enum and `{}` deferrals is what happens to the request: those providers would reject
  it outright. Here the request succeeds, the model is less guided, and a wrong value becomes a tool
  error the model can correct, because `executeClientToolTurn` still validates the full schema.
- **Gate review added a 128-level depth bound.** A 2000-deep `items` chain exhausted the stack, which
  the node budget did not prevent. The root also gained a `captureResult` backstop, and pointer
  decoding now follows RFC 6901 § 6 (decode, then split).
- **The brief's wire citation (belief 5) was wrong.** `structuredOutput.ts:151` is a comment, not a
  check.

## Where to read more

- `result.md`: belief verdicts, design calls with rejected alternatives, the wire table, the
  44-row revert matrix, the gates.
- `brief.md`, `state.md`: the contract and the working log, archived as written.
