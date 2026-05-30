[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IResolutionResult

# Interface: IResolutionResult\<T, TV\>

Result of attempting to resolve a specific resource with a given context.
Contains the resolved value, matching candidates, and diagnostic information.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
| `TV` *extends* [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> | [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="allcandidates"></a> `allCandidates?` | readonly [`IResourceCandidate`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)[] | All candidates that were considered during resolution |
| <a id="bestcandidate"></a> `bestCandidate?` | [`IResourceCandidate`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The best matching candidate for this context |
| <a id="candidatedetails"></a> `candidateDetails?` | [`ICandidateInfo`](ICandidateInfo.md)[] | Detailed information about each candidate's matching process |
| <a id="composedvalue"></a> `composedValue?` | `TV` | The final composed/resolved value |
| <a id="error"></a> `error?` | `string` | Error message if resolution failed |
| <a id="resource"></a> `resource?` | [`IResource`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The resolved resource object, if successful |
| <a id="resourceid"></a> `resourceId` | `string` | ID of the resource that was resolved |
| <a id="success"></a> `success` | `boolean` | Whether the resolution was successful |
