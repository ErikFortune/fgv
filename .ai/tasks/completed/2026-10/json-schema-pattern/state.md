# State: `json-schema-pattern`

Worker-owned. Base: `origin/json-schema-pattern` at `d33b149e7`, merged with `origin/integration/asks`
at `b7986878b` (#740, #739, #738) in `eaf47d8ff`. No conflicts.

## Design decisions

### Trusted path takes a `RegExp`, with exactly the `u` flag, and is never recompiled

The brief left `RegExp` vs source string open. A `RegExp`:

- keeps the invariant absolute: **no `new RegExp` anywhere in the library**. A source string would
  have the library compiling strings on the trusted path, and the only difference between that and
  the untrusted path would be which function you called. Lint agrees: `@rushstack/security/no-unsafe-regexp`
  flags every `new RegExp(<non-constant>)`, and the first draft (which copied the host `RegExp`
  with `new RegExp(source, 'u')`) tripped it twice.
- makes the host compile it and own its cost.

Flags. The wire carries only the source, and JSON Schema patterns are ECMA-262 built with `u`
(2020-12 core § 6.4: "SHOULD be built with the "u" flag"). So the only `RegExp` that means exactly
what the wire states is one with flags `u` and nothing else. `''` is refused too: a non-`u` regex
reads `\p{L}` as the literal `p{L}`, and `.` as one UTF-16 unit. A first draft accepted `''` and
recompiled with `u`; that needed `new RegExp`, so it was replaced by "write `/…/u`".

Holding it. Read `source` and each flag through the **built-in accessors**
(`Reflect.get(RegExp.prototype, 'source', re)`, and `global`/`sticky`/… individually, because the
built-in `flags` getter reads the flag properties through the object, which an own property can
shadow), and match with the **built-in `exec`** captured at module load. A subclass or own property
overriding `source`, `flags`, `test` or `exec` therefore changes neither the wire nor the check (pinned).
Annex B `compile()` re-initialises a `RegExp` in place; the matcher re-reads the form on each call
and fails the value closed if it changed (pinned), so the validator never enforces something the
wire does not state. A `Proxy` around a `RegExp` passes `instanceof` but fails the built-in
accessors and is refused.

### Untrusted path

- `fromJson(json, { patternValidator })`; `jsonSchemaConverter` keeps no options and always refuses.
- `pattern` left `FORBIDDEN_KEYWORDS` and is decided by a **pattern gate** in the context, checked by
  the same forbidden-keyword step before dispatch: the default gate is the refusal, with the
  unchanged message `unsupported JSON Schema keyword 'pattern'`. It is called without reading the
  keyword's value, so `pattern: 5` and `(a+)+$` are refused identically, on any node kind.
  The gate also removed the one defensive branch that would otherwise have needed a `c8 ignore`.
- With a validator: string nodes only. Validator `Failure`, throw, or non-function → schema refused,
  `#/…: pattern "<src>" was refused: <msg>`. Predicate throw or any answer but `true` → value fails.
  `pattern` beside `enum`/`const` refused (as `minLength` is). On a non-string node: neither
  compiled nor emitted (constrains nothing under JSON Schema), matching the existing rule for
  `minimum` on a string.
- `_reshape` (nullable `anyOf`/`oneOf`, `$ref` with annotations) re-parses through `toJson()`, so it
  carries the gate; the validator may be called twice for one node. Documented on
  `SchemaPatternValidator`.
- Node state: `ValidatedStringOptions` holds a second private field, the node options with an
  `IHeldPattern { source, matches(value) → Result<boolean> }` in place of the `RegExp`. Its
  `@internal` statics take inline structural types so no internal type reaches the api report
  (`ae-*` counts unchanged: 2 / 35 / 212).

### Wire tables (`ts-extras` `schemaKeywords.ts`)

| table | `pattern` | basis (fetched 2026-10-18) |
|---|---|---|
| OpenAI-family (`openai`, `xai-grok`, own endpoint) | **fold** | OpenAI lists `pattern`; xAI documents implicit `^`/`$` anchoring, which states a narrower constraint than JSON Schema; one table serves both |
| Anthropic tools | pass | pass-everything table (input_schema is JSON Schema; limits apply to strict only) |
| Anthropic JSON outputs | pass | "Pattern support (regex)": full and partial matching supported; lookaround/backrefs/`\b` not, may 400 |
| Gemini (tools + responseSchema) | pass | Schema field `pattern`: "Pattern of the Type.STRING to restrict a string to a regular expression"; no dialect named |
| unverified / Ollama / ft: / endpoint override | fold | `unverifiedWireSchemaKeywords` |

## Open questions for the orchestrator

1. **Gemini pass with no stated dialect or anchoring.** Per the brief's rule (pass where the docs
   say supported). If Gemini anchors like xAI, the probe will not see it (the probe pattern is
   anchored). Consider an unanchored fixture in a later probe run.
2. **The proxy path.** `callProxiedCompletion` sends `schema.toJson()`; a proxy reconstituting it
   with `fromJson` now refuses a host-written `pattern` unless the proxy injects a validator — and
   from the proxy's side that schema is client input, so refusal is the right default. Not changed.
3. **`ValidatedStringOptions._createWithMatcher`** is `@internal` but callable; like `_create`, it is
   trusted internal surface.
