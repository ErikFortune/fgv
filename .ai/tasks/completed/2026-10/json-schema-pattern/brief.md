# Brief: `json-schema-pattern`: trusted `pattern` on host schemas, injected validator for untrusted ones

This brief is orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** user decision 1, 2026-10-18 (followups § "Decisions, 2026-10-18"). It is the last remaining shape from personaility#683.
**Base:** `integration/asks` **after `json-schema-options` merges**. **PR target:** `integration/asks`.
**Read first:** the #734 and #736 `result.md` files (the wire tables and the admission model) and the `json-schema-options` `result.md`.

## Why `pattern` is refused today

A JSON Schema is also our validator. Enforcing `pattern` means compiling a regex and running it on model output inside our process. For an **untrusted** schema (an MCP server's), a backtracking JS regex is a ReDoS vector, and a synchronous `RegExp.test` cannot be timed out.

## Decisions

1. **Trusted path (host-written).**
   - `stringOptions({ pattern })` accepts a `RegExp` (or a source string; choose and justify). It is validated at the options step: it must compile, and flags that cannot be expressed on the wire are refused.
   - The derived validator enforces it.
   - `toJson()` emits `pattern: <source>`.
2. **Untrusted path (`fromJson`).**
   - It refuses `pattern` by default, exactly as today, with the same message family.
   - New option: `fromJson(schema, { patternValidator })`, where `patternValidator: (source: string) => Result<(value: string) => boolean>`.
   - When the option is supplied, `pattern` is accepted. A failure from the validator *factory* refuses the schema; the returned predicate enforces the pattern.
   - The emitted `pattern` is the original source string.
   - **The library never constructs a `RegExp` from untrusted input.** Pin this with a test showing that a pathological pattern (e.g. `(a+)+$`) with no validator injected is refused without being compiled.
3. **Wire tables.** Add `pattern` to the #734/#736 keyword tables per wire: pass where provider docs say `pattern` is supported (cite fetched docs in `result.md`, as for #734), and fold elsewhere using the existing `Constraints:` fold text. Folding only loosens the wire; the validator still enforces it. Unverified targets fold. Regex dialect differences go in the TSDoc: the wire receives ECMAScript source.
4. **MCP.** `adaptMcpTools` takes an optional `patternValidator` and passes it to `fromJson`. Without it, a `pattern` tool stays skipped, so `ts-extras-mcp`'s `UNADAPTABLE_TOOLS` example still holds. Add an MCP test that adapts a `pattern` tool with an injected validator. A simple test-only validator built on `RegExp` is fine **in tests**.
5. **RE2 default: out of scope here.** Record it in `docs/FUTURE.md` as the next stream: a separate package, e.g. `ts-extras-re2`, following the `ts-extras-argon2` pattern, which exports a `patternValidator` built on RE2.

## Acceptance

- [ ] **Testbed wire probe** (`testbed-wire-probe`, merged before this stream): add a `pattern` fixture, both trusted (host factory) and untrusted (`fromJson` + injected validator), to the probe's fixture set, and extend the comparison to the new `pattern` table entries. Unit-test the classification as the probe already does. The user runs it live before merge, so say in `result.md` that the live run is theirs.

- [ ] Trusted and untrusted paths, refusals, wire pass/fold per table, and MCP default-skip and injected-adapt, each tested, with emitted JSON pinned.
- [ ] Fixtures that pin "pattern stays refused" are updated deliberately, keeping the default-refusal pins. List them in `result.md`.
- [ ] Docs:
  - `ts-json-base`, `ts-extras` and `ts-extras-mcp` `CAPABILITIES.md`;
  - the `fromJson.ts` header;
  - `docs/FUTURE.md` (pattern shipped; RE2 package next);
  - `TECH_DEBT.md` if an entry names `pattern`.
- [ ] Change files: `minor`.
- [ ] Gates: as for `json-schema-options`, including repo-wide `rebuild` **and** `test` (the accepted set widens).
- [ ] Close-out: migrate to `completed/2026-10/`, with `meta.yaml`, `README`, the ledger entry and the feed.

## Mechanics

As for `json-schema-options`. A `web-fetch` sub-agent is allowed for provider docs; no other sub-agents. Push only to `json-schema-pattern`.

**Exit:** `state.md`, and `result.md` (with the per-wire citations).
