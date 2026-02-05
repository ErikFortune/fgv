[**@fgv/ts-chocolate**](../../../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../../../README.md) / [Entities](../../../../../README.md) / [Converters](../../../README.md) / [Fillings](../README.md) / procedureEntities

# Variable: procedureEntities

> `const` **procedureEntities**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../../../../../Model/interfaces/IOptionsWithPreferred.md)\<[`IProcedureRefEntity`](../../../../Fillings/type-aliases/IProcedureRefEntity.md), [`ProcedureId`](../../../../../../../../type-aliases/ProcedureId.md)\>\>

Defined in: [ts-chocolate/src/packlets/entities/fillings/converters.ts:114](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/fillings/converters.ts#L114)

Converter for filling recipe procedures with preferred selection.
Validates that preferredId (if specified) exists in options.
