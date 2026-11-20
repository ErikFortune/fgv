# Brief: `json-schema-options`: validate constraint options, never throw from a factory

This brief is orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** user decision 6c, 2026-10-18 (`.ai/tasks/active/personality-asks-2026-10/followups.md` § "Decisions, 2026-10-18").
**Base:** `integration/asks` at `b90de8b2b`. **PR target:** `integration/asks`.
**Runs first.** `json-schema-pattern` builds on this stream's validated string options.

## Problem

`JsonSchema` factories (`number`, `integer`, `string`, the enum factories, and anything else that rejects incoherent options) **throw** when options contradict each other, for example `minimum > maximum`, a non-integer member in an integer enum, or `minLength > maxLength`. The repo rule is that fallible operations return `Result`. But schemas nest, so making every factory return `Result` would force an unwrap at every level of every declaration, and almost none of those declarations can fail.

## Decision: validate the options, not the schema

- **Validated option factories.** Add `JsonSchema.numberOptions(opts)` and `JsonSchema.stringOptions(opts)`, plus any other option family whose factory can fail today. Each returns `Result<ValidatedXxxOptions>`, a branded type built on the existing `validateNumberOptions` / `validateStringOptions`. Decide whether the old `validate*Options` names survive; there is no compatibility burden on this surface, so remove them if they become redundant.
- **Constraint-bearing factories accept only validated options.**
  - Plain `ISchemaOptions` (annotations and `nullable`) stays accepted directly, so `JsonSchema.string()` and `JsonSchema.number({ description })` are unchanged.
  - Constraint keys on a raw object literal must be a compile error.
  - Keep the `nullable: true` overloads precise. That works whether `nullable` lives on the validated options or stays a separate argument; pick the shape that keeps inference exact, and say why in `state.md`.
- **Fallible factories that take values, not options** (`integerEnumOf` with a non-integer, duplicate/NaN handling, and so on): sweep every `throw` in `json-schema-builder` and give each one a non-throwing path. Either move the check into a validated-input step on the same pattern, or make that one factory return `Result` if no option object exists to validate. **Factories must contain no `throw`.**
- `fromJson` constructs through the validated path and keeps returning `Result`, with unchanged error messages where possible.
- Declarations in this repo use `.shouldNotFail('<label>')` on the options, e.g. `JsonSchema.integer(JsonSchema.numberOptions({ minimum: 0 }).shouldNotFail('age bounds'))`.

## Consumer sweep (BREAKING, `minor` with `BREAKING:`)

About 32 call sites pass constraint options to `JsonSchema.number` / `integer` / `string` across `libraries/`, `samples/` and `tools/`. Find them with `grep -rnE "JsonSchema\.(number|integer|string)\(\{" --include=*.ts libraries samples tools`, also grep for the enum factories, and update every one. Follow the `monorepo-interface-impact` discipline and list every consumer you touched in `result.md`, including the negative results.

## Acceptance

- [ ] No `throw` in `libraries/ts-json-base/src/packlets/json-schema-builder/**` outside `c8`-free, unreachable code. Prove it with a grep in `result.md`.
- [ ] A raw constraint object passed to a factory fails to compile. Pin this with a `// @ts-expect-error` test.
- [ ] Tests: each validated-options factory on success, on every incoherence it detects (`toFailWith`), and through a factory. Each formerly throwing factory's failure case now returns a `Result` or fails at the options step.
- [ ] Docs: `ts-json-base` `CAPABILITIES.md`, the `json-schema-builder` TSDoc, and any `LIBRARY_CAPABILITIES.md` shortcut that names a changed symbol.
- [ ] Gates:
  - package build, lint and test (100%, zero warnings);
  - `fixlint`;
  - repo-wide `install-run-rush.js rebuild` **and** `test`, because the shared contract changes;
  - `change --verify --target-branch origin/integration/asks`, `verify-capability-docs`, `generate-capability-feed --check`;
  - prettier 2.8 only.
- [ ] Close-out: migrate to `completed/2026-10/json-schema-options/`, with `meta.yaml`, `README.md` and the ledger entry (`#TBD`), then regenerate the feed.

## Out of scope

`pattern`, which belongs to the next stream; wire tables; array and object constraint keywords.

## Mechanics

- Use your own worktree. Push only to `json-schema-options`, and do not open a PR.
- Run `node common/scripts/install-run-rush.js` from the repo root.
- Commit before each long gate. Run gates in the foreground, with per-worktree logs.
- No sub-agents.

**Exit:** `state.md`, and `result.md` (what shipped, the consumer list, gate counts, anything this brief got wrong).
