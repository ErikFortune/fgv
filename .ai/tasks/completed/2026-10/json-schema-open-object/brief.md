# Brief — `json-schema-open-object`

**Orchestrator-owned. Frozen at kickoff.** Put questions and disagreements in `state.md`; do not edit
this file.

**Origin:** PersonAIlity `fgv-ask` [ErikFortune/personaility#679](https://github.com/ErikFortune/personaility/issues/679).
It is captured at
`.ai/tasks/completed/2026-10/personality-intake/findings/inbox/2026-10-01-0043-json-schema-open-object-drops-keys.md`.
**Read that file, not just the issue.** The requester reworked their own diagnosis once: the cause is
the `JsonSchema.object` factory, not `fromJson`. The file carries the corrected version and the
constraints that matter. The orchestrator's triage is entry 2 of `followups.md` on the
`integration/asks` branch. **Where the triage and this brief disagree, this brief is the correction.**

**Workflow shape:** `stream`, direct to `release`. Housekeeping ships in the same PR.

## Mission

Make what `JsonSchema.object` emits on the wire agree with what it converts, for open objects.

Today an object built with `additionalProperties: true` emits a schema that *omits* the keyword, so a
model reads the object as open (JSON Schema's default). The converter then drops every undeclared key.
A model that fills an open object (pydantic `dict[str, Any]`, zod `z.record`) gets its call reported as
a success, and the tool receives `{}`. `fromJson` maps an **absent** `additionalProperties` to `true`
as well, so most real MCP tool schemas take this path.

## What the orchestrator believes — verify every line; do not build on it

All of this is from reading `release` @ `3515f456`. **Nothing was run.** In the last cycle a brief
premise was overturned in four of six streams, and this orchestrator was already wrong once this cycle
about a barrel export, in a claim it had labelled *verified*. Your job includes deciding whether these
claims are right.

1. **The stripping is deliberate, not an accident.** `factories.ts` says so twice: the class comment
   ("Uses a Converter (not Validator) so that extra properties are stripped from the result") and
   `_buildObjectConverter`'s docstring. `test/unit/json-schema-builder/validate.test.ts:120` pins it:
   `'additionalProperties: true ignores unknown fields'` → `toSucceedWith({ query: 'a' })`. So
   "allow" was designed to mean "tolerate and strip". The orchestrator's earlier triage called the
   option docstring "false in effect"; that overstated it.
2. **The defect is the wire/converter disagreement.** `toJson()` emits `additionalProperties: false`
   only when the option is false (`factories.ts`, the `!this.additionalProperties` spread), and
   otherwise omits it. The emitted schema therefore advertises an open object that the converter
   will not honour.
3. **`ObjectConverter._convert` (`ts-utils/.../objectConverter.ts:225-241`) builds its result from
   declared fields only.** `strict: false` only suppresses the unexpected-key error. **Do not change
   `Converters.object`.** It is an established `ts-utils` surface with many consumers; the fix belongs
   in the `JsonSchema` factory.
4. **`fromJson.ts:413`** maps `additionalProperties !== false` to `true`. That covers an absent value,
   `true`, and a schema-valued `additionalProperties` (verify how the last is treated today).
5. **Typing:** `ObjectStatic<P>` (`types.ts:187`) has no index signature, so carried-through keys have
   no static home. Any pass-through design has to answer this.

## The decision — candidates, NOT a ranking; none checked for feasibility

You choose, record why, and record what you rejected:

- **(a) Pass-through.** Declared fields convert as now; undeclared keys are carried as validated
  `JsonValue`. This is the requester's preferred shape. It changes behaviour pinned by item 1's test,
  and it needs a typing answer (item 5).
- **(b) Close the wire instead.** `toJson()` always emits the keyword truthfully, i.e.
  `additionalProperties: false`, matching what is enforced. The model is then told the truth and
  cannot send keys that would be dropped. But a truly open object (a `dict[str, Any]` with no
  `properties`) becomes uncallable. Check whether that is acceptable against the requester's
  constraint below.
- **(c) Refuse open nodes in `fromJson`.** This is the requester's acceptable fallback, and **it must
  be scoped to open nodes only**: an object with no `properties`, or one with `additionalProperties`
  `true` or schema-valued. Their words: "Refusing every object whose `additionalProperties` is absent
  would rule out nearly every MCP tool schema."
- **(d) A combination**, e.g. (a) for the factory plus emitting the keyword truthfully, or a distinct
  factory option.

Requester constraints (quoted in the inbox file), which a design must not violate:

- a validated call reaches the tool intact;
- refusal, if chosen, scoped to open nodes;
- "Dropping a stray undeclared key from an object that declares its properties is defensible and
  should be documented." That is explicitly **not** what they are asking to change.

## Package surface

- `libraries/ts-json-base/src/packlets/json-schema-builder/` (`factories.ts`, `fromJson.ts`,
  `types.ts` if the typing changes) and its tests.
- `etc/ts-json-base.api.md` if the public surface moves. It is an established surface, so changes
  must be **additive**: no removed or renamed exports.
- `common/changes/@fgv/<pkg>/*.json` for every package touched.
- `libraries/ts-json-base/CAPABILITIES.md` if the documented behaviour of `JsonSchema.object` changes.
- `docs/TECH_DEBT.md` / `docs/FUTURE.md` only for what you defer.

## Out of scope

- The other four `JsonSchema` asks (`anyOf`/`oneOf` nullable, `$ref`/`$defs`, numeric enums /
  `pattern` / record / any, constraint keywords through `toJson()`). They are triaged separately and
  will run on `integration/asks`. **Note any interaction your design has with "record"
  (schema-valued `additionalProperties`); do not implement it.**
- `Converters.object` in `ts-utils`.
- Anything in `ts-extras-mcp` or `ts-extras` beyond the test updates your behaviour change forces.

## Acceptance criteria

- [ ] Each numbered belief above has a recorded verdict, and the decision is recorded with its
      rejected alternatives.
- [ ] **Load-bearing:** a test reproduces the requester's two cases on today's `release` and goes
      green after the fix:
      `fromJson({type:'object',properties:{q:{type:'string'}},additionalProperties:true}).convert({q:'a',extra:1})`
      and `fromJson({type:'object'}).convert({q:'a',x:1})`. Whatever the design, the outcome is
      either the keys intact or an explicit refusal, never a silent `{}`.
- [ ] **Load-bearing:** `toJson()` and `convert()` agree for every object shape you touch. Add a test
      that pins the agreement, not just each side.
- [ ] **Load-bearing:** revert the fix and watch the new tests go red; record it.
- [ ] **This changes what a function returns or accepts, so `node common/scripts/install-run-rush.js
      test` repo-wide is the gate, not `rebuild`.** Precedent: #655 broke an `ts-extras-mcp` fixture
      that pinned the old boundary. `ts-extras-mcp`, `ts-extras` ai-assist, `ts-agent-tasks` and
      `ts-agent-memory` all build schemas through `JsonSchema`.
- [ ] `rushx build`, `rushx lint` and `rushx test` (100% coverage) pass with **zero warnings** in
      every modified package. Count warnings with `grep -ci warning`, not by exit code.
- [ ] `rushx fixlint` run before the final commit.
- [ ] `node common/scripts/install-run-rush.js change --verify --target-branch origin/release` passes.
      Type the change file per `.ai/instructions/ACTIVE_DEVELOPMENT.md` § "How to type a change
      file".
- [ ] `code-reviewer` run on the final diff **before** coverage-gap closure. Findings resolved or
      dispositioned in `result.md`.
- [ ] `/finalize-task` run: migrate to `.ai/tasks/completed/2026-10/json-schema-open-object/`, write
      the ledger entry in the PR, and make the capability-feed decision.

## Mechanics

- Work on branch `json-schema-open-object`, already created from `release` with this brief on it.
  Push there. **Do not open a PR**; the orchestrator does that after review.
- `rush` is not on PATH. From the repo root, run `node common/scripts/install-run-rush.js install`,
  then `build --to @fgv/ts-json-base`.
- Commit your work before running long gates. Run the gates in the foreground.
- **Stop and surface**, with a final message of at most 300 words, if:
  - every candidate violates a requester constraint;
  - the typing answer requires a breaking change to an established export;
  - the repo-wide test run shows a consumer that depends on stripping in a way you cannot resolve
    within this surface.

## Exit artifacts

- `state.md`: your working surface.
- `result.md`, covering:
  - what shipped;
  - the verdict on each belief;
  - the decision and the alternatives you rejected;
  - the revert results;
  - gate counts;
  - every consumer whose tests changed, and why;
  - anything this brief got wrong.
