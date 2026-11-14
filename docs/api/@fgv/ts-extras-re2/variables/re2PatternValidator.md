[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-re2](../README.md) / re2PatternValidator

# Variable: re2PatternValidator

> `const` **re2PatternValidator**: [`JsonSchema.SchemaPatternValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

A `JsonSchema.SchemaPatternValidator` for patterns from an untrusted source — pass it as
`fromJson(json, { patternValidator: re2PatternValidator })` or
`adaptMcpTools(session, { patternValidator: re2PatternValidator })`.

## Remarks

Each pattern is compiled with RE2 (re2js), whose matching is linear in the input, so no pattern
can backtrack catastrophically. The predicate searches, as JSON Schema `pattern` does: `abc`
matches `xxabcxx`, and only `^…$` anchors it.

The source is read as the ECMA-262 `u`-mode pattern the schema states, then rewritten into RE2
syntax with the same meaning. What RE2 cannot express, or would read differently, is refused:
lookahead, lookbehind, backreferences, binary Unicode properties, `Script_Extensions`, non-ASCII
group names and any non-`u` (Annex B) syntax. `.`, `\s` and `\S` are rewritten to ECMA-262's sets,
which differ from RE2's own.

Limits: [DEFAULT\_RE2\_PATTERN\_LIMITS](DEFAULT_RE2_PATTERN_LIMITS.md). A refusal is a `Failure` naming the construct; the
validator and its predicates never throw, and a predicate answers `false` if matching fails.
