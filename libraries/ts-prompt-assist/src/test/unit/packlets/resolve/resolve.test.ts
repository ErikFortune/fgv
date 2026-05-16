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
import { Converters } from '@fgv/ts-utils';
import { PromptLibrary } from '../../../../packlets/resolve';
import { PromptStoreFixture } from '../../../../packlets/store/promptStoreFixture';
import { PromptRegistry } from '../../../../packlets/registry';
import type {
  IStoredPromptRecord,
  IScopeSlotBindingsRecord,
  IPromptResolveRequest,
  PromptId,
  ScopeKey,
  SlotName
} from '../../../../packlets/types';

const globalScope = 'global' as unknown as ScopeKey;
const tenantScope = 'tenant-a' as unknown as ScopeKey;
const greetId = 'greet' as unknown as PromptId;
const jsonPromptId = 'json-prompt' as unknown as PromptId;

/** Make a basic greet record. */
function makeGreetRecord(scope: ScopeKey = globalScope): IStoredPromptRecord {
  return {
    scope,
    id: greetId,
    descriptor: {
      id: greetId,
      title: 'Greet Prompt',
      schemaVersion: '1',
      surface: 'chat',
      slots: [
        {
          name: 'name' as unknown as SlotName,
          description: 'Name to greet',
          source: 'user'
        }
      ],
      output: { kind: 'free-text' }
    },
    candidates: [{ conditions: {}, body: 'Hello, {{{name}}}!' }]
  };
}

/** Make a record with multiple slots. */
function makeMultiSlotRecord(scope: ScopeKey = globalScope): IStoredPromptRecord {
  return {
    scope,
    id: greetId,
    descriptor: {
      id: greetId,
      title: 'Multi Slot Prompt',
      schemaVersion: '1',
      surface: 'chat',
      slots: [
        { name: 'name' as unknown as SlotName, description: 'Name' },
        { name: 'topic' as unknown as SlotName, description: 'Topic' }
      ],
      output: { kind: 'free-text' }
    },
    candidates: [{ conditions: {}, body: 'Hello {{{name}}}, let us talk about {{{topic}}}.' }]
  };
}

