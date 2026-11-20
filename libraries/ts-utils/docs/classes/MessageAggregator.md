[Home](../README.md) > MessageAggregator

# Class: MessageAggregator

A simple error aggregator to simplify collecting and reporting all errors in
a flow.

**Implements:** [`IMessageAggregator`](../interfaces/IMessageAggregator.md)

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(errors)`

</td><td>



</td><td>

Constructs a new MessageAggregator | ErrorAggregator with an
optionally specified initial set of error messages.

</td></tr>
</tbody></table>

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

[hasMessages](./MessageAggregator.hasMessages.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether any messages have been aggregated.

</td></tr>
<tr><td>

[numMessages](./MessageAggregator.numMessages.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of messages aggregated.

</td></tr>
<tr><td>

[messages](./MessageAggregator.messages.md)

</td><td>

`readonly`

</td><td>

string[]

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

[addMessage(message)](./MessageAggregator.addMessage.md)

</td><td>



</td><td>

Adds a message to the aggregator, if defined.

</td></tr>
<tr><td>

[addMessages(messages)](./MessageAggregator.addMessages.md)

</td><td>



</td><td>

Adds multiple messages to the aggregator.

</td></tr>
<tr><td>

[toString(separator)](./MessageAggregator.toString.md)

</td><td>



</td><td>

Returns all messages as a single string joined

</td></tr>
<tr><td>

[returnOrReport(result, separator)](./MessageAggregator.returnOrReport.md)

</td><td>



</td><td>

If any error messages have been aggregated, returns
Failure | Failure<T> with the aggregated
messages concatenated using the optionally-supplied
separator, or newline.

</td></tr>
</tbody></table>
