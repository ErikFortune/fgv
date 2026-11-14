[Home](../README.md) > IClientToolLoopFailureDetail

# Interface: IClientToolLoopFailureDetail

The detail a failed `runClientToolLoop` call carries.

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

[rounds](./IClientToolLoopFailureDetail.rounds.md)

</td><td>

`readonly`

</td><td>

readonly [IClientToolRound](IClientToolRound.md)[]

</td><td>

Every round that completed before the failure, in order (empty when none did).

</td></tr>
</tbody></table>
