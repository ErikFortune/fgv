<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [ReferenceMapKeyPolicy](./ts-json.referencemapkeypolicy.md) &gt; [validateItems](./ts-json.referencemapkeypolicy.validateitems.md)

## ReferenceMapKeyPolicy.validateItems() method

Validates an array of entries using the validation rules for this policy.

**Signature:**

```typescript
validateItems(items: [string, T][], options?: IReferenceMapKeyPolicyValidateOptions): Result<[string, T][]>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  items | \[string, T\]\[\] | The array of entries to be validated. |
|  options | [IReferenceMapKeyPolicyValidateOptions](./ts-json.ireferencemapkeypolicyvalidateoptions.md) | _(Optional)_ Optional [options](./ts-json.ireferencemapkeypolicyvalidateoptions.md) to control validation. |

**Returns:**

Result&lt;\[string, T\]\[\]&gt;

`Success` with an array of validated entries, or `Failure` with an error message if validation fails.
