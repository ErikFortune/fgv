[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ConfectionEditingSession

# Class: ConfectionEditingSession

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSession.ts:60](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSession.ts#L60)

Factory for creating type-specific confection editing sessions.
Dispatches to specialized session classes based on confection type.

## Methods

### create()

> `static` **create**(`baseConfection`, `context`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyConfectionEditingSession`](../type-aliases/AnyConfectionEditingSession.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSession.ts:83](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSession.ts#L83)

Creates a confection editing session for the appropriate confection type.
Dispatches to type-specific session classes:
- MoldedBonBonEditingSession for molded bonbons (frame-based yield)
- BarTruffleEditingSession for bar truffles (linear scaling)
- RolledTruffleEditingSession for rolled truffles (linear scaling)

#### Parameters

##### baseConfection

[`AnyConfection`](../../../../LibraryRuntime/type-aliases/AnyConfection.md)

The source confection to edit

##### context

[`ISessionContext`](../../../interfaces/ISessionContext.md)

The runtime context for resource access

##### params?

[`IConfectionEditingSessionParams`](../interfaces/IConfectionEditingSessionParams.md)

Optional session parameters (sessionId, initialYield)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyConfectionEditingSession`](../type-aliases/AnyConfectionEditingSession.md)\>

Success with type-specific session, or Failure
