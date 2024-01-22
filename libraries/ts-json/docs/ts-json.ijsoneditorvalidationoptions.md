<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [IJsonEditorValidationOptions](./ts-json.ijsoneditorvalidationoptions.md)

## IJsonEditorValidationOptions interface

Validation options for a .

**Signature:**

```typescript
export interface IJsonEditorValidationOptions 
```

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [onInvalidPropertyName](./ts-json.ijsoneditorvalidationoptions.oninvalidpropertyname.md) |  | 'error' \| 'ignore' | If <code>onInvalidPropertyName</code> is <code>'error'</code> (default) then any property name that is invalid after template rendering causes an error and stops conversion. If <code>onInvalidPropertyName</code> is <code>'ignore'</code>, then names which are invalid after template rendering are passed through unchanged. |
|  [onInvalidPropertyValue](./ts-json.ijsoneditorvalidationoptions.oninvalidpropertyvalue.md) |  | 'error' \| 'ignore' | If <code>onInvalidPropertyValue</code> is <code>'error'</code> (default) then any illegal property value other than <code>undefined</code> causes an error and stops conversion. If <code>onInvalidPropertyValue</code> is <code>'ignore'</code> then any invalid property values are silently ignored. |
|  [onUndefinedPropertyValue](./ts-json.ijsoneditorvalidationoptions.onundefinedpropertyvalue.md) |  | 'error' \| 'ignore' | If <code>onUndefinedPropertyValue</code> is <code>'error'</code>, then any property with value <code>undefined</code> will cause an error and stop conversion. If <code>onUndefinedPropertyValue</code> is <code>'ignore'</code> (default) then any property with value <code>undefined</code> is silently ignored. |
