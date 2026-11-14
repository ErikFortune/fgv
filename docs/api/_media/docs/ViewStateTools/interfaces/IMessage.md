[Home](../../README.md) > [ViewStateTools](../README.md) > IMessage

# Interface: IMessage

Message type definition for the MessagesWindow component.

Extends the basic message structure with additional properties for enhanced
message management and display.

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

[id](./IMessage.id.md)

</td><td>



</td><td>

string

</td><td>

Unique identifier for the message

</td></tr>
<tr><td>

[type](./IMessage.type.md)

</td><td>



</td><td>

"error" | "success" | "info" | "warning"

</td><td>

Message type determining visual styling and filtering

</td></tr>
<tr><td>

[message](./IMessage.message.md)

</td><td>



</td><td>

string

</td><td>

The message content to display

</td></tr>
<tr><td>

[timestamp](./IMessage.timestamp.md)

</td><td>



</td><td>

Date

</td><td>

Timestamp when the message was created

</td></tr>
</tbody></table>
