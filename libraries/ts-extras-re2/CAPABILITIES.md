# `@fgv/ts-extras-re2` — RE2-backed JSON Schema `pattern` validator

> **This file is authoritative for what `@fgv/ts-extras-re2` provides and what not to hand-roll.**
> `README.md` is getting-started material and carries the full dialect table. The always-loaded
> index at [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.

---

[libraries/ts-extras-re2](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-re2)

**The default `patternValidator` for a `pattern` that comes from somewhere you do not control** — an
MCP server's tool schema, a schema loaded at runtime. `JsonSchema.fromJson` and `adaptMcpTools`
refuse `pattern` unless a `JsonSchema.SchemaPatternValidator` is injected; this package is that
validator, built on [re2js](https://www.npmjs.com/package/re2js) (a pure-JS port of RE2). No native
build; re2js runs in Node and browsers, and this package is tested on Node.

| Export | Returns |
|---|---|
| `re2PatternValidator` | a `JsonSchema.SchemaPatternValidator` under `DEFAULT_RE2_PATTERN_LIMITS` |
| `createRe2PatternValidator({ maxSourceLength?, maxProgramSize? })` | `Result<JsonSchema.SchemaPatternValidator>`; a limit that is not a positive integer fails |
| `DEFAULT_RE2_PATTERN_LIMITS` | `{ maxSourceLength: 1024, maxProgramSize: 10000 }` |
| `IRe2PatternValidatorOptions` | the options type |

```ts
JsonSchema.fromJson(json, { patternValidator: re2PatternValidator });
adaptMcpTools(session, { patternValidator: re2PatternValidator });
```

**What it guarantees:**

- **Linear-time matching.** No pattern can backtrack catastrophically: `(a+)+$`, `(.*a){20}` and
  `\d+\d+\d+…` answer on a 100,000-character value. Never hand a server-supplied pattern to
  `new RegExp` — that is the hazard this package exists to close.
- **JSON Schema search semantics.** Unanchored: `abc` matches `xxabcxx`; only `^…$` anchors.
- **ECMA-262 `u`-mode meaning, or refusal.** The source is parsed as the ECMA pattern the wire
  states and rewritten into RE2 syntax that matches the same strings. `.`, `\s` and `\S` are
  rewritten to ECMA's sets (RE2's own differ). What RE2 cannot express or would read differently is
  refused with the construct and its index: lookahead, lookbehind, backreferences, binary Unicode
  properties (`\p{Alphabetic}`), `Script_Extensions`, non-ASCII group names, and all non-`u`
  (Annex B) syntax.
- **Bounded compile cost.** Sources over `maxSourceLength` UTF-16 units are refused before parsing;
  programs over `maxProgramSize` (re2js `programSize()`, ≈ one per matched character) are refused
  after compiling. Matching costs input length × program size.
- **Never throws.** Refusals are `Failure`s; a predicate answers `false` for a non-string or an
  engine error.

**Dialect notes** (detail in the README): `\d`, `\w`, `\b` are ASCII in both dialects, so they agree;
`\p{…}` accepts General_Category values (short or long, lone or `gc=`) and `Script=`/`sc=` with a
long script name on a frozen allow-list of scripts both re2js and V8 accept (no aliases such as
`sc=Grek`, no Unicode 17 scripts older ECMA engines reject); property tables are re2js's (Unicode
17), so `\p{…}` membership can differ from an ECMA engine's on some code points — newly assigned
ones, and reclassified ones such as U+0295.
Named groups `(?<name>…)` are accepted with ASCII names only.

**Dependency posture:** `re2js` **direct**, pinned exactly (pure JS, no reason for a consumer to hold
a second opinion; a bump is reviewed against the dialect table). `@fgv/ts-utils` and
`@fgv/ts-json-base` peer.

**Explicitly NOT in scope:** a general RE2 regex API (match, groups, replace — use re2js directly);
RE2-only syntax (`(?i)`, `\Q…\E`, `\z`, POSIX classes) — refused, because the wire carries the source
to engines that read it as ECMA; flags; caching compiled patterns; deciding whether a wire should
carry `pattern` (that is the ai-assist keyword tables).

---

## Decision shortcuts

- **Accepting a JSON Schema `pattern` from an untrusted source?** → `re2PatternValidator`.
- **Need tighter limits for a hostile source?** → `createRe2PatternValidator({ maxSourceLength, maxProgramSize })`.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-10-19** — New @fgv/ts-extras-re2: re2PatternValidator lets fromJson and adaptMcpTools accept an untrusted JSON Schema pattern — linear-time RE2 matching, ECMA-262 meaning or a named refusal.

<!-- END GENERATED: recent-additions -->
