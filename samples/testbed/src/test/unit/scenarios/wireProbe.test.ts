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

import '@fgv/ts-utils-jest';
import { Logging, fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import { JsonSchema, type JsonObject } from '@fgv/ts-json-base';

import {
  CONTROL_FIXTURE_ID,
  type IAdaptedRequest,
  type IHttpResponse,
  type IRawRequest,
  type IWireProbeDeps,
  type IWireProbeFixture,
  type IWireProbeWire,
  type IWireProbeWireResult,
  RAW_MAX_TOKENS,
  WIRE_PROBE_FIXTURES,
  WIRE_PROBE_WIRES,
  buildRawRequest,
  classifyEndToEnd,
  classifyRow,
  formatWireProbeReport,
  observeAdapted,
  observeRaw,
  ourVerdict,
  providerErrorText,
  runWireProbe,
  runWireProbeScenario,
  selectWires,
  unsafeRows,
  wireProbeScenario,
  wireSchemaKeywords
} from '../../../scenarios/wireProbe';
import type { IScenarioContext } from '../../../shell';

/*
 * The provider bodies below are SYNTHETIC: shaped like each provider's documented error envelope
 * (OpenAI / Anthropic / Gemini `{ error: { message } }`, xAI `{ error: '…' }`), not captured from a
 * live run. No live run has been made (see the stream's result.md). They exercise the parsing and
 * classification paths; they are not evidence of what any provider does.
 */
const ANTHROPIC_400: string = JSON.stringify({
  type: 'error',
  error: {
    type: 'invalid_request_error',
    message: 'tools.0.custom.input_schema: multipleOf is not supported'
  }
});
const XAI_422: string = JSON.stringify({
  code: 'Client specified an invalid argument',
  error: 'Invalid schema: enum'
});

let lastLogger: Logging.InMemoryLogger;

/** A context whose secrets resolve only for the listed environment variables. */
function testContext(keys: Readonly<Record<string, string>>): IScenarioContext {
  lastLogger = new Logging.InMemoryLogger();
  return {
    logger: new Logging.LogReporter({ logger: lastLogger }),
    keyStore: undefined,
    resolveSecret: async (spec) => {
      const value = keys[spec.envVarName];
      return value !== undefined ? succeed(value) : fail(`${spec.envVarName} not set`);
    },
    dataTree: undefined as unknown as IScenarioContext['dataTree']
  };
}

function wire(id: string): IWireProbeWire {
  const found = WIRE_PROBE_WIRES.find((w) => w.id === id);
  if (found === undefined) {
    throw new Error(`no wire ${id}`);
  }
  return found;
}

function descriptor(id: AiAssist.AiProviderId): AiAssist.IAiProviderDescriptor {
  return AiAssist.getProviderDescriptor(id).orThrow();
}

function fixture(id: string): IWireProbeFixture {
  const found = WIRE_PROBE_FIXTURES.find((f) => f.id === id);
  if (found === undefined) {
    throw new Error(`no fixture ${id}`);
  }
  return found;
}

function rawOf(id: string): JsonObject {
  return JsonSchema.fromJson(fixture(id).schema).orThrow().toJson() as JsonObject;
}

/**
 * A simulated provider: rejects (400) any raw request whose body mentions one of `rejects`, and
 * accepts everything else. `sendAdapted` answers the same way from the schema the library would
 * adapt, which is enough to drive every end-to-end branch.
 */
interface IFakeProvider {
  readonly deps: IWireProbeDeps;
  readonly rawUrls: string[];
  readonly adapted: string[];
}

function fakeProvider(options: {
  readonly rejects?: ReadonlyArray<string>;
  readonly rawStatus?: (request: IRawRequest) => IHttpResponse | undefined;
  readonly adapted?: (request: IAdaptedRequest) => Result<string> | undefined;
}): IFakeProvider {
  const rawUrls: string[] = [];
  const adapted: string[] = [];
  const rejects = options.rejects ?? [];
  return {
    rawUrls,
    adapted,
    deps: {
      postJson: async (request) => {
        rawUrls.push(request.url);
        const forced = options.rawStatus?.(request);
        if (forced !== undefined) {
          return succeed(forced);
        }
        const text = JSON.stringify(request.body);
        const hit = rejects.find((keyword) => text.includes(`"${keyword}"`));
        return succeed(
          hit === undefined ? { status: 200, body: '{}' } : { status: 400, body: ANTHROPIC_400 }
        );
      },
      sendAdapted: async (request) => {
        adapted.push(request.wire.id);
        return options.adapted?.(request) ?? succeed('x');
      }
    }
  };
}

describe('wireProbe', () => {
  describe('fixtures', () => {
    test('every fixture reads through JsonSchema.fromJson, with unique ids and the control first', () => {
      expect(WIRE_PROBE_FIXTURES[0].id).toBe(CONTROL_FIXTURE_ID);
      expect(new Set(WIRE_PROBE_FIXTURES.map((f) => f.id)).size).toBe(WIRE_PROBE_FIXTURES.length);
      for (const f of WIRE_PROBE_FIXTURES) {
        expect(JsonSchema.fromJson(f.schema)).toSucceed();
      }
    });

    test('cover every keyword and shape the tables name', () => {
      const text = JSON.stringify(WIRE_PROBE_FIXTURES.map((f) => f.schema));
      for (const keyword of [...JsonSchema.schemaConstraintKeywords, 'enum']) {
        expect(text).toContain(`"${keyword}"`);
      }
      expect(WIRE_PROBE_FIXTURES.map((f) => f.id)).toEqual(
        expect.arrayContaining(['untyped-root', 'untyped-property', 'untyped-items'])
      );
    });
  });

  describe('ourVerdict', () => {
    test('pass, adapt and refuse, read from the library tables', () => {
      const anthropicTools = AiAssist.clientToolSchemaKeywords(descriptor('anthropic'));
      const gemini = AiAssist.clientToolSchemaKeywords(descriptor('google-gemini'));
      const openai = AiAssist.clientToolSchemaKeywords(descriptor('openai'));
      expect(ourVerdict(rawOf('multipleOf'), anthropicTools)).toBe('pass');
      expect(ourVerdict(rawOf('untyped-property'), anthropicTools)).toBe('pass');
      expect(ourVerdict(rawOf('enum-integer'), gemini)).toBe('adapt');
      expect(ourVerdict(rawOf('exclusiveMinimum-integer'), gemini)).toBe('adapt');
      expect(ourVerdict(rawOf('title'), openai)).toBe('adapt');
      expect(ourVerdict(rawOf('untyped-items'), openai)).toBe('refuse');
      expect(ourVerdict(rawOf('untyped-root'), gemini)).toBe('refuse');
    });
  });

  describe('observations', () => {
    test('providerErrorText reads the known envelopes and falls back to the body', () => {
      expect(providerErrorText(ANTHROPIC_400)).toBe(
        'tools.0.custom.input_schema: multipleOf is not supported'
      );
      expect(providerErrorText(XAI_422)).toBe('Invalid schema: enum');
      expect(providerErrorText('<html>bad gateway</html>')).toBe('<html>bad gateway</html>');
      expect(providerErrorText('{"detail":"no"}')).toBe('{"detail":"no"}');
      expect(providerErrorText('x'.repeat(400))).toBe(`${'x'.repeat(300)}…`);
      // Gemini puts one error per line.
      expect(
        providerErrorText(
          JSON.stringify({ error: { message: 'enum[0] (TYPE_STRING), 1\nenum[1] (TYPE_STRING), 2' } })
        )
      ).toBe('enum[0] (TYPE_STRING), 1 | enum[1] (TYPE_STRING), 2');
    });

    test('observeRaw: 2xx accepts, 400/422 reject, anything else is inconclusive', () => {
      expect(observeRaw(succeed({ status: 200, body: '{}' }))).toEqual({ kind: 'accepted' });
      expect(observeRaw(succeed({ status: 400, body: ANTHROPIC_400 }))).toEqual({
        kind: 'rejected',
        detail: '400 tools.0.custom.input_schema: multipleOf is not supported'
      });
      expect(observeRaw(succeed({ status: 422, body: XAI_422 }))).toEqual({
        kind: 'rejected',
        detail: '422 Invalid schema: enum'
      });
      expect(observeRaw(succeed({ status: 401, body: 'unauthorized' }))).toEqual({
        kind: 'inconclusive',
        detail: '401 unauthorized'
      });
      expect(observeRaw(fail('ECONNRESET'))).toEqual({
        kind: 'inconclusive',
        detail: 'transport: ECONNRESET'
      });
    });

    test('observeAdapted reads the library failure text', () => {
      expect(observeAdapted(succeed('x'))).toEqual({ kind: 'accepted' });
      expect(
        observeAdapted(
          fail("tool 'probe': #/properties/v: a schema with no 'type' cannot be sent on this wire")
        )
      ).toMatchObject({ kind: 'refused-locally' });
      expect(observeAdapted(fail(`Anthropic API: AI API returned 400: ${ANTHROPIC_400}`))).toEqual({
        kind: 'rejected',
        detail: '400 tools.0.custom.input_schema: multipleOf is not supported'
      });
      expect(observeAdapted(fail('AI streaming API returned 429: slow down'))).toEqual({
        kind: 'inconclusive',
        detail: '429 slow down'
      });
      expect(observeAdapted(fail('empty response'))).toEqual({
        kind: 'inconclusive',
        detail: 'empty response'
      });
    });
  });

  describe('classification', () => {
    test('classifyRow', () => {
      const accepted = { kind: 'accepted' } as const;
      const rejected = { kind: 'rejected', detail: '400' } as const;
      const unknown = { kind: 'inconclusive', detail: '503' } as const;
      expect(classifyRow('pass', accepted)).toBe('agrees');
      expect(classifyRow('pass', rejected)).toBe('unsafe');
      expect(classifyRow('adapt', accepted)).toBe('conservative');
      expect(classifyRow('refuse', accepted)).toBe('conservative');
      expect(classifyRow('adapt', rejected)).toBe('agrees');
      expect(classifyRow('refuse', rejected)).toBe('agrees');
      expect(classifyRow('pass', unknown)).toBe('inconclusive');
    });

    test('classifyEndToEnd', () => {
      const accepted = { kind: 'accepted' } as const;
      const refused = { kind: 'refused-locally', detail: 'cannot be sent' } as const;
      const rejected = { kind: 'rejected', detail: '400' } as const;
      const unknown = { kind: 'inconclusive', detail: '?' } as const;
      expect(classifyEndToEnd('pass', accepted)).toBe('ok');
      expect(classifyEndToEnd('adapt', accepted)).toBe('ok');
      expect(classifyEndToEnd('pass', rejected)).toBe('unsafe');
      expect(classifyEndToEnd('adapt', refused)).toBe('mismatch');
      expect(classifyEndToEnd('refuse', refused)).toBe('ok');
      expect(classifyEndToEnd('refuse', accepted)).toBe('mismatch');
      expect(classifyEndToEnd('refuse', rejected)).toBe('mismatch');
      expect(classifyEndToEnd('pass', unknown)).toBe('inconclusive');
    });
  });

  describe('selectWires', () => {
    test('all wires by default, or the listed ones in order', () => {
      expect(selectWires({}, WIRE_PROBE_WIRES)).toSucceedWith(WIRE_PROBE_WIRES);
      expect(selectWires({ WIRE_PROBE_WIRES: '  ' }, WIRE_PROBE_WIRES)).toSucceedWith(WIRE_PROBE_WIRES);
      expect(
        selectWires({ WIRE_PROBE_WIRES: 'gemini-tools, anthropic-tools' }, WIRE_PROBE_WIRES)
      ).toSucceedWith([wire('gemini-tools'), wire('anthropic-tools')]);
    });

    test('an unknown id fails naming it and the known ones', () => {
      expect(selectWires({ WIRE_PROBE_WIRES: 'nope' }, WIRE_PROBE_WIRES)).toFailWith(
        /unknown wire 'nope'.*anthropic-tools/
      );
    });
  });

  describe('wires', () => {
    test('one wire per provider and position, each on a model the registry resolves', () => {
      expect(WIRE_PROBE_WIRES.map((w) => w.id)).toEqual([
        'anthropic-tools',
        'anthropic-json-outputs',
        'openai-tools',
        'openai-strict-output',
        'gemini-tools',
        'gemini-response-schema',
        'xai-tools',
        'xai-strict-output'
      ]);
      for (const w of WIRE_PROBE_WIRES) {
        expect(AiAssist.resolveProviderModel(descriptor(w.providerId), w.model)).toSucceed();
      }
    });

    test('wireSchemaKeywords reads the tool or the structured-output table', () => {
      const anthropic = descriptor('anthropic');
      expect(wireSchemaKeywords(wire('anthropic-tools'), anthropic, 'claude-sonnet-5')).toBe(
        AiAssist.clientToolSchemaKeywords(anthropic, { model: 'claude-sonnet-5' })
      );
      // JSON outputs on the model ai-assist sends them to: numeric constraints fold there.
      expect(wireSchemaKeywords(wire('anthropic-json-outputs'), anthropic, 'claude-opus-5-5')?.minimum).toBe(
        'fold'
      );
    });

    test('buildRawRequest: Anthropic tools and JSON outputs', () => {
      const anthropic = descriptor('anthropic');
      const schema = rawOf('minimum');
      const tools = buildRawRequest(wire('anthropic-tools'), anthropic, 'm', 'k', schema);
      expect(tools.url).toBe('https://api.anthropic.com/v1/messages');
      expect(tools.headers['x-api-key']).toBe('k');
      expect(tools.body).toMatchObject({ model: 'm', tools: [{ name: 'probe' }] });
      expect(JSON.stringify(tools.body)).toContain('"input_schema":{"type":"object"');
      const json = buildRawRequest(wire('anthropic-json-outputs'), anthropic, 'm', 'k', schema);
      expect(json.body.tools).toBeUndefined();
      expect(JSON.stringify(json.body)).toContain(
        '"output_config":{"format":{"type":"json_schema","schema":'
      );
    });

    test('buildRawRequest: Gemini translates the dialect and nothing else; the key stays out of the URL', () => {
      const gemini = descriptor('google-gemini');
      const schema = rawOf('exclusiveMinimum-integer');
      const tools = buildRawRequest(wire('gemini-tools'), gemini, 'gm', 'secret', schema);
      expect(tools.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gm:generateContent');
      expect(tools.url).not.toContain('secret');
      expect(tools.headers['x-goog-api-key']).toBe('secret');
      const text = JSON.stringify(tools.body);
      expect(text).toContain('"exclusiveMinimum":0');
      expect(text).not.toContain('additionalProperties');
      expect(text).toContain('"function_declarations"');
      const out = buildRawRequest(wire('gemini-response-schema'), gemini, 'gm', 'secret', schema);
      expect(out.body.generationConfig).toMatchObject({
        maxOutputTokens: RAW_MAX_TOKENS,
        responseMimeType: 'application/json'
      });
    });

    test('buildRawRequest: OpenAI-family tools on Responses, strict output on Chat Completions', () => {
      const schema = rawOf('enum-integer');
      const tools = buildRawRequest(wire('openai-tools'), descriptor('openai'), 'n', 'k', schema);
      expect(tools.url).toBe('https://api.openai.com/v1/responses');
      expect(tools.headers.authorization).toBe('Bearer k');
      expect(tools.body).toMatchObject({ tools: [{ type: 'function', name: 'probe', parameters: schema }] });
      const openaiOut = buildRawRequest(wire('openai-strict-output'), descriptor('openai'), 'n', 'k', schema);
      expect(openaiOut.url).toBe('https://api.openai.com/v1/chat/completions');
      expect(Object.keys(openaiOut.body)).toContain('max_completion_tokens');
      expect(JSON.stringify(openaiOut.body)).toContain('"strict":true');
      const xaiOut = buildRawRequest(wire('xai-strict-output'), descriptor('xai-grok'), 'g', 'k', schema);
      expect(xaiOut.url).toBe('https://api.x.ai/v1/chat/completions');
      expect(Object.keys(xaiOut.body)).toContain('max_tokens');
    });
  });

  describe('runWireProbe', () => {
    test('probes only the wires with a key, and an all-accepting provider is never unsafe', async () => {
      const provider = fakeProvider({});
      const context = testContext({ ANTHROPIC_API_KEY: 'k' });
      const result = await runWireProbe(context, provider.deps, [
        wire('anthropic-tools'),
        wire('gemini-tools')
      ]);
      expect(result).toSucceedAndSatisfy((report) => {
        expect(report).toContain('--- Anthropic tools · anthropic · claude-sonnet-5 ---');
        expect(report).toContain('SKIPPED: no google-gemini key');
        expect(report).toContain('UNSAFE (raw): none');
        expect(report).toContain('UNSAFE (end to end): none');
        expect(report).toMatch(/agrees 22 · conservative 0 · unsafe 0 · inconclusive 0/);
      });
      expect(provider.rawUrls).toHaveLength(WIRE_PROBE_FIXTURES.length);
      expect(provider.adapted).toHaveLength(WIRE_PROBE_FIXTURES.length);
      // The key never reaches the log.
      expect(lastLogger.logged.join('\n')).not.toMatch(/\bk\b.*x-api-key|Bearer/);
    });

    test('a pass the provider rejects is unsafe, and fails the run with the report', async () => {
      const provider = fakeProvider({
        rejects: ['multipleOf'],
        adapted: (request) =>
          JSON.stringify(request.schema.toJson()).includes('multipleOf')
            ? fail(`AI streaming API returned 400: ${ANTHROPIC_400}`)
            : undefined
      });
      const result = await runWireProbe(testContext({ ANTHROPIC_API_KEY: 'k' }), provider.deps, [
        wire('anthropic-tools')
      ]);
      expect(result).toFailWith(/UNSAFE \(raw\): anthropic-tools\/multipleOf/);
      expect(result).toFailWith(/UNSAFE \(end to end\): anthropic-tools\/multipleOf/);
      expect(result).toFailWith(
        /multipleOf \(raw\): 400 tools\.0\.custom\.input_schema: multipleOf is not supported/
      );
      expect(result).toFailWith(/1 unsafe row\(s\): anthropic-tools\/multipleOf$/);
    });

    test('a fold the provider would have accepted is conservative; a refusal it rejects agrees', async () => {
      // Gemini: rejects a schema with no type (as its table expects); accepts everything else.
      const provider = fakeProvider({
        rawStatus: (request) =>
          /"parameters":\{\}|"v":\{\}|"items":\{\}/.test(JSON.stringify(request.body))
            ? { status: 400, body: JSON.stringify({ error: { message: 'type is required' } }) }
            : undefined,
        adapted: (request) =>
          JSON.stringify(request.schema.toJson()).match(/"v":\{\}|"items":\{\}|^\{\}$/) !== null
            ? fail("tool 'probe': a schema with no 'type' cannot be sent on this wire (Gemini)")
            : undefined
      });
      const result = await runWireProbe(testContext({ GEMINI_API_KEY: 'g' }), provider.deps, [
        wire('gemini-tools')
      ]);
      expect(result).toSucceedAndSatisfy((report) => {
        expect(report).toMatch(/enum-integer\s+adapt\s+accepted\s+conservative\s+accepted/);
        expect(report).toMatch(/untyped-property\s+refuse\s+rejected\s+agrees\s+refused here/);
        expect(report).toContain(
          'conservative (accepted raw; loosening needs evidence it is enforced): gemini-tools/'
        );
        expect(report).toContain('untyped-root (raw): 400 type is required');
      });
    });

    test('end-to-end mismatches and inconclusive results are reported, not failed', async () => {
      const provider = fakeProvider({
        rawStatus: (request) =>
          JSON.stringify(request.body).includes('"maximum"')
            ? { status: 503, body: 'overloaded' }
            : undefined,
        adapted: (request) =>
          JSON.stringify(request.schema.toJson()).includes('"minimum"')
            ? fail('cannot be sent (test)')
            : JSON.stringify(request.schema.toJson()).includes('"maxLength"')
            ? fail('empty response')
            : undefined
      });
      const result = await runWireProbe(testContext({ ANTHROPIC_API_KEY: 'k' }), provider.deps, [
        wire('anthropic-tools')
      ]);
      expect(result).toSucceedAndSatisfy((report) => {
        expect(report).toMatch(/minimum\s+pass\s+accepted\s+agrees\s+refused here \(MISMATCH\)/);
        expect(report).toMatch(/maximum\s+pass\s+\?\s+inconclusive/);
        expect(report).toMatch(/maxLength\s+pass\s+accepted\s+agrees\s+\? \(INCONCLUSIVE\)/);
        expect(report).toContain('end-to-end mismatches: anthropic-tools/minimum');
        expect(report).toContain('maxLength (end to end): empty response');
        expect(report).toContain('maximum (raw): 503 overloaded');
      });
    });

    test('a rejected control makes the wire inconclusive and stops it', async () => {
      const provider = fakeProvider({
        rawStatus: () => ({ status: 400, body: JSON.stringify({ error: { message: 'model not found' } }) })
      });
      const result = await runWireProbe(testContext({ ANTHROPIC_API_KEY: 'k' }), provider.deps, [
        wire('anthropic-tools')
      ]);
      expect(result).toSucceedAndSatisfy((report) => {
        expect(report).toContain('INCONCLUSIVE: the control fixture was not accepted — 400 model not found');
        expect(report).toMatch(/unsafe 0 · inconclusive 1/);
      });
      expect(provider.rawUrls).toHaveLength(1);
    });

    test('a wire the registry cannot set up is skipped with the reason', async () => {
      const provider = fakeProvider({});
      const noModel: IWireProbeWire = { ...wire('anthropic-tools'), id: 'bad', model: '@anthropic:nope' };
      const noTable: IWireProbeWire = {
        id: 'ollama-output',
        label: 'Ollama structured output',
        providerId: 'ollama',
        model: 'llama3',
        kind: 'structured-output'
      };
      const result = await runWireProbe(testContext({ ANTHROPIC_API_KEY: 'k' }), provider.deps, [
        noModel,
        noTable
      ]);
      expect(result).toSucceedAndSatisfy((report) => {
        expect(report).toMatch(
          /--- Anthropic tools · anthropic · @anthropic:nope ---\n {2}SKIPPED: registry: /
        );
        expect(report).toContain('SKIPPED: registry: llama3 declares no structured-output capability');
        expect(report).toContain('wires probed: 0 · skipped: 2');
      });
      expect(provider.rawUrls).toHaveLength(0);
    });

    test('a fixture fromJson refuses fails the run before anything is sent', async () => {
      const provider = fakeProvider({});
      const bad: IWireProbeFixture = { id: 'bad', row: 'bad', schema: { type: 'number', minimum: 'x' } };
      await expect(
        runWireProbe(testContext({ ANTHROPIC_API_KEY: 'k' }), provider.deps, [wire('anthropic-tools')], [bad])
      ).resolves.toFailWith(/fixture 'bad'/);
      expect(provider.rawUrls).toHaveLength(0);
    });
  });

  describe('report and unsafeRows', () => {
    test('an empty run renders a summary with nothing named', () => {
      const results: IWireProbeWireResult[] = [];
      expect(unsafeRows(results)).toEqual([]);
      expect(formatWireProbeReport(results)).toContain(
        'conservative (accepted raw; loosening needs evidence it is enforced): none'
      );
    });
  });

  describe('scenario', () => {
    test('is CLI-only and lists the four provider keys', () => {
      expect(wireProbeScenario.id).toBe('wire-probe');
      expect(wireProbeScenario.cli?.webRunnable).toBeUndefined();
      expect(wireProbeScenario.requiredSecrets?.map((s) => s.envVarName)).toEqual([
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY',
        'GEMINI_API_KEY',
        'XAI_API_KEY'
      ]);
    });

    test('runWireProbeScenario honours WIRE_PROBE_WIRES', async () => {
      const provider = fakeProvider({});
      await expect(
        runWireProbeScenario(testContext({}), provider.deps, { WIRE_PROBE_WIRES: 'xai-tools' })
      ).resolves.toSucceedAndSatisfy((report) => {
        expect(report).toContain('wires probed: 0 · skipped: 1');
        expect(report).toContain('SKIPPED: no xai-grok key');
      });
      await expect(
        runWireProbeScenario(testContext({}), provider.deps, { WIRE_PROBE_WIRES: 'x' })
      ).resolves.toFailWith(/unknown wire 'x'/);
    });

    test('the CLI entry reads WIRE_PROBE_WIRES from the environment', async () => {
      // An unknown id fails before any live seam is reached.
      const replaced = jest.replaceProperty(process, 'env', {
        ...process.env,
        WIRE_PROBE_WIRES: 'not-a-wire'
      });
      try {
        await expect(wireProbeScenario.cli!.run(testContext({}))).resolves.toFailWith(
          /unknown wire 'not-a-wire'/
        );
      } finally {
        replaced.restore();
      }
    });
  });
});
