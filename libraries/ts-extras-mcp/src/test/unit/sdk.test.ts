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

// Exercises the real SDK-isolation seam (the one file that imports @modelcontextprotocol/sdk).
// Constructing the SDK objects is side-effect-free — no process is spawned and no network call is
// made until a transport is connected, so these factory calls are safe in a unit test.
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { SseError } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPError } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

// eslint-disable-next-line @rushstack/packlets/mechanics
import { classifySdkError, makeClient, makeHttpTransport, makeStdioTransport } from '../../packlets/mcp/sdk';

describe('sdk isolation seam', () => {
  describe('makeClient', () => {
    test('constructs a client exposing the projected surface', () => {
      const client = makeClient('test-client', '9.9.9');
      expect(typeof client.connect).toBe('function');
      expect(typeof client.listTools).toBe('function');
      expect(typeof client.callTool).toBe('function');
      expect(typeof client.close).toBe('function');
      expect(typeof client.getServerVersion).toBe('function');
      // Before connecting, the server identity is unknown.
      expect(client.getServerVersion()).toBeUndefined();
    });
  });

  describe('makeStdioTransport', () => {
    test('constructs a transport with full params (args/env/cwd)', () => {
      const transport = makeStdioTransport({
        command: 'node',
        args: ['--version'],
        env: { FOO: 'bar' },
        cwd: '/tmp'
      });
      expect(transport).toBeDefined();
    });

    test('constructs a transport with only a command (args omitted)', () => {
      const transport = makeStdioTransport({ command: 'node' });
      expect(transport).toBeDefined();
    });
  });

  describe('makeHttpTransport', () => {
    test('constructs a transport with headers', () => {
      const transport = makeHttpTransport(new URL('http://localhost:9000/mcp'), {
        authorization: 'Bearer x'
      });
      expect(transport).toBeDefined();
    });

    test('constructs a transport without headers', () => {
      const transport = makeHttpTransport(new URL('https://example.com/mcp'));
      expect(transport).toBeDefined();
    });
  });

  describe('classifySdkError', () => {
    test('maps the SDK timeout code to timeout, never to transport or protocol', () => {
      const err = McpError.fromError(ErrorCode.RequestTimeout, 'Request timed out', { timeout: 5 });
      expect(classifySdkError(err, 'session')).toEqual({ kind: 'timeout' });
    });

    test('maps the SDK connection-closed code to not-connected', () => {
      const err = McpError.fromError(ErrorCode.ConnectionClosed, 'Connection closed');
      expect(classifySdkError(err, 'session')).toEqual({ kind: 'not-connected' });
    });

    test('maps any other JSON-RPC error code to protocol, carrying the code', () => {
      for (const code of [
        ErrorCode.InvalidParams,
        ErrorCode.MethodNotFound,
        ErrorCode.InternalError,
        ErrorCode.InvalidRequest,
        -1234
      ]) {
        expect(classifySdkError(new McpError(code, 'x'), 'session')).toEqual({ kind: 'protocol', code });
      }
    });

    test('maps the SDK UnauthorizedError to unauthorized with no status', () => {
      expect(classifySdkError(new UnauthorizedError(), 'session')).toEqual({ kind: 'unauthorized' });
    });

    test('maps HTTP 401 and 403 to unauthorized, carrying the status', () => {
      expect(classifySdkError(new StreamableHTTPError(401, 'x'), 'session')).toEqual({
        kind: 'unauthorized',
        status: 401
      });
      expect(classifySdkError(new StreamableHTTPError(403, 'x'), 'connect')).toEqual({
        kind: 'unauthorized',
        status: 403
      });
    });

    test('maps HTTP 404 to session-expired only once a session exists', () => {
      expect(classifySdkError(new StreamableHTTPError(404, 'x'), 'session')).toEqual({
        kind: 'session-expired'
      });
      expect(classifySdkError(new StreamableHTTPError(404, 'x'), 'connect')).toEqual({
        kind: 'transport',
        status: 404
      });
    });

    test('maps any other HTTP status to transport, carrying the status', () => {
      expect(classifySdkError(new StreamableHTTPError(500, 'x'), 'session')).toEqual({
        kind: 'transport',
        status: 500
      });
    });

    test('omits a status that is not an HTTP status', () => {
      expect(classifySdkError(new StreamableHTTPError(-1, 'x'), 'session')).toEqual({ kind: 'transport' });
      expect(classifySdkError(new StreamableHTTPError(undefined, 'x'), 'session')).toEqual({
        kind: 'transport'
      });
    });

    test('classifies the legacy SSE transport error by status the same way', () => {
      const event = { type: 'error' } as unknown as ConstructorParameters<typeof SseError>[2];
      expect(classifySdkError(new SseError(401, 'x', event), 'session')).toEqual({
        kind: 'unauthorized',
        status: 401
      });
    });

    test('is total: anything else, thrown or not an Error at all, is transport', () => {
      expect(classifySdkError(new Error('Not connected'), 'session')).toEqual({ kind: 'transport' });
      expect(classifySdkError(new TypeError('fetch failed'), 'session')).toEqual({ kind: 'transport' });
      expect(classifySdkError('a string', 'session')).toEqual({ kind: 'transport' });
      expect(classifySdkError(undefined, 'connect')).toEqual({ kind: 'transport' });
    });
  });
});
