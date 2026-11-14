[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / numberEnumOf

# Function: numberEnumOf()

## Call Signature

> **numberEnumOf**\<`T`\>(`values`, `opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`T` \| `null`\>\>

Creates a schema node for a closed set of numbers (pydantic `Literal[1.5, 2]`).

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* `number` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | readonly `T`[] | The allowed values. |
| `opts` | [`ISchemaOptions`](../interfaces/ISchemaOptions.md) & `object` | Optional annotations and nullability. |

### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`T` \| `null`\>\>

The node, whose `Static` type is the union of `values` or `null`; or a `Failure` when
`values` is empty or holds a member that is not a finite number, or when `default` or a member of
`examples` is not a JSON value.

## Call Signature

> **numberEnumOf**\<`T`\>(`values`, `opts?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`T`\>\>

Creates a schema node for a closed set of numbers (pydantic `Literal[1.5, 2]`).

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` *extends* `number` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | readonly `T`[] | The allowed values. |
| `opts?` | [`ISchemaOptions`](../interfaces/ISchemaOptions.md) | Optional annotations and nullability. |

### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`T`\>\>

The node, whose `Static` type is the union of `values`; or a `Failure` when `values` is
empty or holds a member that is not a finite number, or when `default` or a member of `examples`
is not a JSON value.

### Remarks

Emits `{ type: 'number', enum: [...] }`. The validator accepts exactly the listed values,
compared with `===`, and coerces nothing — `'1'` is not `1`. A nullable node also carries `null`
in its emitted `enum`, as `enumOf` does.

Unlike the other factories this one returns a `Result`, because what can be wrong is the value
list rather than an option object; declare with `.shouldNotFail(label)`.
