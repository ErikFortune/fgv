[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / IJsonEditorMergeOptions

# Interface: IJsonEditorMergeOptions

Merge options for a [JsonEditor](../classes/JsonEditor.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="arraymergebehavior"></a> `arrayMergeBehavior` | [`ArrayMergeBehavior`](../type-aliases/ArrayMergeBehavior.md) | Controls how arrays are merged when combining JSON values. - `'append'` (default): Existing array elements are preserved and new elements are appended - `'replace'`: Existing array is completely replaced with the new array |
| <a id="nullasdelete"></a> `nullAsDelete?` | `boolean` | Controls whether null values should be treated as property deletion during merge operations. - `false` (default): Null values are merged normally, setting the property to null - `true`: Null values delete the property from the target object during merge |
