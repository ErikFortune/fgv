[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / GridResourceSelector

# Type Alias: GridResourceSelector

> **GridResourceSelector** = \{ `resourceIds`: `string`[]; `type`: `"ids"`; \} \| \{ `prefix`: `string`; `type`: `"prefix"`; \} \| \{ `suffix`: `string`; `type`: `"suffix"`; \} \| \{ `type`: `"resourceTypes"`; `types`: `string`[]; \} \| \{ `pattern`: `string`; `type`: `"pattern"`; \} \| \{ `type`: `"all"`; \} \| \{ `selector`: [`ICustomResourceSelector`](../interfaces/ICustomResourceSelector.md); `type`: `"custom"`; \}

Resource selection configuration for grid views.
Supports simple built-in selectors and custom selection logic.
