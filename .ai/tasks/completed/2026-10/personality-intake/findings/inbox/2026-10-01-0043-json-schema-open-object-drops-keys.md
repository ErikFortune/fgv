# ts-json-base: `JsonSchema.object` drops undeclared keys even with `additionalProperties: true`

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#679](https://github.com/ErikFortune/personaility/issues/679) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:28Z. No comments.
- **Long form:** [`ASK-2026-09-29-json-schema-fromjson-mcp-subset.md` § J1](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-json-schema-fromjson-mcp-subset.md) on branch `design/mcp-tools`. Reproduction: `.ai/tasks/active/mcp-tools-plan/spikes/schema-subset.cjs` → `probes/schema-subset-spike.txt` (same branch).

## The request, in their terms

> "make `additionalProperties: true` mean pass-through in the `JsonSchema.object` factory. Today it builds `Converters.object(fields, { strict: false })`, which still builds its result from the declared fields only, so undeclared keys are dropped. `fromJson` maps both `additionalProperties: true` and an absent `additionalProperties` to that option"

Reproduction quoted in the issue:

```
fromJson({type:'object', properties:{q:{type:'string'}}, additionalProperties:true}).convert({q:'a', extra:1}) -> {"q":"a"}
fromJson({type:'object'}).convert({q:'a', x:1})                                                                -> {}
```

Proposed shape (note, "fgv decides"): "declared fields converted as now, undeclared keys carried through as `JsonValue` (and, when `additionalProperties` is a schema, converted by it). Emit the keyword on `toJson()`."

## Stated motivation

> "The harmful case is an open object, such as pydantic `dict[str, Any]` or zod `z.record`. It converts to an empty object, the MCP server receives it emptied, and the model is told the call succeeded."

Note: "`adaptMcpTools`' guarantee — the model is never offered a tool whose arguments we cannot validate — holds; the property a host relies on, *a validated call reaches the tool intact*, does not."

## Stated constraints or acceptance

- > "If fgv would rather refuse such schemas than pass the keys through, the refusal must be scoped to **open nodes**: an object with no `properties`, or with `additionalProperties` set to `true` or to a schema. Refusing every object whose `additionalProperties` is absent would rule out nearly every MCP tool schema."
- Out of scope (note): "Dropping a stray undeclared key from an object that declares its properties is defensible and should be documented; it is not what this ask is about."
- Requester-stated priority: "**P1**, because the failure is silent. It blocks nothing, because the hub can guard against it."
- Interim: "the hub's MCP adapter refuses any tool that has an open object node at any depth."
- The note carries an in-document correction: "**Reworked (orchestrator review, 2026-10-01).** The first version placed the cause in `fromJson` … the cause is the `JsonSchema.object` factory, and the wire schema is not the problem."
- Verified against `@fgv/ts-json-base` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-json-base` (`JsonSchema` / `json-schema-builder`). Consumer path: `@fgv/ts-extras-mcp` `adaptMcpTools` and `@fgv/ts-extras` `executeClientToolTurn` (named in the note as handing the converted value to `execute`).

## Stated dependencies

- J5 ([#683](https://github.com/ErikFortune/personaility/issues/683)) defers to this ask for the fully open case.

## Observations (intake agent's, not the requester's)

- None.
