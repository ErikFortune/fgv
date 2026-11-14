[Home](../../README.md) > [Validators](../README.md) > IRecordOfValidatorOptions

# Interface: IRecordOfValidatorOptions

Options for Validators.recordOf helper function.

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

[onError](./IRecordOfValidatorOptions.onError.md)

</td><td>



</td><td>

"fail" | "ignore"

</td><td>

If `onError` is `'fail'` (default), then the entire validation fails if any key or element
cannot be validated.

</td></tr>
<tr><td>

[keyValidator](./IRecordOfValidatorOptions.keyValidator.md)

</td><td>



</td><td>

[Validator](../../interfaces/Validator.md)&lt;TK, TC&gt;

</td><td>

If present, `keyValidator` is used to validate the source object property names.

</td></tr>
</tbody></table>
