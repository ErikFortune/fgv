[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / isMoldedBonBonYield

# Function: isMoldedBonBonYield()

> **isMoldedBonBonYield**(`yieldSpec`): `yieldSpec is IMoldedBonBonYield`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:94](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L94)

Type guard to check if a yield is frame-based (for molded bonbons).

## Parameters

### yieldSpec

[`AnyConfectionYield`](../type-aliases/AnyConfectionYield.md)

The yield specification to check

## Returns

`yieldSpec is IMoldedBonBonYield`

True if the yield is a [frame-based yield](../interfaces/IMoldedBonBonYield.md)
