# State — `json-schema-open-object`

Worker-owned.

## Log

- Checked out `json-schema-open-object` @ `ed104c7e` (= `release` `3515f456` + brief). `rush install`,
  `build --to @fgv/ts-json-base` green.
- Reproduced on the built `release` code (scratchpad script against `lib/`):
  - case 1 `{q:'a',extra:1}` → `{"q":"a"}`, wire omits `additionalProperties`;
  - case 2 `{q:'a',x:1}` → `{}`;
  - **not in the brief:** the bare open object converts `42`, `'hi'`, `[1]` to `{}` too
    (`Converters.object` with no fields and `strict: false` never inspects its input);
  - schema-valued `additionalProperties` → refused by `fromJson` (`#: schema-valued 'additionalProperties' is not supported`).
- Wrote `openObject.test.ts` before the fix: 20 tests red on `release`, the controls green.
- Decision (d): pass-through for open objects + `additionalProperties` always stated on the wire +
  `OpenObjectStatic` typed overloads. See `result.md`.
- Implemented, committed `47b44a81`; `code-reviewer` run on the commit (ref-only) while revert
  experiments ran on the tree; repo-wide `rush test` green (36 ops).
- Review findings applied in `a74c87a8` (incl. a latent nested-`__proto__` defect in
  `Converters.jsonObject`). The reviewer's suggested object-spread replacement failed the
  top-level `__proto__` test (down-levelled spread is `Object.assign`); kept `Object.fromEntries`.
- Second repo-wide `rush test` after `a74c87a8`: **FAILURE** — `ts-agent-tasks`
  `kindRegistry.test.ts` pins `jsonObject`'s existing `__proto__` handling; `testbed` blocked.
- Antagonist pass on the finalize artifacts: flagged that an explicit `additionalProperties: true`
  would break Anthropic JSON outputs (`ts-extras` `structuredOutput.ts:151`).
- `9e9fe563`: reverted the explicit-`true` wire emission and the `jsonObject` change (deferred to
  TECH_DEBT P3). Third repo-wide `rush test` on `9e9fe563`: SUCCESS, 36 operations.
- Gate-time review: `5eea2cd2` drops an own `__proto__` in `jsonObject` and at an open object's top
  level (the review placed `jsonObject` in `ts-utils`; it is in `ts-json-base`), restates the Anthropic
  claim as unprobed, names the host-gate consequence in the change file, and applies two P3s.
  Fourth repo-wide `rush test`: SUCCESS, 36 operations; ts-agent-tasks pin unedited and green.
  TECH_DEBT P3 removed.

- Copilot round 1 on PR #720: undeclared keys were validated only after declared fields succeeded.
  `2c7bf0d3` validates both sides independently (`allSucceed`) and reports all failures; R9 red against
  the old shape. Fifth repo-wide `rush test` on `2c7bf0d3`: SUCCESS, 36 operations.

## Open questions

- None blocking. The PR number is unknown to the worker; `meta.yaml` `prs` and the ledger marker
  carry a `<PR>` placeholder for the orchestrator to fill when it opens the PR.
