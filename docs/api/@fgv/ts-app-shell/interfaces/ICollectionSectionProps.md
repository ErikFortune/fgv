[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ICollectionSectionProps

# Interface: ICollectionSectionProps

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-collections"></a> `collections` | `readonly` | readonly [`ICollectionRowItem`](ICollectionRowItem.md)[] | Collection items to display |
| <a id="property-defaultcollapsed"></a> `defaultCollapsed?` | `readonly` | `boolean` | Whether the section starts collapsed |
| <a id="property-onadddirectory"></a> `onAddDirectory?` | `readonly` | () => `void` | Callback when "Add Directory" is clicked |
| <a id="property-oncreatecollection"></a> `onCreateCollection?` | `readonly` | () => `void` | Callback when "New Collection" is clicked |
| <a id="property-ondeletecollection"></a> `onDeleteCollection?` | `readonly` | (`collectionId`) => `void` | Callback when delete is clicked for a mutable collection |
| <a id="property-onexportallaszip"></a> `onExportAllAsZip?` | `readonly` | () => `void` | Callback when "Export All as Zip" is clicked (header-level) |
| <a id="property-onexportcollection"></a> `onExportCollection?` | `readonly` | (`collectionId`) => `void` | Callback when export is clicked for a mutable collection |
| <a id="property-onhidecollection"></a> `onHideCollection?` | `readonly` | (`collectionId`) => `void` | Callback when hide is selected from the context menu |
| <a id="property-onimportcollection"></a> `onImportCollection?` | `readonly` | () => `void` | Callback when "Import Collection" is clicked (header-level) |
| <a id="property-onmergecollection"></a> `onMergeCollection?` | `readonly` | (`collectionId`) => `void` | Callback when merge is clicked for a mutable collection |
| <a id="property-onopencollectionfromfile"></a> `onOpenCollectionFromFile?` | `readonly` | () => `void` | Callback when "Open from File" is clicked (header-level, File System Access API) |
| <a id="property-onrenamecollection"></a> `onRenameCollection?` | `readonly` | (`collectionId`) => `void` | Callback when rename is clicked for a mutable collection |
| <a id="property-onsetdefaultcollection"></a> `onSetDefaultCollection?` | `readonly` | (`collectionId`) => `void` | Callback when the star/default is clicked for a collection |
| <a id="property-onshowcollection"></a> `onShowCollection?` | `readonly` | (`collectionId`) => `void` | Callback when show (unhide) is selected from the context menu |
| <a id="property-ontogglevisibility"></a> `onToggleVisibility` | `readonly` | (`collectionId`) => `void` | Callback when visibility is toggled for a collection |
| <a id="property-onunlockcollection"></a> `onUnlockCollection?` | `readonly` | (`collectionId`) => `void` | Callback when the unlock button is clicked for a locked protected collection |
| <a id="property-sourcecolorfallback"></a> `sourceColorFallback?` | `readonly` | `string` | Fallback border-l color class when sourceName is not in the map |
| <a id="property-sourcecolormap"></a> `sourceColorMap?` | `readonly` | `Readonly`\<`Record`\<`string`, `string`\>\> | Maps sourceName values to Tailwind border-l color classes |
