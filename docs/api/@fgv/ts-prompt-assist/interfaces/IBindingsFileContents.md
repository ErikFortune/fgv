[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IBindingsFileContents

# Interface: IBindingsFileContents

Shape of the YAML body of a `_bindings.yaml` file. The scope key is
reconstructed by the store from the file's directory path, so the file
body itself only carries the slot -\> binding map.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-bindings"></a> `bindings` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), [`SlotBinding`](../type-aliases/SlotBinding.md)\> | Map from slot name to its bound value (literal or resource). |