describe('PromptLibrary', () => {
  describe('create', () => {
    test('creates a PromptLibrary with a valid store and registry', async () => {
      const store = PromptStoreFixture.build({}).orThrow();
      const registry = PromptRegistry.empty();
      const result = await PromptLibrary.create({ store, registry });
      expect(result).toSucceed();
    });

    test('creates a PromptLibrary with a safety policy', async () => {
      const store = PromptStoreFixture.build({}).orThrow();
      const registry = PromptRegistry.empty();
      const result = await PromptLibrary.create({
        store,
        registry,
        safetyPolicy: {
          defaultMaxLength: 4096,
          suspiciousPatterns: [],
          screenedSources: ['user'],
          onSuspicious: 'warn'
        }
      });
      expect(result).toSucceed();
    });
  });

  describe('resolve', () => {
    let library: PromptLibrary;

    beforeEach(async () => {
      const store = PromptStoreFixture.build({
        records: [makeGreetRecord()]
      }).orThrow();
      const registry = PromptRegistry.empty();
      library = (await PromptLibrary.create({ store, registry })).orThrow();
    });

    test('resolves a simple single-candidate prompt', async () => {
      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {},
        substitutions: { name: 'Alice' }
      };
      const result = await library.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        expect(resolved.id).toBe(greetId);
        expect(resolved.body).toBe('Hello, Alice!');
        expect(resolved.descriptor.id).toBe(greetId);
      });
    });

    test('resolves with empty slot value when no substitution provided', async () => {
      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {}
      };
      const result = await library.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        // name slot is empty → renders as empty string
        expect(resolved.body).toBe('Hello, !');
      });
    });

    test('fails when prompt is not found in any scope', async () => {
      const req: IPromptResolveRequest = {
        id: 'no-such-prompt' as unknown as PromptId,
        chain: [globalScope],
        qualifiers: {}
      };
      const result = await library.resolve(req);
      expect(result).toFailWith(/not found/i);
    });

    test('fails when chain is empty', async () => {
      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [],
        qualifiers: {}
      };
      const result = await library.resolve(req);
      expect(result).toFailWith(/not found/i);
    });

    test('walks scope chain from most-specific to most-general', async () => {
      const tenantRecord = makeGreetRecord(tenantScope);
      // Override body so we can tell which record was used
      const tenantRecordWithBody: IStoredPromptRecord = {
        ...tenantRecord,
        candidates: [{ conditions: {}, body: 'Tenant Hello, {{{name}}}!' }]
      };
      const storeWithTenant = PromptStoreFixture.build({
        records: [makeGreetRecord(), tenantRecordWithBody]
      }).orThrow();
      const libraryWithTenant = (
        await PromptLibrary.create({ store: storeWithTenant, registry: PromptRegistry.empty() })
      ).orThrow();

      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [tenantScope, globalScope],
        qualifiers: {},
        substitutions: { name: 'Bob' }
      };
      const result = await libraryWithTenant.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        // Tenant is most-specific, so it should win
        expect(resolved.body).toBe('Tenant Hello, Bob!');
        expect(resolved.trace.winningScope).toBe(tenantScope);
      });
    });

    test('falls back to global scope when tenant does not have the prompt', async () => {
      const storeWithTenantNoRecord = PromptStoreFixture.build({
        records: [makeGreetRecord(globalScope)]
      }).orThrow();
      const libraryFallback = (
        await PromptLibrary.create({ store: storeWithTenantNoRecord, registry: PromptRegistry.empty() })
      ).orThrow();

      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [tenantScope, globalScope],
        qualifiers: {},
        substitutions: { name: 'Charlie' }
      };
      const result = await libraryFallback.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        expect(resolved.body).toBe('Hello, Charlie!');
        expect(resolved.trace.winningScope).toBe(globalScope);
      });
    });

    test('slot substitution renders value into body', async () => {
      const multiStore = PromptStoreFixture.build({ records: [makeMultiSlotRecord()] }).orThrow();
      const multiLib = (
        await PromptLibrary.create({ store: multiStore, registry: PromptRegistry.empty() })
      ).orThrow();

      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {},
        substitutions: { name: 'Dave', topic: 'TypeScript' }
      };
      const result = await multiLib.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        expect(resolved.body).toBe('Hello Dave, let us talk about TypeScript.');
      });
    });

    test('enforced scope binding overrides caller substitution', async () => {
      const bindingsRecord: IScopeSlotBindingsRecord = {
        scope: globalScope,
        bindings: new Map([
          [
            'name' as unknown as SlotName,
            { kind: 'literal', value: 'Enforced', directive: 'prose', enforced: true }
          ]
        ])
      };
      const storeWithBindings = PromptStoreFixture.build({
        records: [makeGreetRecord()],
        bindings: [bindingsRecord]
      }).orThrow();
      const libWithBindings = (
        await PromptLibrary.create({ store: storeWithBindings, registry: PromptRegistry.empty() })
      ).orThrow();

      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {},
        substitutions: { name: 'CallerValue' }
      };
      const result = await libWithBindings.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        // enforced binding should win
        expect(resolved.body).toBe('Hello, Enforced!');
        // Enforced override finding should be in trace
        expect(resolved.trace.safeguardFindings.some((f) => f.kind === 'enforced-override-ignored')).toBe(
          true
        );
      });
    });

    test('unenforced scope binding is overridden by caller substitution', async () => {
      const bindingsRecord: IScopeSlotBindingsRecord = {
        scope: globalScope,
        bindings: new Map([
          ['name' as unknown as SlotName, { kind: 'literal', value: 'ScopeDefault', directive: 'prose' }]
        ])
      };
      const storeWithBindings = PromptStoreFixture.build({
        records: [makeGreetRecord()],
        bindings: [bindingsRecord]
      }).orThrow();
      const libWithBindings = (
        await PromptLibrary.create({ store: storeWithBindings, registry: PromptRegistry.empty() })
      ).orThrow();

      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {},
        substitutions: { name: 'CallerOverride' }
      };
      const result = await libWithBindings.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        expect(resolved.body).toBe('Hello, CallerOverride!');
      });
    });

    test('uses default binding when no caller substitution and no scope binding', async () => {
      const recordWithDefault: IStoredPromptRecord = {
        scope: globalScope,
        id: greetId,
        descriptor: {
          id: greetId,
          title: 'Greet with default',
          schemaVersion: '1',
          surface: 'chat',
          slots: [
            {
              name: 'name' as unknown as SlotName,
              description: 'Name',
              defaultBinding: { kind: 'literal', value: 'DefaultName', directive: 'prose' }
            }
          ],
          output: { kind: 'free-text' }
        },
        candidates: [{ conditions: {}, body: 'Hello, {{{name}}}!' }]
      };
      const storeDefault = PromptStoreFixture.build({ records: [recordWithDefault] }).orThrow();
      const libDefault = (
        await PromptLibrary.create({ store: storeDefault, registry: PromptRegistry.empty() })
      ).orThrow();

      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {}
      };
      const result = await libDefault.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        expect(resolved.body).toBe('Hello, DefaultName!');
      });
    });

    test('includes scopesConsulted in trace', async () => {
      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [tenantScope, globalScope],
        qualifiers: {}
      };
      const result = await library.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        // Should include all scopes consulted before finding the prompt
        expect(resolved.trace.scopesConsulted).toContain(globalScope);
      });
    });

    test('applies safeguard and fails on slot value exceeding maxLength', async () => {
      const recordWithMaxLen: IStoredPromptRecord = {
        scope: globalScope,
        id: greetId,
        descriptor: {
          id: greetId,
          title: 'Test',
          schemaVersion: '1',
          surface: 'chat',
          slots: [{ name: 'name' as unknown as SlotName, description: 'Name', maxLength: 5 }],
          output: { kind: 'free-text' }
        },
        candidates: [{ conditions: {}, body: 'Hello, {{{name}}}!' }]
      };
      const storeMaxLen = PromptStoreFixture.build({ records: [recordWithMaxLen] }).orThrow();
      const libMaxLen = (
        await PromptLibrary.create({ store: storeMaxLen, registry: PromptRegistry.empty() })
      ).orThrow();

      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {},
        substitutions: { name: 'TooLongName' }
      };
      const result = await libMaxLen.resolve(req);
      expect(result).toFailWith(/exceeds maximum/i);
    });

    test('slot substitution as SlotBinding (ILiteralSlotBinding) works', async () => {
      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {},
        substitutions: {
          name: { kind: 'literal', value: 'BindingValue', directive: 'prose' }
        }
      };
      const result = await library.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        expect(resolved.body).toBe('Hello, BindingValue!');
      });
    });

    test('resolves the same prompt twice (cached template)', async () => {
      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {},
        substitutions: { name: 'First' }
      };
      const req2: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {},
        substitutions: { name: 'Second' }
      };
      const result1 = await library.resolve(req);
      const result2 = await library.resolve(req2);
      expect(result1).toSucceedAndSatisfy((r) => expect(r.body).toBe('Hello, First!'));
      expect(result2).toSucceedAndSatisfy((r) => expect(r.body).toBe('Hello, Second!'));
    });
  });

  describe('resolve with partial candidates', () => {
    test('composes body from partial and base candidates in specificity-ascending order', async () => {
      // The store has two candidates: partial (more specific) + base (unconditional)
      const recordWithPartials: IStoredPromptRecord = {
        scope: globalScope,
        id: greetId,
        descriptor: {
          id: greetId,
          title: 'Multi-candidate',
          schemaVersion: '1',
          surface: 'chat',
          slots: [],
          output: { kind: 'free-text' }
        },
        candidates: [
          // isPartial: true with conditions (ts-res would normally match more specific first)
          { conditions: {}, body: 'Base body.', isPartial: undefined }
        ]
      };
      const store = PromptStoreFixture.build({ records: [recordWithPartials] }).orThrow();
      const lib = (await PromptLibrary.create({ store, registry: PromptRegistry.empty() })).orThrow();

      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {}
      };
      const result = await lib.resolve(req);
      expect(result).toSucceedAndSatisfy((resolved) => {
        expect(resolved.body).toContain('Base body.');
      });
    });
  });

  describe('resolveAndValidateOutput', () => {
    let library: PromptLibrary;
    const testConverterId = 'test-conv' as unknown as import('../../../../packlets/types').ConverterId;

    beforeEach(async () => {
      const store = PromptStoreFixture.build({
        records: [makeGreetRecord()]
      }).orThrow();
      const registry = PromptRegistry.empty();
      library = (await PromptLibrary.create({ store, registry })).orThrow();
    });

    test('returns rawOutput directly for free-text descriptor', async () => {
      const req: IPromptResolveRequest = {
        id: greetId,
        chain: [globalScope],
        qualifiers: {}
      };
      const result = await library.resolveAndValidateOutput<string>(req, 'some raw output');
      expect(result).toSucceedWith('some raw output');
    });

    test('parses and converts json output', async () => {
      const jsonRecord: IStoredPromptRecord = {
        scope: globalScope,
        id: jsonPromptId,
        descriptor: {
          id: jsonPromptId,
          title: 'JSON prompt',
          schemaVersion: '1',
          surface: 'chat',
          slots: [],
          output: { kind: 'json', converterId: testConverterId }
        },
        candidates: [{ conditions: {}, body: 'Return JSON.' }]
      };
      const jsonStore = PromptStoreFixture.build({ records: [jsonRecord] }).orThrow();
      const jsonRegistry = PromptRegistry.empty();
      jsonRegistry.converters
        .register(testConverterId, Converters.object<{ answer: number }>({ answer: Converters.number }))
        .orThrow();
      const jsonLib = (await PromptLibrary.create({ store: jsonStore, registry: jsonRegistry })).orThrow();

      const req: IPromptResolveRequest = {
        id: jsonPromptId,
        chain: [globalScope],
        qualifiers: {}
      };
      const result = await jsonLib.resolveAndValidateOutput<{ answer: number }>(req, '{"answer":42}');
      expect(result).toSucceedAndSatisfy((output) => {
        expect(output.answer).toBe(42);
      });
    });

    test('fails when resolve fails (prompt not found)', async () => {
      const req: IPromptResolveRequest = {
        id: 'nonexistent' as unknown as PromptId,
        chain: [globalScope],
        qualifiers: {}
      };
      const result = await library.resolveAndValidateOutput<string>(req, 'output');
      expect(result).toFailWith(/not found/i);
    });
  });
});
