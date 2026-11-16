[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRecoveryIssue

# Interface: ITaskRecoveryIssue

One problem found while opening a repository.

## Remarks

`blocking` issues prevent a writable repository: open returns a read-only recovery handle
instead. `advisory` issues are reported and the repository still opens.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-code"></a> `code` | `readonly` | [`TaskRecoveryIssueCode`](../type-aliases/TaskRecoveryIssueCode.md) |
| <a id="property-message"></a> `message` | `readonly` | `string` |
| <a id="property-recordname"></a> `recordName?` | `readonly` | `string` |
| <a id="property-severity"></a> `severity` | `readonly` | `"blocking"` \| `"advisory"` |
