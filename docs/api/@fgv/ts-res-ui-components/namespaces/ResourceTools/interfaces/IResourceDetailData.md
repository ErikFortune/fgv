[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResourceTools](../README.md) / IResourceDetailData

# Interface: IResourceDetailData

Detailed information about a resource for display in source views.
Contains the resource structure including all candidates and their conditions.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="candidatecount"></a> `candidateCount` | `number` | Total number of candidates defined for this resource |
| <a id="candidates"></a> `candidates` | [`IChildResourceCandidateDecl_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)[] | Array of all candidates with their conditions and values |
| <a id="id"></a> `id` | `string` | Unique identifier of the resource |
| <a id="resourcetype"></a> `resourceType` | `string` | Type classification of the resource |
