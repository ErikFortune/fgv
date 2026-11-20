[Home](../README.md) > IMessageAggregator

# Interface: IMessageAggregator

Simple error aggregator to simplify collecting all errors in
a flow.

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

[hasMessages](./IMessageAggregator.hasMessages.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether any messages have been aggregated.

</td></tr>
<tr><td>

[numMessages](./IMessageAggregator.numMessages.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of messages aggregated.

</td></tr>
<tr><td>

[messages](./IMessageAggregator.messages.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

The aggregated messages.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[addMessage(message)](./IMessageAggregator.addMessage.md)

</td><td>



</td><td>

Adds a message to the aggregator, if defined.

</td></tr>
<tr><td>

[addMessages(messages)](./IMessageAggregator.addMessages.md)

</td><td>



</td><td>

Adds multiple messages to the aggregator.

</td></tr>
<tr><td>

[toString(separator)](./IMessageAggregator.toString.md)

</td><td>



</td><td>

Returns all messages as a single string joined

</td></tr>
</tbody></table>
