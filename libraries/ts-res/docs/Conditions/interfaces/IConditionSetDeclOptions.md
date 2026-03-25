[Home](../../README.md) > [Conditions](../README.md) > IConditionSetDeclOptions

# Interface: IConditionSetDeclOptions

Options for creating a Conditions.ConditionSet | ConditionSet declaration.

**Extends:** [`IDeclarationOptions`](../../interfaces/IDeclarationOptions.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[qualifiersToReduce](./IConditionSetDeclOptions.qualifiersToReduce.md)

</td><td>



</td><td>

ReadonlySet&lt;[QualifierName](../../type-aliases/QualifierName.md)&gt;

</td><td>

If provided, reduces the qualifiers of the condition set by removing qualifiers that are made

</td></tr>
<tr><td>

[showDefaults](./IDeclarationOptions.showDefaults.md)

</td><td>



</td><td>

boolean

</td><td>

If `true`, properties with default values will be included in the
output.

</td></tr>
<tr><td>

[normalized](./IDeclarationOptions.normalized.md)

</td><td>



</td><td>

boolean

</td><td>

If `true`, the output will be normalized using hash-based ordering for consistent structure.

</td></tr>
</tbody></table>
