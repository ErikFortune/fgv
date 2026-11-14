[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / defaultScopeEncoding

# Function: defaultScopeEncoding()

> **defaultScopeEncoding**(`scope`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Default scope encoding (identity) with the path-safety contract documented
in design §OQ-1 enforced.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`ScopeKey`](../type-aliases/ScopeKey.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

## Remarks

The case-insensitive reserved-device check rejects mixed-case forms
(e.g. `'Aux'`, `'con.txt'`) even though POSIX hosts don't reserve
those names. The default path optimizes for cross-platform safety;
consumers who need such names supply a custom `scopeEncoding` per
design OQ-1.
