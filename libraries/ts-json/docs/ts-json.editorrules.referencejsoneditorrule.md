<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [EditorRules](./ts-json.editorrules.md) &gt; [ReferenceJsonEditorRule](./ts-json.editorrules.referencejsoneditorrule.md)

## EditorRules.ReferenceJsonEditorRule class

The  replaces property keys or values that match some known object with a copy of that referenced object, formatted according to the current context.

A property key is matched if it matches any known referenced value. - If the value of the matched key is `'default'`<!-- -->, then the entire object is formatted with the current context, flattened and merged into the current object. - If the value of the matched key is some other string, then the entire object is formatted with the current context, and the child of the resulting object at the specified path is flattened and merged into the current object. - If the value of the matched key is an object, then the entire object is formatted with the current context extended to include any properties of that object, flattened, and merged into the current object. - It is an error if the referenced value is not an object.

Any property, array or literal value is matched if it matches any known value reference. The referenced value is replaced by the referenced value, formatted using the current editor context.

**Signature:**

```typescript
export declare class ReferenceJsonEditorRule extends JsonEditorRuleBase 
```
**Extends:** JsonEditorRuleBase

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(options)](./ts-json.editorrules.referencejsoneditorrule._constructor_.md) |  | Creates a new . |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [\_options?](./ts-json.editorrules.referencejsoneditorrule._options.md) | <code>protected</code> | [IJsonEditorOptions](./ts-json.ijsoneditoroptions.md) | _(Optional)_ Stored fully-resolved  for this rule. |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [create(options)](./ts-json.editorrules.referencejsoneditorrule.create.md) | <code>static</code> | Creates a new . |
|  [editProperty(key, value, state)](./ts-json.editorrules.referencejsoneditorrule.editproperty.md) |  | Evaluates a property for reference expansion. |
|  [editValue(value, state)](./ts-json.editorrules.referencejsoneditorrule.editvalue.md) |  | Evaluates a property, array or literal value for reference replacement. |
