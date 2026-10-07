# State — `json-schema-fromjson-widening`

Worker-owned.

## Log

- Checked out `json-schema-fromjson-widening` @ `555d2ba7` (= `integration/asks` `3995b4d6` + brief).
  `rush install` and `build --to @fgv/ts-json-base` green.
- Read the brief, the three inbox files, the long-form ask on PersonAIlity `design/mcp-tools`
  (§ J2/J3/J5, and the spike `schema-subset.cjs`, whose shapes are the requester's verbatim
  fixtures), and `json-schema-open-object/result.md`.
- Checked the beliefs against source (verdicts in `result.md`). Read `ts-extras`
  `structuredOutput.ts`, `toolFormats.ts`, `completionClient.ts` (the proxy path) and
  `ts-extras-ollama`'s `sanitizeFormatSchema` for the wire decision.
- `b061f5b8` #680: nullable `anyOf`/`oneOf`.
- `6012ce5c` #681: local `$ref` inlining, plus an internal `IParseContext` refactor. The exported
  `jsonSchemaConverter` keeps its `string` context.
- `bfa5b645` #683: `JsonSchema.record` and schema-valued `additionalProperties`. Numeric enum,
  `pattern` and `{}` are deferred.
- Pushed; `rush test --to @fgv/ts-extras-mcp` (6 ops) green with no consumer test edits.
- `code-reviewer` (read-only, on the three commits): 3 P1, 4 P2, 5 P3. Applied in `47320a83`
  (detail in `result.md`).
- Revert matrix: the first attempt was interrupted mid-run and left R17's mutation in
  `fromJson.ts`. I noticed it, restored the file, and re-ran all 23 reverts on a clean tree.
  Every one goes red; the tree was clean afterwards.
- Repo-wide `install-run-rush.js test` on `47320a83`: SUCCESS, 36 operations (detail in
  `result.md` § Gates).
- Finalize: migrated to `completed/2026-10/`, wrote `README.md` and `meta.yaml`, and drafted the
  ledger entry. Antagonist pass (independent, read-only), whose findings I applied:
  - recorded record's Gemini wire as an accepted risk;
  - listed known exceptions and over-refusals;
  - added a TECH_DEBT P3 entry for ignored validating keywords, and softened the two comments that
    overclaimed;
  - updated `ts-extras-mcp` `CAPABILITIES.md`;
  - corrected wording.
- `change --verify --target-branch origin/integration/asks` passes.

- Gate-time review at `da4c7760` (orchestrator), applied:
  - a 128-level depth bound, with a `captureResult` backstop at the root;
  - the record disposition (Gemini/Ollama strip the value schema) restated;
  - RFC 6901 decode-then-split, plus a `~01` test;
  - `ts-extras-mcp` `CAPABILITIES.md` qualified;
  - the `endToEnd` header comment and a `pydantic_tool` adaptable fixture;
  - testbed `mcpProbe` reasons refreshed;
  - the record `__proto__` gap added to TECH_DEBT;
  - echoed references truncated;
  - `_parseRecordBody` converts once.

  Revert matrix re-run, 28 rows.

- Copilot round 1 on #723 (five threads, against `f2a96f57`), applied:
  - malformed `~` escapes refused;
  - `_convertNode` guards with `_plainObjectField`, and the enum arm takes the converted object;
  - property keys escaped in child paths;
  - README row count corrected;
  - the `result.md` scope statement corrected.

  Revert matrix re-run, 30 rows.

- Copilot round 2 on #723 (two threads, against `c4494de1`), applied after pulling the merge of
  `integration/asks` (with #722) and running `rush install`:
  - the record key-set keywords completed;
  - the `$ref` error path truncated.

  Revert matrix re-run, 32 rows.

## Open questions

None blocking. Deferred shapes are in `docs/FUTURE.md`; the numeric-enum and `{}` deferrals each
wait on a `ts-extras` Gemini-adapter decision, which the brief reserves for a stop-and-surface.
