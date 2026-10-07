/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * A consumer-written transport, implemented against the public `IMcpSdkTransport` alone — no SDK
 * type in its declaration — driven end to end through the SDK client. It is what the callback
 * slots on `IMcpSdkTransport` exist for: the SDK assigns them when the session connects, and the
 * consumer's `close()` calls `onclose` through the public type.
 */

import '@fgv/ts-utils-jest';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import {
  type IMcpSdkTransport,
  callMcpTool,
  connectMcpSession,
  createCustomTransport
} from '../../packlets/mcp';

/**
 * The consumer's transport. Its callback slots are typed from `IMcpSdkTransport` itself, so the
 * class only compiles while the public type declares them. It knows nothing about the SDK: it
 * forwards outgoing messages to whatever `wire` it is given and surfaces incoming ones through
 * `onmessage`.
 */
class ConsumerTransport implements IMcpSdkTransport {
  public onclose?: IMcpSdkTransport['onclose'];
  public onerror?: IMcpSdkTransport['onerror'];
  public onmessage?: IMcpSdkTransport['onmessage'];
  public readonly closeCalls: jest.Mock = jest.fn();
  private readonly _wire: (message: unknown) => Promise<void>;

  public constructor(wire: (message: unknown) => Promise<void>) {
    this._wire = wire;
  }

  public async start(): Promise<void> {
    // Nothing to open: the wire is already connected.
  }

  public async send(message: unknown): Promise<void> {
    return this._wire(message);
  }

  /** Delivers a message received from the peer. */
  public receive(message: unknown): void {
    this.onmessage?.(message);
  }

  public async close(): Promise<void> {
    this.closeCalls();
    this.onclose?.();
  }
}

/**
 * The adapter: wires a `ConsumerTransport` back-to-back with the client side of an in-memory pair
 * whose server side a real SDK `Server` is connected to.
 */
async function bridgeToServer(server: Server): Promise<ConsumerTransport> {
  const [relay, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const consumer = new ConsumerTransport((message) =>
    relay.send(message as Parameters<InMemoryTransport['send']>[0])
  );
  relay.onmessage = (message): void => consumer.receive(message);
  await relay.start();
  return consumer;
}

describe('a consumer-written IMcpSdkTransport', () => {
  test("the SDK's own InMemoryTransport still assigns to IMcpSdkTransport", () => {
    const [clientSide] = InMemoryTransport.createLinkedPair();
    // Type-level: this line only compiles while the slots stay bivariant-compatible with the SDK.
    const asPublic: IMcpSdkTransport = clientSide;
    expect(asPublic).toBe(clientSide);
  });

  test('connects, calls a tool, and its close() — calling this.onclose — fails an in-flight call and fires onClose', async () => {
    const server = new Server(
      { name: 'consumer-fixture', version: '0.0.1' },
      { capabilities: { tools: {} } }
    );
    let markEntered: () => void = () => undefined;
    const entered = new Promise<void>((resolve) => {
      markEntered = resolve;
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'hang') {
        markEntered();
        await new Promise<void>(() => undefined);
      }
      return { content: [{ type: 'text', text: 'pong' }] };
    });

    const consumer = await bridgeToServer(server);
    const onClose = jest.fn();
    const session = (
      await connectMcpSession({ transport: createCustomTransport(consumer).orThrow(), onClose })
    ).orThrow();

    expect(await callMcpTool(session, 'ping', {})).toSucceedWith({ content: 'pong' });

    const pending = callMcpTool(session, 'hang', {});
    await entered;
    await consumer.close();

    expect(await pending).toFailWithDetail(/Connection closed/, { kind: 'not-connected' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(consumer.closeCalls).toHaveBeenCalledTimes(1);
    await server.close();
  });
});
