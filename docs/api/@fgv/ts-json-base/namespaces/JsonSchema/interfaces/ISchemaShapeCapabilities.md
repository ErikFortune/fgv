[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / ISchemaShapeCapabilities

# Interface: ISchemaShapeCapabilities

What a wire format does with the two schema shapes whose support varies independently of any
keyword: an `enum` whose members are not strings, and a schema with no `type`.

## Remarks

- `nonStringEnum` — `'pass'` sends a numeric or boolean `enum` as emitted; `'fold'` removes it and
  states it in the description (`Constraints: enum [1,2].`), keeping the `type`. A string enum is
  always passed.
- `untyped` — `'pass'` sends a schema with no `type` (`JsonSchema.anyValue`, `{}`) as emitted;
  `'refuse'` fails the adaptation, naming the path; `'pass-nested'` passes one beneath the root
  (in `properties` or `items`) and, for a wire that requires the root schema itself to state a
  `type`, refuses a root (`#`) with no `type` keyword — including one typed only by `enum`,
  `const`, `$ref` or a combinator, which such a wire rejects just the same. There is no fold for it: the only way to give the node a
  `type` is to pick one, which would narrow what the model may send below what the validator
  accepts, and a refusal is the one outcome that cannot mislead.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-nonstringenum"></a> `nonStringEnum` | `readonly` | `"pass"` \| `"fold"` | What the wire does with an `enum` holding a number or a boolean. |
| <a id="property-untyped"></a> `untyped` | `readonly` | [`SchemaUntypedRule`](../type-aliases/SchemaUntypedRule.md) | What the wire does with a schema that states no `type`. |
