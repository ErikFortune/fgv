[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ICollectionSectionProps

# Interface: ICollectionSectionProps

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="collections"></a> `collections` | `readonly` | readonly [`ICollectionRowItem`](ICollectionRowItem.md)[] | Collection items to display |
| <a id="defaultcollapsed"></a> `defaultCollapsed?` | `readonly` | `boolean` | Whether the section starts collapsed |
| <a id="onadddirectory"></a> `onAddDirectory?` | `readonly` | () => `void` | Callback when "Add Directory" is clicked |
| <a id="oncreatecollection"></a> `onCreateCollection?` | `readonly` | () => `void` | Callback when "New Collection" is clicked |
| <a id="ondeletecollection"></a> `onDeleteCollection?` | `readonly` | (`collectionId`) => `void` | Callback when delete is clicked for a mutable collection |
| <a id="onexportallaszip"></a> `onExportAllAsZip?` | `readonly` | () => `void` | Callback when "Export All as Zip" is clicked (header-level) |
| <a id="onexportcollection"></a> `onExportCollection?` | `readonly` | (`collectionId`) => `void` | Callback when export is clicked for a mutable collection |
| <a id="onhidecollection"></a> `onHideCollection?` | `readonly` | (`collectionId`) => `void` | Callback when hide is selected from the context menu |
| <a id="onimportcollection"></a> `onImportCollection?` | `readonly` | () => `void` | Callback when "Import Collection" is clicked (header-level) |
| <a id="onmergecollection"></a> `onMergeCollection?` | `readonly` | (`collectionId`) => `void` | Callback when merge is clicked for a mutable collection |
| <a id="onopencollectionfromfile"></a> `onOpenCollectionFromFile?` | `readonly` | () => `void` | Callback when "Open from File" is clicked (header-level, File System Access API) |
| <a id="onrenamecollection"></a> `onRenameCollection?` | `readonly` | (`collectionId`) => `void` | Callback when rename is clicked for a mutable collection |
| <a id="onsetdefaultcollection"></a> `onSetDefaultCollection?` | `readonly` | (`collectionId`) => `void` | Callback when the star/default is clicked for a collection |
| <a id="onshowcollection"></a> `onShowCollection?` | `readonly` | (`collectionId`) => `void` | Callback when show (unhide) is selected from the context menu |
| <a id="ontogglevisibility"></a> `onToggleVisibility` | `readonly` | (`collectionId`) => `void` | Callback when visibility is toggled for a collection |
| <a id="onunlockcollection"></a> `onUnlockCollection?` | `readonly` | (`collectionId`) => `void` | Callback when the unlock button is clicked for a locked protected collection |
| <a id="sourcecolorfallback"></a> `sourceColorFallback?` | `readonly` | `string` | Fallback border-l color class when sourceName is not in the map |
| <a id="sourcecolormap"></a> `sourceColorMap?` | `readonly` | `Readonly`\<`Record`\<`string`, `string`\>\> | Maps sourceName values to Tailwind border-l color classes |
