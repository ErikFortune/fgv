[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / ICandidateInfo

# Interface: ICandidateInfo

Information about a candidate being processed by the reducer.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `public` | [`CandidateAction`](../type-aliases/CandidateAction.md) |
| <a id="property-conditions"></a> `conditions` | `public` | [`ILooseConditionDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md)\<`string`\>[] |
| <a id="property-conditionsetkey"></a> `conditionSetKey` | `public` | `string` |
| <a id="property-json"></a> `json?` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| <a id="property-originalcandidate"></a> `originalCandidate` | `readonly` | [`ResourceCandidate`](../../../classes/ResourceCandidate.md) |
