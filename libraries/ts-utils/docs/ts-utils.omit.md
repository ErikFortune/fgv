<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [omit](./ts-utils.omit.md)

## omit() function

Simple implicit omit function, which picks all of the properties from a supplied object except those specified for exclusion.

**Signature:**

```typescript
export declare function omit<T extends object, K extends keyof T>(from: T, exclude: K[]): Omit<T, K>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  from | T | The object from which keys are to be picked. |
|  exclude | K\[\] | The keys of the properties to be excluded from the returned object. |

**Returns:**

Omit&lt;T, K&gt;

A new object containing all of the properties from `from` that were not explicitly excluded.

