[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Context](../README.md) / IContextMatchOptions

# Interface: IContextMatchOptions

Options to control matching of conditions against a context.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="acceptdefaultscore"></a> `acceptDefaultScore?` | `boolean` | If true, then conditions which would otherwise yield [NoMatch](../../../variables/NoMatch.md) but have a defined [scoreAsDefault](../../../classes/Condition.md#scoreasdefault) will yield `scoreAsDefault`instead of `NoMatch`. |
| <a id="partialcontextmatch"></a> `partialContextMatch?` | `boolean` | If true, then conditions for which a corresponding values is not present in the context being matched will yield `undefined` instead of `NoMatch`. |
