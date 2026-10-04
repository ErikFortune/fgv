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
- Repo-wide `install-run-rush.js test`: see `result.md` § Gates.

## Open questions

None blocking. Deferred shapes are in `docs/FUTURE.md`; the numeric-enum and `{}` deferrals each
wait on a `ts-extras` Gemini-adapter decision, which the brief reserves for a stop-and-surface.
