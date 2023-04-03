<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [FormattableBase](./ts-utils.formattablebase.md) &gt; [format](./ts-utils.formattablebase.format.md)

## FormattableBase.format() method

> This API is provided as a preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

Formats an object using the supplied mustache template.

**Signature:**

```typescript
format(template: string): Result<string>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  template | string |  |

**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;string&gt;

[Success](./ts-utils.success.md) with the resulting string, or [Failure](./ts-utils.failure.md) with an error message if an error occurs.
