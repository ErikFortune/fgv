[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / createCustomTransport

# Function: createCustomTransport()

> **createCustomTransport**(`transport`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMcpTransport`](../interfaces/IMcpTransport.md)\>

Wraps a pre-built MCP SDK client transport in this package's opaque transport handle, so a
session can run over any transport the SDK (or the consumer) provides.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `transport` | [`IMcpSdkTransport`](../interfaces/IMcpSdkTransport.md) | An unstarted SDK client transport with no session id. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMcpTransport`](../interfaces/IMcpTransport.md)\>

`Success` with an opaque handle (`transportKind: 'custom'`), or `Failure` if the
transport already carries a session id.

## Remarks

The motivating use is testing against an in-process server, with no subprocess and no port:

```ts
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
await server.connect(serverSide); // an SDK `Server` / `McpServer`
const transport = createCustomTransport(clientSide).orThrow();
const session = (await connectMcpSession({ transport })).orThrow();
```

It equally admits transports this package does not construct itself (the SDK's legacy SSE or
WebSocket client transports, or a consumer's own implementation). The transport is handed to the
SDK client unchanged, and the session that connects over it takes ownership of it. It must be
fresh — unstarted and without a `sessionId` (the SDK treats a transport with one as a reconnect
and skips the `initialize` handshake) — and its `close()` must call the `onclose` callback the
SDK assigns, or neither in-flight requests nor `onClose` learn of the close. The handle is
single-use: a second [connectMcpSession](connectMcpSession.md) with it fails `'invalid-handle'`.
