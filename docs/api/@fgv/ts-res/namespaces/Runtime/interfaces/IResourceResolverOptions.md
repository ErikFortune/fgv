[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / IResourceResolverOptions

# Interface: IResourceResolverOptions

Options for configuring a [ResourceResolver](../../../classes/ResourceResolver.md).

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="suppressnullasdelete"></a> `suppressNullAsDelete?` | `boolean` | `false` | Controls whether null values in resource composition should suppress properties instead of setting them to null. When true, properties with null values from higher-priority partial candidates will be omitted from the final composed resource. |
