# `json-schema-pattern`: trusted `pattern` on host schemas, injected validator for untrusted ones

**Shipped 2026-10-18** onto `integration/asks` (PR #TBD).
Origin: user decision 1, 2026-10-18 (`personality-asks-2026-10/followups.md`), the last shape from
personaility#683. Builds on `json-schema-options` (#740), `json-schema-constraints` (#734),
`json-schema-shapes` (#736) and `testbed-wire-probe` (#738).

---

## What it is

A JSON Schema is also our validator. Enforcing `pattern` means compiling a regular expression and
running it in-process on model output, and for a server's schema that is a ReDoS vector which a
synchronous `RegExp.test` cannot time out. The stream splits `pattern` by who wrote the schema.

## What shipped

- **Host schemas:** `JsonSchema.stringOptions({ pattern: /^[a-z]+$/u })`. The `RegExp` must have
  exactly the `u` flag. It is enforced with the built-in matcher, emitted as `pattern: <source>`,
  and fails closed if it is re-initialised afterwards.
- **Server schemas:** `JsonSchema.fromJson(raw, { patternValidator })`. Without a validator,
  `pattern` is refused as before, before its value is read. With one, the validator compiles the
  pattern and its predicate enforces it.
- **The library never constructs a `RegExp`.** This is pinned by a test that spies on `RegExp`
  and records zero calls.
- **Wire tables:** `pattern` passes on Anthropic tools, Anthropic JSON outputs and Gemini. It folds
  on the OpenAI/xAI wire, where xAI anchors patterns implicitly, and on unverified wires.
- **MCP:** `adaptMcpTools(session, { patternValidator })`. Without the option, a `pattern` tool is
  still skipped.
- **Probe:** two new fixtures, `pattern-host` and `pattern-fromJson`.

```ts
const slug = JsonSchema.string(JsonSchema.stringOptions({ pattern: /^[a-z0-9-]+$/u }).shouldNotFail('slug'));
const tools = await adaptMcpTools(session, { patternValidator: hostPatternValidator });
```

## What changed shape

- **A `RegExp` only, and only with `u`.** A source string, or a copy recompiled with `u`, would put
  `new RegExp` in the library. JSON Schema specifies `u`, so `/abc/` is refused too.
- **OpenAI documents `pattern`, but its table folds it.** The table is shared with xAI, whose
  implicit anchoring changes the keyword's meaning.

**Next:** a default validator built on RE2, as its own package (`docs/FUTURE.md`). **Before merge,**
the user runs the wire probe live.

See `result.md` for the per-wire citations, the fixtures touched and the gate counts, and
`state.md` for the design reasoning.
