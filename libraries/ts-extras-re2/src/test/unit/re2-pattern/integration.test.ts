// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';
import { JsonSchema, type JsonObject } from '@fgv/ts-json-base';
import {
  type IMcpSession,
  adaptMcpTools,
  closeMcpSession,
  connectMcpSession,
  createCustomTransport
} from '@fgv/ts-extras-mcp';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { re2PatternValidator } from '../../../index';

const LONG = 100_000;

function codeSchema(pattern: string): JsonObject {
  return {
    type: 'object',
    properties: { code: { type: 'string', pattern } },
    required: ['code']
  };
}

describe('fromJson with re2PatternValidator', () => {
  test('a pattern is admitted, enforced on values, and emitted unchanged', () => {
    expect(
      JsonSchema.fromJson(codeSchema('^[A-Z]{3}$'), { patternValidator: re2PatternValidator })
    ).toSucceedAndSatisfy((schema) => {
      expect(schema.validate({ code: 'ABC' })).toSucceed();
      expect(schema.validate({ code: 'abc' })).toFail();
      expect(schema.validate({ code: 'XABCX' })).toFail();
      expect(schema.toJson()).toEqual(codeSchema('^[A-Z]{3}$'));
    });
  });

  test('an unanchored pattern is a search', () => {
    expect(
      JsonSchema.fromJson(codeSchema('abc'), { patternValidator: re2PatternValidator })
    ).toSucceedAndSatisfy((schema) => {
      expect(schema.validate({ code: 'xxabcxx' })).toSucceed();
      expect(schema.validate({ code: 'xxabxx' })).toFail();
    });
  });

  test('a pattern RE2 cannot read faithfully refuses the schema, with the path and the reason', () => {
    expect(JsonSchema.fromJson(codeSchema('^(?=x)x$'), { patternValidator: re2PatternValidator })).toFailWith(
      /#\/properties\/code: pattern "\^\(\?=x\)x\$" was refused: RE2 cannot read it as ECMA-262 does: lookahead/
    );
  });

  test('a catastrophic pattern is admitted and still answers on a long value', () => {
    const value = `${'a'.repeat(LONG)}!`;
    expect(value.length).toBeGreaterThan(LONG);
    expect(
      JsonSchema.fromJson(codeSchema('(a+)+$'), { patternValidator: re2PatternValidator })
    ).toSucceedAndSatisfy((schema) => {
      expect(schema.validate({ code: value })).toFail();
      expect(schema.validate({ code: 'a'.repeat(LONG) })).toSucceed();
    });
  });

  test('a nullable pattern node keeps the validator', () => {
    const json: JsonObject = {
      type: 'object',
      properties: { code: { anyOf: [{ type: 'string', pattern: '^\\d+$' }, { type: 'null' }] } },
      required: ['code']
    };
    expect(JsonSchema.fromJson(json, { patternValidator: re2PatternValidator })).toSucceedAndSatisfy(
      (schema) => {
        expect(schema.validate({ code: '123' })).toSucceed();
        expect(schema.validate({ code: null })).toSucceed();
        expect(schema.validate({ code: '12a' })).toFail();
      }
    );
  });
});

describe('adaptMcpTools with re2PatternValidator', () => {
  let server: Server;
  let session: IMcpSession;

  beforeEach(async () => {
    server = new Server({ name: 're2-fixture', version: '0.0.1' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        { name: 'code', description: 'Submit a code', inputSchema: codeSchema('^[A-Z]+$') },
        { name: 'redos', description: 'A catastrophic pattern', inputSchema: codeSchema('(a+)+$') },
        { name: 'lookahead', description: 'Uses lookahead', inputSchema: codeSchema('^(?=A)[A-Z]+$') }
      ]
    }));
    server.setRequestHandler(CallToolRequestSchema, async () => ({
      content: [{ type: 'text', text: 'ok' }]
    }));
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    session = (await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow() })).orThrow();
  });

  afterEach(async () => {
    await closeMcpSession(session);
    await server.close();
  });

  test('RE2-readable patterns are adapted and enforced; a lookahead tool is skipped with its reason', async () => {
    expect(await adaptMcpTools(session, { patternValidator: re2PatternValidator })).toSucceedAndSatisfy(
      (result) => {
        expect(result.tools.map((t) => t.config.name)).toEqual(['code', 'redos']);
        expect(result.skipped.map((s) => s.name)).toEqual(['lookahead']);
        expect(result.skipped[0].reason).toMatch(
          /was refused: RE2 cannot read it as ECMA-262 does: lookahead/
        );

        const code = result.tools[0].config.parametersSchema;
        expect(code.validate({ code: 'ABC' })).toSucceed();
        expect(code.validate({ code: 'abc' })).toFail();

        const value = `${'a'.repeat(LONG)}!`;
        expect(value.length).toBeGreaterThan(LONG);
        expect(result.tools[1].config.parametersSchema.validate({ code: value })).toFail();
      }
    );
  });

  test('without the validator every pattern tool stays skipped', async () => {
    expect(await adaptMcpTools(session)).toSucceedAndSatisfy((result) => {
      expect(result.tools).toEqual([]);
      expect(result.skipped.map((s) => s.reason)).toEqual([
        "#/properties/code: unsupported JSON Schema keyword 'pattern'",
        "#/properties/code: unsupported JSON Schema keyword 'pattern'",
        "#/properties/code: unsupported JSON Schema keyword 'pattern'"
      ]);
    });
  });
});
