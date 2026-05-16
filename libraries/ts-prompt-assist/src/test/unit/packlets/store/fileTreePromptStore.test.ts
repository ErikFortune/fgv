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
import { Logging, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { PromptStoreFixture } from '../../../../packlets/store/promptStoreFixture';
import { FileTreePromptStore } from '../../../../packlets/store/fileTreePromptStore';
import type {
  IStoredPromptRecord,
  IScopeSlotBindingsRecord,
  IQualifierDecl,
  PromptId,
  ScopeKey,
  SlotName
} from '../../../../packlets/types';

const globalScope = 'global' as unknown as ScopeKey;
const tenantScope = 'tenant-a' as unknown as ScopeKey;
const greetId = 'greet' as unknown as PromptId;
const summarizeId = 'summarize' as unknown as PromptId;

/** Build a minimal IStoredPromptRecord for seeding. */
function makeRecord(scope: ScopeKey, id: PromptId, bodyOverride?: string): IStoredPromptRecord {
  return {
    scope,
    id,
    descriptor: {
      id,
      title: `Prompt ${id as string}`,
      schemaVersion: '1',
      surface: 'chat',
      slots: [
        {
          name: 'name' as unknown as SlotName,
          description: 'The name slot'
        }
      ],
      output: { kind: 'free-text' }
    },
    candidates: [{ conditions: {}, body: bodyOverride ?? `Hello from ${id as string}, {{{name}}}!` }]
  };
}

describe('FileTreePromptStore via PromptStoreFixture', () => {
  describe('PromptStoreFixture.build', () => {
    test('builds a store from empty seed', () => {
      expect(PromptStoreFixture.build({})).toSucceed();
    });

    test('builds a store with records', () => {
      const seed = {
        records: [makeRecord(globalScope, greetId)]
      };
      expect(PromptStoreFixture.build(seed)).toSucceed();
    });

    test('builds a store with bindings', () => {
      const bindingsRecord: IScopeSlotBindingsRecord = {
        scope: globalScope,
        bindings: new Map([
          ['name' as unknown as SlotName, { kind: 'literal', value: 'World', directive: 'prose' }]
        ])
      };
      const seed = { bindings: [bindingsRecord] };
      expect(PromptStoreFixture.build(seed)).toSucceed();
    });

    test('builds a store with qualifier config', () => {
      const qualifiers: IQualifierDecl[] = [{ name: 'language', typeName: 'language', defaultPriority: 1 }];
      const seed = { qualifiers };
      expect(PromptStoreFixture.build(seed)).toSucceed();
    });

    test('builds a store with resource bindings', () => {
      const bindingsRecord: IScopeSlotBindingsRecord = {
        scope: globalScope,
        bindings: new Map([
          [
            'name' as unknown as SlotName,
            {
              kind: 'resource',
              resourceId: 'res-1' as unknown as import('../../../../packlets/types').ResourceId,
              directive: 'prose'
            }
          ]
        ])
      };
      const seed = { bindings: [bindingsRecord] };
      expect(PromptStoreFixture.build(seed)).toSucceed();
    });

    test('builds a store with resource bindings including optional fields', () => {
      const bindingsRecord: IScopeSlotBindingsRecord = {
        scope: globalScope,
        bindings: new Map([
          [
            'name' as unknown as SlotName,
            {
              kind: 'resource',
              resourceId: 'res-1' as unknown as import('../../../../packlets/types').ResourceId,
              directive: 'prose',
              qualifiers: { language: 'en' },
              scopeOverride: [globalScope],
              substitutions: { key: 'value' },
              enforced: true
            }
          ]
        ])
      };
      const seed = { bindings: [bindingsRecord] };
      expect(PromptStoreFixture.build(seed)).toSucceed();
    });
  });

  describe('get(scope, id)', () => {
    let store: FileTreePromptStore;

    beforeEach(() => {
      store = PromptStoreFixture.build({
        records: [makeRecord(globalScope, greetId), makeRecord(tenantScope, summarizeId)]
      }).orThrow();
    });

    test('returns the record when it exists', async () => {
      const result = await store.get(globalScope, greetId);
      expect(result).toSucceedAndSatisfy((record) => {
        expect(record).toBeDefined();
        expect(record!.id).toBe(greetId);
        expect(record!.scope).toBe(globalScope);
      });
    });

    test('returns undefined when record does not exist in scope', async () => {
      const result = await store.get(globalScope, summarizeId);
      expect(result).toSucceedWith(undefined);
    });

    test('returns undefined when scope does not exist', async () => {
      const unknownScope = 'unknown-scope' as unknown as ScopeKey;
      const result = await store.get(unknownScope, greetId);
      expect(result).toSucceedWith(undefined);
    });

    test('finds record in second scope', async () => {
      const result = await store.get(tenantScope, summarizeId);
      expect(result).toSucceedAndSatisfy((record) => {
        expect(record).toBeDefined();
        expect(record!.scope).toBe(tenantScope);
      });
    });
  });

  describe('getBindings(scope)', () => {
    let store: FileTreePromptStore;

    beforeEach(() => {
      const bindingsRecord: IScopeSlotBindingsRecord = {
        scope: globalScope,
        bindings: new Map([
          ['name' as unknown as SlotName, { kind: 'literal', value: 'World', directive: 'prose' }]
        ])
      };
      store = PromptStoreFixture.build({
        records: [makeRecord(globalScope, greetId)],
        bindings: [bindingsRecord]
      }).orThrow();
    });

    test('returns bindings when present', async () => {
      const result = await store.getBindings(globalScope);
      expect(result).toSucceedAndSatisfy((record) => {
        expect(record).toBeDefined();
        expect(record!.scope).toBe(globalScope);
        expect(record!.bindings.size).toBe(1);
      });
    });

    test('returns undefined when no bindings file for scope', async () => {
      const result = await store.getBindings(tenantScope);
      expect(result).toSucceedWith(undefined);
    });

    test('returns undefined for unknown scope', async () => {
      const unknownScope = 'no-such-scope' as unknown as ScopeKey;
      const result = await store.getBindings(unknownScope);
      expect(result).toSucceedWith(undefined);
    });
  });

  describe('getQualifierConfig()', () => {
    test('returns qualifier decls when present', async () => {
      const qualifiers: IQualifierDecl[] = [
        { name: 'language', typeName: 'language', defaultPriority: 1 },
        { name: 'region', typeName: 'region', defaultPriority: 2 }
      ];
      const store = PromptStoreFixture.build({ qualifiers }).orThrow();
      const result = await store.getQualifierConfig();
      expect(result).toSucceedAndSatisfy((decls) => {
        expect(decls).toBeDefined();
        expect(decls!).toHaveLength(2);
        expect(decls![0].name).toBe('language');
      });
    });

    test('returns undefined when no qualifier config', async () => {
      const store = PromptStoreFixture.build({}).orThrow();
      const result = await store.getQualifierConfig();
      expect(result).toSucceedWith(undefined);
    });
  });

  describe('list(filter?)', () => {
    let store: FileTreePromptStore;

    beforeEach(() => {
      store = PromptStoreFixture.build({
        records: [
          makeRecord(globalScope, greetId),
          makeRecord(globalScope, summarizeId),
          makeRecord(tenantScope, greetId)
        ]
      }).orThrow();
    });

    test('returns all records when no filter', async () => {
      const result = await store.list();
      expect(result).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(3);
      });
    });

    test('filters by scope', async () => {
      const result = await store.list({ scope: globalScope });
      expect(result).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(2);
        expect(records.every((r) => r.scope === globalScope)).toBe(true);
      });
    });

    test('filters by id', async () => {
      const result = await store.list({ id: greetId });
      expect(result).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(2);
        expect(records.every((r) => r.id === greetId)).toBe(true);
      });
    });

    test('filters by both scope and id', async () => {
      const result = await store.list({ scope: globalScope, id: greetId });
      expect(result).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(1);
        expect(records[0].scope).toBe(globalScope);
        expect(records[0].id).toBe(greetId);
      });
    });

    test('returns empty array when filter matches nothing', async () => {
      const unknownScope = 'no-match-scope' as unknown as ScopeKey;
      const result = await store.list({ scope: unknownScope });
      expect(result).toSucceedWith([]);
    });

    test('returns empty list for empty store', async () => {
      const emptyStore = PromptStoreFixture.build({}).orThrow();
      const result = await emptyStore.list();
      expect(result).toSucceedWith([]);
    });
  });

  describe('custom scope encoding/decoding', () => {
    test('create succeeds with custom encoding/decoding functions', () => {
      const root = FileTree.inMemory([]).orThrow();
      const result = FileTreePromptStore.create({
        root,
        scopeEncoding: (scope) => succeed(`prefix-${scope as string}`),
        scopeDecoding: (encoded) => succeed(encoded.replace('prefix-', '') as unknown as ScopeKey)
      });
      expect(result).toSucceed();
    });
  });

  describe('validateDefaultScopeEncoding (via list)', () => {
    test('silently skips directory with backslash in name (path separator check)', async () => {
      // A directory named 'back\slash' contains a backslash, failing the path separator check
      // (lines 84-85 of fileTreePromptStore.ts)
      const root = FileTree.inMemory([{ path: 'back\\slash/prompt.yaml', contents: { id: 'x' } }]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.list();
      expect(result).toSucceedWith([]);
    });

    test('silently skips directory starting with a dot', async () => {
      // A directory named '.hidden' starts with '.', failing the dot-prefix check
      // (lines 87-88 of fileTreePromptStore.ts)
      const root = FileTree.inMemory([{ path: '.hidden/prompt.yaml', contents: { id: 'x' } }]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.list();
      expect(result).toSucceedWith([]);
    });

    test('silently skips directory whose name contains a colon', async () => {
      // A directory named 'scope:v1' contains a colon, failing the colon check
      // (lines 90-91 of fileTreePromptStore.ts)
      const root = FileTree.inMemory([{ path: 'scope:v1/prompt.yaml', contents: { id: 'x' } }]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.list();
      expect(result).toSucceedWith([]);
    });

    test('silently skips directory with non-POSIX characters in name', async () => {
      // A directory named 'has space' fails the POSIX portable character check
      // (lines 93-94 of fileTreePromptStore.ts)
      const root = FileTree.inMemory([{ path: 'has space/prompt.yaml', contents: { id: 'x' } }]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.list();
      expect(result).toSucceedWith([]);
    });

    test('silently skips directory with Windows reserved name', async () => {
      // A directory named 'CON' is a Windows reserved name, failing the reserved-name check
      // (lines 96-97 of fileTreePromptStore.ts)
      const root = FileTree.inMemory([{ path: 'CON/prompt.yaml', contents: { id: 'x' } }]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.list();
      expect(result).toSucceedWith([]);
    });
  });

  describe('get() error paths', () => {
    test('fails when file raw contents cannot be serialized (circular reference)', async () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;
      const root = FileTree.inMemory([{ path: 'global/greet.yaml', contents: circular }]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.get(globalScope, greetId);
      expect(result).toFail();
    });

    test('fails when default scope encoding rejects the scope (path traversal)', async () => {
      const root = FileTree.inMemory([]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.get('../traversal' as unknown as ScopeKey, greetId);
      expect(result).toFailWith(/scope/i);
    });
  });

  describe('getBindings() error paths', () => {
    test('fails when bindings file raw contents cannot be serialized (circular reference)', async () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;
      const root = FileTree.inMemory([{ path: 'global/_bindings.yaml', contents: circular }]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.getBindings(globalScope);
      expect(result).toFail();
    });

    test('fails when default scope encoding rejects the scope (path traversal)', async () => {
      const root = FileTree.inMemory([]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.getBindings('../traversal' as unknown as ScopeKey);
      expect(result).toFailWith(/scope/i);
    });
  });

  describe('getQualifierConfig() error paths', () => {
    test('fails when qualifier config raw contents cannot be serialized (circular reference)', async () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;
      const root = FileTree.inMemory([{ path: '_qualifiers.yaml', contents: circular }]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.getQualifierConfig();
      expect(result).toFail();
    });
  });

  describe('list() with logger', () => {
    test('skips and logs a warning when a record file has invalid content', async () => {
      const logger = new Logging.InMemoryLogger('warning');

      // Create a store with a file that parses as YAML (via JSON.stringify producing valid YAML text)
      // but fails the stored prompt record converter (missing required fields)
      const root = FileTree.inMemory([
        {
          path: 'global/badprompt.yaml',
          // This serializes to '{"notAPrompt":true}' which is valid JSON/YAML but invalid prompt record
          contents: { notAPrompt: true }
        }
      ]).orThrow();
      const store = FileTreePromptStore.create({ root, logger }).orThrow();
      const result = await store.list();
      expect(result).toSucceed();
      expect(logger.logged).toHaveLength(1);
      expect(logger.logged[0]).toMatch(/skipping/i);
    });

    test('silently skips invalid record without logging when no logger is provided', async () => {
      // Tests the optional-chain `this._logger?.warn` when logger is undefined
      const root = FileTree.inMemory([
        {
          path: 'global/badprompt.yaml',
          contents: { notAPrompt: true }
        }
      ]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.list();
      // Should succeed with empty results (bad record skipped silently)
      expect(result).toSucceedWith([]);
    });
  });

  describe('list() branch coverage for file/directory types', () => {
    test('skips non-directory entries at root level (e.g., _qualifiers.yaml)', async () => {
      // Having a root-level file causes list() to hit the `child.type !== 'directory' continue` branch
      const qualifiers = [{ name: 'language', typeName: 'language', defaultPriority: 1 }];
      const store = PromptStoreFixture.build({
        records: [makeRecord(globalScope, greetId)],
        qualifiers
      }).orThrow();
      // _qualifiers.yaml is a root-level file; list() should skip it and return only the record
      const result = await store.list();
      expect(result).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(1);
      });
    });

    test('skips non-file entries inside scope directories (e.g., nested subdirectory)', async () => {
      // Having a subdirectory inside a scope dir causes `file.type !== 'file' continue` branch
      const root = FileTree.inMemory([
        {
          path: 'global/greet.yaml',
          contents: makeRecord(globalScope, greetId) as unknown as Record<string, unknown>
        },
        { path: 'global/nested/something.yaml', contents: {} }
      ]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.list();
      // 'nested' is a sub-directory inside 'global', so it should be skipped
      expect(result).toSucceed();
    });

    test('skips non-yaml files inside scope directories', async () => {
      // A file without .yaml extension causes the `!file.name.endsWith('.yaml') continue` branch.
      // Build a base store with a valid record, then add a non-yaml file via a custom FileTree.
      const baseRecord = makeRecord(globalScope, greetId);
      const descriptor = baseRecord.descriptor;
      const candidatesPlain = baseRecord.candidates.map((c) => ({ conditions: c.conditions, body: c.body }));
      const fileContent = { ...descriptor, candidates: candidatesPlain };
      const root = FileTree.inMemory([
        { path: 'global/greet.yaml', contents: fileContent },
        { path: 'global/readme.txt', contents: 'This is a readme' }
      ]).orThrow();
      const store = FileTreePromptStore.create({ root }).orThrow();
      const result = await store.list();
      expect(result).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(1);
      });
    });

    test('skips reserved stem files inside scope directories', async () => {
      // Files named _bindings.yaml or _qualifiers.yaml are in RESERVED_STEMS and should be skipped
      const bindingsRecord: IScopeSlotBindingsRecord = {
        scope: globalScope,
        bindings: new Map([
          ['name' as unknown as SlotName, { kind: 'literal', value: 'World', directive: 'prose' }]
        ])
      };
      const store = PromptStoreFixture.build({
        records: [makeRecord(globalScope, greetId)],
        bindings: [bindingsRecord]
      }).orThrow();
      const result = await store.list();
      // _bindings.yaml should be skipped; only greet.yaml should be returned
      expect(result).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(1);
        expect(records[0].id).toBe(greetId);
      });
    });
  });

  describe('promptStoreFixture isPartial branch', () => {
    test('builds a store with isPartial set on a candidate', () => {
      const record: IStoredPromptRecord = {
        scope: globalScope,
        id: greetId,
        descriptor: {
          id: greetId,
          title: 'Greeting',
          schemaVersion: '1',
          surface: 'chat',
          slots: [],
          output: { kind: 'free-text' }
        },
        candidates: [
          { conditions: {}, body: 'Base', isPartial: true },
          { conditions: {}, body: 'Full' }
        ]
      };
      expect(PromptStoreFixture.build({ records: [record] })).toSucceed();
    });
  });
});
