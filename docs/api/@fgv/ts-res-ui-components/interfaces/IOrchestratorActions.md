[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / IOrchestratorActions

# Interface: IOrchestratorActions

Complete actions interface for the resource orchestrator system.

This interface provides all the methods needed to manage and manipulate the orchestrator state,
including resource import/export, configuration management, filtering, resolution, and UI state.
All methods are designed to work seamlessly with the Result pattern for consistent error handling.

## Examples

```typescript
// Basic resource import workflow
import { ResourceTools, FileTools } from '@fgv/ts-res-ui-components';

function ResourceImporter() {
  const { state, actions } = ResourceTools.useResourceData();

  const handleDirectoryImport = async (files: File[]) => {
    const directory = await FileTools.convertFilesToDirectory(files);
    await actions.importDirectory(directory);

    if (state.error) {
      console.error('Import failed:', state.error);
    } else {
      console.log('Import successful:', state.resources?.summary);
    }
  };
}
```

```typescript
// Configuration and filtering workflow
const { state, actions } = ResourceTools.useResourceData();

// Apply a new configuration
actions.applyConfiguration(customConfig);

// Set up filters
actions.updateFilterState({
  values: { language: 'en-US', platform: 'web' }
});

// Apply filters and get results
const filterResult = await actions.applyFilter();
if (filterResult) {
  console.log('Filtered resources:', filterResult.resources.summary.resourceCount);
}
```

```typescript
// Resolution context and resource editing
const { state, actions } = ResourceTools.useResourceData();

// Set resolution context
actions.updateResolutionContext('language', 'en-US');
actions.updateResolutionContext('platform', 'mobile');
actions.applyResolutionContext();

// Select a resource for resolution
actions.selectResourceForResolution('user.welcome');

// Edit a resolved resource value
const newValue = { text: 'Updated welcome message' };
actions.saveResourceEdit('user.welcome', newValue);

// Apply all pending changes (edits + new resources)
await actions.applyPendingResources();
```

```typescript
// Resource resolution and error handling
const { actions } = ResourceTools.useResourceData();

const resolveUserMessage = async (messageId: string, userContext: Record<string, string>) => {
  const result = await actions.resolveResource(messageId, userContext);

  if (result.isSuccess()) {
    console.log('Resolved message:', result.value);
    return result.value;
  } else {
    console.error('Resolution failed:', result.message);
    actions.addMessage('error', `Failed to resolve ${messageId}: ${result.message}`);
    return null;
  }
};
```

```typescript
// Bundle import and advanced workflows
const { actions } = ResourceTools.useResourceData();

// Import from a pre-built bundle
const bundleData = await loadBundleFromUrl('/api/resources/bundle');
await actions.importBundle(bundleData);

// Import directory with specific configuration
const directory = await loadResourceDirectory();
const customConfig = await loadConfiguration();
await actions.importDirectoryWithConfig(directory, customConfig);
```

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-addmessage"></a> `addMessage` | (`type`, `message`) => `void` |
| <a id="property-applyconfiguration"></a> `applyConfiguration` | (`config`) => `void` |
| <a id="property-applyfilter"></a> `applyFilter` | () => `Promise`\<[`IFilterResult`](../namespaces/FilterTools/interfaces/IFilterResult.md) \| `null`\> |
| <a id="property-applypendingresources"></a> `applyPendingResources` | () => `Promise`\<[`Result`](../type-aliases/Result.md)\<\{ `appliedCount`: `number`; `deletionCount`: `number`; `existingResourceEditCount`: `number`; `newResourceCount`: `number`; `pendingResourceEditCount`: `number`; \}\>\> |
| <a id="property-applyresolutioncontext"></a> `applyResolutionContext` | (`hostManagedValues?`) => [`Result`](../type-aliases/Result.md)\<`void`\> |
| <a id="property-cancelnewresource"></a> `cancelNewResource` | () => `void` |
| <a id="property-clearmessages"></a> `clearMessages` | () => `void` |
| <a id="property-clearresourceedits"></a> `clearResourceEdits` | () => [`Result`](../type-aliases/Result.md)\<\{ `clearedCount`: `number`; \}\> |
| <a id="property-clearresources"></a> `clearResources` | () => `void` |
| <a id="property-creatependingresource"></a> `createPendingResource` | (`params`) => [`Result`](../type-aliases/Result.md)\<`void`\> |
| <a id="property-discardpendingresources"></a> `discardPendingResources` | () => `void` |
| <a id="property-discardresourceedits"></a> `discardResourceEdits` | () => [`Result`](../type-aliases/Result.md)\<\{ `discardedCount`: `number`; \}\> |
| <a id="property-exportbundle"></a> `exportBundle` | () => `void` |
| <a id="property-exportcompiled"></a> `exportCompiled` | () => `void` |
| <a id="property-exportsource"></a> `exportSource` | () => `void` |
| <a id="property-geteditedvalue"></a> `getEditedValue` | (`resourceId`) => [`JsonValue`](../type-aliases/JsonValue.md) \| `undefined` |
| <a id="property-hasresourceedit"></a> `hasResourceEdit` | (`resourceId`) => `boolean` |
| <a id="property-importbundle"></a> `importBundle` | (`bundle`) => `Promise`\<`void`\> |
| <a id="property-importfiletree"></a> `importFileTree` | (`fileTree`) => `Promise`\<`void`\> |
| <a id="property-importfiletreewithconfig"></a> `importFileTreeWithConfig` | (`fileTree`, `config`) => `Promise`\<`void`\> |
| <a id="property-markresourcefordeletion"></a> `markResourceForDeletion` | (`resourceId`) => `void` |
| <a id="property-o11y"></a> `o11y` | [`IObservabilityContext`](../namespaces/ObservabilityTools/interfaces/IObservabilityContext.md) |
| <a id="property-removependingresource"></a> `removePendingResource` | (`resourceId`) => [`Result`](../type-aliases/Result.md)\<`void`\> |
| <a id="property-resetfilter"></a> `resetFilter` | () => `void` |
| <a id="property-resetresolutioncache"></a> `resetResolutionCache` | () => [`Result`](../type-aliases/Result.md)\<`void`\> |
| <a id="property-resolveresource"></a> `resolveResource` | (`resourceId`, `context?`) => [`Result`](../type-aliases/Result.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> |
| <a id="property-savenewresourceaspending"></a> `saveNewResourceAsPending` | () => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `pendingResources`: `Map`\<`string`, [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<`string`\>\>; \}\> |
| <a id="property-saveresourceedit"></a> `saveResourceEdit` | (`resourceId`, `editedValue`, `originalValue?`) => [`Result`](../type-aliases/Result.md)\<`void`\> |
| <a id="property-selectresource"></a> `selectResource` | (`resourceId`) => `void` |
| <a id="property-selectresourceforresolution"></a> `selectResourceForResolution` | (`resourceId`) => [`Result`](../type-aliases/Result.md)\<`void`\> |
| <a id="property-selectresourcetype"></a> `selectResourceType` | (`type`) => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `draft`: \{ `isValid`: `boolean`; `resourceId`: `string`; `resourceType`: `string`; `template`: [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \} \| `undefined`; \}\> |
| <a id="property-setresolutionviewmode"></a> `setResolutionViewMode` | (`mode`) => `void` |
| <a id="property-startnewresource"></a> `startNewResource` | (`params?`) => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `draft`: \{ `isValid`: `boolean`; `resourceId`: `string`; `resourceType`: `string`; `template`: [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \} \| `undefined`; \}\> |
| <a id="property-updateconfiguration"></a> `updateConfiguration` | (`config`) => `void` |
| <a id="property-updatefilterstate"></a> `updateFilterState` | (`state`) => `void` |
| <a id="property-updatenewresourceid"></a> `updateNewResourceId` | (`id`) => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `draft`: \{ `isValid`: `boolean`; `resourceId`: `string`; `resourceType`: `string`; `template`: [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \} \| `undefined`; \}\> |
| <a id="property-updatenewresourcejson"></a> `updateNewResourceJson` | (`json`) => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `draft`: \{ `isValid`: `boolean`; `resourceId`: `string`; `resourceType`: `string`; `template`: [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \} \| `undefined`; \}\> |
| <a id="property-updateresolutioncontext"></a> `updateResolutionContext` | (`qualifierName`, `value`) => [`Result`](../type-aliases/Result.md)\<`void`\> |
