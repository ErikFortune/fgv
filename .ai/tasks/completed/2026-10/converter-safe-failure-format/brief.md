# Brief: `converter-safe-failure-format` — failure messages that cannot throw

Orchestrator-owned, frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#714 (fgv-ask), found by personaility#713. A nested `Converters.object` run over a live Node object graph (`c.env` under `@hono/node-server`, where `Socket.parser.socket` is a cycle) failed correctly. The failure message was then built with `JSON.stringify(from)`, which threw `TypeError: Converting circular structure to JSON`. The throw escaped `convert`, bypassed every Result combinator, and caused a production 500.

**Base / PR target:** `integration/asks`.
**Packages:** `@fgv/ts-utils` (conversion, validation, collections) and `@fgv/ts-json-base` (converters, validators, json-schema-builder, json, file-tree messages). Change any other package only if a sweep finds the same pattern on a Converter/Validator failure path. Record each such case.

## Facts (verified on integration/asks)
`JSON.stringify` call counts in non-test sources:
- `ts-utils`: `conversion/basicConverters.ts` 17, `baseConverter.ts` 3, `advancedConverters.ts` 2, `stringConverter.ts` 1, `validation/validators.ts` 3, `field.ts` 2, `genericValidator.ts` 1, `typeGuard.ts` 1, `collections/keyValueConverters.ts` 1, `base/normalize.ts` 5, `hash/hashingNormalizer.ts` 1, `logging/logger.ts` 1.
- `ts-json-base`: about 18 across `converters`, `validators`, `json-schema-builder`, `json/common.ts` and `file-tree`.

Not all of these are failure messages. Hashing and normalization use `stringify` for content and must **not** change. Classify every site and record the classification in `result.md`.

## Decisions
1. **Add one formatter in `ts-utils`, exported publicly because `ts-json-base` and others need it.** Name it after existing conventions, e.g. `formatValueForMessage(value, options?)`, and place it in the most fitting packlet, such as `base`. It must **never throw** and must be pure:
   - Cyclic references render as `"[Circular]"`.
   - `BigInt` renders as `123n`.
   - Symbols, functions and `undefined` render as readable tokens rather than being dropped.
   - Class instances render with their constructor name, e.g. `Socket {…}`.
   - Throwing getters, `toJSON` and Proxy traps are contained: catch the error and render `"[Unreadable]"`.
   - Output is bounded by a maximum length (default about 200 characters, with an ellipsis) and a maximum depth.
   - It does not invoke a user `toJSON` that could have side effects. If you choose otherwise, justify it.
   - For plain JSON-safe values within the length limit, the output must equal `JSON.stringify(value)` exactly, so existing failure-message text and downstream test pins don't change. This is the compatibility contract; prove it with a property-style test over representative JSON values.
2. **Route every failure-message site** in `ts-utils` conversion, validation and collections, and in the equivalent `ts-json-base` packlets, through the formatter. Leave content-producing `stringify` uses (hash, normalize, file contents, logger serialization) alone, unless the logger has the same throw-on-cycle problem on a diagnostics path; in that case record it and fix it the same way.
3. **Defence in depth at the converter boundary.** Converters and validators are the published Result boundary, so `BaseConverter.convert` and the validator base `validate` must never throw for any input. Decide whether to add a `captureResult` guard around the body. Weigh the cost: a guard can mask genuine programmer errors in custom converter callbacks. Record the decision and its reasoning in `state.md`. The formatter fix is required either way.
4. Change files: `minor` for `ts-utils` (new export) and `patch` (or `minor`) for the others. Failure text changes only for inputs that previously threw or rendered as `undefined`; say so in the change file.

## Required evidence
- **Regression tests, red-first:**
  - A cyclic object (including a nested `Converters.object` over an object that contains a cycle, mirroring #713), a `BigInt`, a value with a throwing getter, a Proxy whose `get` throws, a large array and deep nesting.
  - Cover each fixed converter and validator family, and assert a `Failure` with a bounded message.
  - Show them red before the fix.
- **A sweep table in `result.md`:** every `JSON.stringify` site, classified (failure message → fixed; content → unchanged; other → reason).
- **Repo-wide `rush test`.** Failure text is pinned in many downstream tests, and the compatibility contract above is what keeps them green. Any downstream test change must be justified.

## Acceptance
- [ ] Package build, lint and test pass at 100% coverage in each touched package.
- [ ] Repo-wide `rush rebuild` **and** `rush test` pass.
- [ ] `change --verify --target-branch origin/integration/asks` passes.
- [ ] prettier 2.8 and `verify-capability-docs` pass.
- [ ] `ts-utils` `CAPABILITIES.md` documents the formatter, with an index shortcut if it fits the router budget.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-10/converter-safe-failure-format/`, with a ledger entry (`#TBD`) and the feed.

## Mechanics
- Work in your own worktree. Push only to `converter-safe-failure-format`, and open no PR.
- Commit before gating. Run gates in the foreground, except the repo-wide test, which runs in the background and is waited for. No sub-agents.
