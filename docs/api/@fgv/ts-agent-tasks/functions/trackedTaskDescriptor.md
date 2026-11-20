[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / trackedTaskDescriptor

# Function: trackedTaskDescriptor()

> **trackedTaskDescriptor**(): [`ITaskKindDescriptor`](../interfaces/ITaskKindDescriptor.md)\<`Readonly`\<`Record`\<`string`, `never`\>\>\>

The registration descriptor for `fgv.tracked@1`.

## Returns

[`ITaskKindDescriptor`](../interfaces/ITaskKindDescriptor.md)\<`Readonly`\<`Record`\<`string`, `never`\>\>\>

## Remarks

Registers all eleven [trackedTaskCommandNames](../variables/trackedTaskCommandNames.md) with parameter schemas, so each can be offered
as a generated command tool. Registering a command offers it to no one: a host chooses which to
offer, one by one, and every call is still authorized per command by the host's policy.

**Two validators, and which one decides.** The broker validates a native command with its own
`trackedCommand` converter, never through these handles. The converter is authoritative; the schema
is what a model is offered. They agree on shape, which is a fixture obligation (the `detailSchema`
precedent). They cannot agree on bounds: the wire subset has no lengths, patterns or ranges, so a
value the schema admits can still be refused as `invalid` — an overlong title, a code outside
identifier syntax, a non-canonical instant, a negative amount, `total` below `completed`, or too many
references.

**What a host enables with these.** Every reference a command carries — `set-attention`'s list, a
reason's `attention`, an outcome's `artifacts` — is accepted on syntax alone: nothing checks that it
names anything real, so a model can assert a reference it made up. `succeed`, `fail` and `cancel`
record a terminal state on the host's behalf, and a terminal state is final; `succeed` always
records an outcome, `fail` and `cancel` record one only when it is sent.
