[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpSdkTransport

# Interface: IMcpSdkTransport

The minimal structural shape of an MCP SDK client transport, accepted by
[createCustomTransport](../functions/createCustomTransport.md).

## Remarks

Every `@modelcontextprotocol/sdk` client transport satisfies this shape — the SDK's
`InMemoryTransport` (for tests against an in-process server), `SSEClientTransport`,
`WebSocketClientTransport`, or a consumer's own `Transport` implementation. It is declared
structurally so this package's public surface never names an SDK type; the SDK's own `Transport`
interface is what the object must actually implement at runtime, because the SDK client takes
ownership of it (assigning its `onmessage` / `onclose` / `onerror` callbacks) when the session
connects.

Two runtime obligations the type cannot express:

- **`close()` must call the `onclose` callback** the SDK assigned. That is how the SDK fails the
  session's in-flight requests and how [IConnectMcpSessionParams.onClose](IConnectMcpSessionParams.md#property-onclose) is told.
- **It must be fresh: unstarted, and without a `sessionId`.** The SDK skips the `initialize`
  handshake for a transport that already has a session id, treating it as a reconnect — so a
  session connected over one would never have negotiated. [createCustomTransport](../functions/createCustomTransport.md) refuses
  a transport whose `sessionId` is already set.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | The transport's session id, when it has one. Must be unset when the transport is wrapped. |

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Closes the transport. Must call the `onclose` callback the SDK assigned.

#### Returns

`Promise`\<`void`\>

***

### onclose()?

> `optional` **onclose**(): `void`

Assigned by the SDK when the session connects. `close()` must call it, which is how the SDK
fails the session's in-flight requests and how `onClose` is told.

#### Returns

`void`

***

### onerror()?

> `optional` **onerror**(`error`): `void`

Assigned by the SDK when the session connects; call it to report a non-fatal transport error.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `Error` |

#### Returns

`void`

***

### onmessage()?

> `optional` **onmessage**(`message`, `extra?`): `void`

Assigned by the SDK when the session connects; call it with each JSON-RPC message received.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `unknown` |
| `extra?` | `unknown` |

#### Returns

`void`

***

### send()

> **send**(`message`, `options?`): `Promise`\<`void`\>

Sends one JSON-RPC message.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `unknown` |
| `options?` | `unknown` |

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(): `Promise`\<`void`\>

Starts the transport. Called by the SDK client during [connectMcpSession](../functions/connectMcpSession.md).

#### Returns

`Promise`\<`void`\>
