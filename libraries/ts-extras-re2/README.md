# @fgv/ts-extras-re2

A JSON Schema `pattern` validator for patterns you do not control, built on
[re2js](https://www.npmjs.com/package/re2js), a pure-JavaScript port of
[RE2](https://github.com/google/re2). RE2 matches in time linear in the input, so a pattern from an
MCP server or a runtime-loaded schema cannot stall the event loop on a model-supplied string.

`@fgv/ts-json-base`'s `JsonSchema.fromJson` and `@fgv/ts-extras-mcp`'s `adaptMcpTools` refuse
`pattern` unless a `JsonSchema.SchemaPatternValidator` is injected. This package provides one.

## Usage

```ts
import { JsonSchema } from '@fgv/ts-json-base';
import { adaptMcpTools } from '@fgv/ts-extras-mcp';
import { createRe2PatternValidator, re2PatternValidator } from '@fgv/ts-extras-re2';

const schema = JsonSchema.fromJson(serverSchema, { patternValidator: re2PatternValidator }).orThrow();
schema.validate({ code: 'ABC' });

const adapted = await adaptMcpTools(session, { patternValidator: re2PatternValidator });

// Tighter limits for a source you trust less:
const strict = createRe2PatternValidator({ maxSourceLength: 256, maxProgramSize: 2000 }).orThrow();
```

| export | what it is |
|---|---|
| `re2PatternValidator` | `JsonSchema.SchemaPatternValidator` under `DEFAULT_RE2_PATTERN_LIMITS` |
| `createRe2PatternValidator(options?)` | `Result<JsonSchema.SchemaPatternValidator>` with your limits; fails if a limit is not a positive integer |
| `DEFAULT_RE2_PATTERN_LIMITS` | `{ maxSourceLength: 1024, maxProgramSize: 10000 }` |
| `IRe2PatternValidatorOptions` | `{ maxSourceLength?, maxProgramSize? }` |

A validator returns a `Failure` naming the construct and its index when it refuses a pattern, and a
predicate otherwise. It never throws. The predicate returns `true` only for a match, and `false` for
a non-string or an engine error.

## Semantics

**Search, not full match.** JSON Schema patterns are not implicitly anchored, so `abc` matches
`xxabcxx`. Write `^…$` to anchor. `$` is the end of the value, never before a trailing newline.

**ECMA-262 meaning or refusal.** JSON Schema patterns are ECMA-262 patterns with the `u` flag, and
the schema forwards the source unchanged to providers that read it that way. So the validator parses
the source as ECMA-262 `u` mode and rewrites it into RE2 syntax that matches the same strings. It
passes nothing through on the assumption that the dialects agree. Anything RE2 cannot express, or
would read differently, is refused.

### Dialect table

| construct | ECMA-262 `u` | here |
|---|---|---|
| `.` | any code point except `\n`, `\r`, U+2028, U+2029 | same; rewritten (RE2's `.` excludes only `\n`) |
| `\s` / `\S` | Unicode whitespace + line terminators (NBSP, U+FEFF, `Zs`, …) | same; rewritten (RE2's `\s` is `[\t\n\f\r ]`) |
| `\d` `\w` `\b` `\B` | ASCII (no `i` flag in a schema) | same; RE2's are ASCII too |
| `\p{Lu}`, `\p{Letter}`, `\p{gc=Lu}`, `\p{General_Category=…}` | General_Category | same |
| `\p{Script=Greek}`, `\p{sc=Han}` | Script, long name or 4-letter alias | long names only; `sc=Grek` is refused |
| `\p{Alphabetic}`, `\p{ASCII}`, `\p{Emoji}`, … | binary properties | **refused** |
| `\p{scx=…}`, `\p{Script_Extensions=…}` | Script_Extensions | **refused** (RE2 has none) |
| Unicode property data | the host engine's Unicode version | re2js's tables (Unicode 17); code points assigned later than the host engine's version can differ |
| `(?<name>…)` | named group, Unicode identifier names | ASCII `[A-Za-z_][A-Za-z0-9_]*` only; others **refused** |
| `(?=…)` `(?!…)` `(?<=…)` `(?<!…)` | lookaround | **refused** |
| `\1`, `\k<name>` | backreferences | **refused** |
| `a{n,m}` | any count | counts up to 1000, and RE2 refuses nested repetition whose product exceeds 1000 |
| `😀`, `\u{1F600}`, a lone `\uD83D` | code points; a lone surrogate matches itself | same |
| `[]`, `[^]` | nothing / any code point | same |
| `(?i)`, `\Q…\E`, `\z`, `\A`, `[[:alpha:]]`, `\pL`, `\e`, octal `\01` | syntax errors in `u` mode | **refused**: RE2 would accept them with a meaning the wire's readers do not share |
| lone `{`, `}`, `]`, `\-` outside a class, `\c1` | Annex B only, errors in `u` mode | **refused** |

**Limits.** `maxSourceLength` (UTF-16 code units, default 1024) is checked before parsing.
`maxProgramSize` (default 10,000) is checked after compiling. It is re2js's `programSize()`, roughly
one instruction per matched character: `a{1000}` is about 1000. Matching costs input length ×
program size, so this bounds the per-character cost of every predicate call.

## Dependency posture

`re2js` is a **direct** dependency, pinned to an exact version (2.8.8, MIT, no runtime
dependencies). It is pure JavaScript, so there is no platform binding for a consumer to match and
no reason for them to hold a second opinion about its version. Each bump is reviewed against the
dialect table above, and against the list of non-script property names the rewriter refuses for
`Script=` (`RE2_NON_SCRIPT_NAMES` in `ecmaPattern.ts`), which mirrors re2js's tables.
`@fgv/ts-utils` and `@fgv/ts-json-base` are peers.

This is a Result-integration boundary (see `.ai/conventions/result-integration-boundary.md`), but a
narrow one. It exposes one capability, not re2js's API.

## Not in scope

- A general RE2 regex API (match, groups, split, replace). Use re2js directly.
- RE2-only syntax and flags. These are refused, because the wire carries the source to ECMA readers.
- Caching compiled patterns. Compiling is cheap. `fromJson` compiles a node's pattern once, and
  again only when a nullable union or an annotated `$ref` re-reads the node.
- Deciding whether a provider wire should carry `pattern`. That is decided by the ai-assist keyword
  tables in `@fgv/ts-extras`.
- A browser-specific build. re2js runs in browsers, but this package is tested on Node only.
