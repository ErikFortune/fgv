// Copyright (c) 2026 Erik Fortune
// SPDX-License-Identifier: MIT

import '@fgv/ts-utils-jest';
import * as path from 'path';
import { FileTreePromptStore, PromptId, ScopeKey, SlotName } from '../../index';
import { FileTree } from '@fgv/ts-json-base';

const GLOBAL_SCOPE = 'global' as unknown as ScopeKey;
const GREETING = 'greeting' as unknown as PromptId;

const FIXTURE_ROOT = path.resolve(__dirname, '../../../../../data/test/ts-prompt-assist/basic');

describe('FileTreePromptStore over FsTree (B-3 smoke test)', () => {
  async function buildDiskStore(): Promise<FileTreePromptStore> {
    const tree = FileTree.forFilesystem().orThrow();
    const root = tree.getDirectory(FIXTURE_ROOT).orThrow();
    return (await FileTreePromptStore.create({ root })).orThrow();
  }

  test('get loads a YAML descriptor from disk', async () => {
    const store = await buildDiskStore();
    expect(await store.get(GLOBAL_SCOPE, GREETING)).toSucceedAndSatisfy((record) => {
      expect(record).toBeDefined();
      expect(record?.descriptor.id).toBe(GREETING);
      expect(record?.descriptor.title).toBe('Greeting');
      expect(record?.candidates).toHaveLength(1);
      expect(record?.candidates[0].body).toBe('Hello, {{{audience}}}!');
    });
  });

  test('list enumerates prompt files (skipping underscore-prefixed)', async () => {
    const store = await buildDiskStore();
    expect(await store.list()).toSucceedAndSatisfy((records) => {
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe(GREETING);
      expect(records[0].scope).toBe(GLOBAL_SCOPE);
    });
  });

  test('getBindings loads scope-level _bindings.yaml from disk', async () => {
    const store = await buildDiskStore();
    expect(await store.getBindings(GLOBAL_SCOPE)).toSucceedAndSatisfy((record) => {
      expect(record).toBeDefined();
      expect(record?.bindings.size).toBe(1);
      const binding = record?.bindings.get('audience' as unknown as SlotName);
      expect(binding?.kind).toBe('literal');
    });
  });

  test('getQualifierConfig loads root-level _qualifiers.yaml from disk', async () => {
    const store = await buildDiskStore();
    expect(await store.getQualifierConfig()).toSucceedAndSatisfy((decls) => {
      expect(decls).toHaveLength(1);
      expect(decls?.[0].name).toBe('lang');
      // `typeName` MUST match what the README's wiring sample constructs
      // (a `LiteralQualifierType` named `lang`); regression-protect the
      // fixture so a future edit can't drift it back to `language`.
      expect(decls?.[0].typeName).toBe('lang');
    });
  });
});

describe('FileTreePromptStore filename-id consistency (B-3)', () => {
  // Use in-memory FileTree so we can author a deliberate mismatch.
  async function buildStoreFromYaml(filePath: string, yaml: string): Promise<FileTreePromptStore> {
    const tree = FileTree.inMemory([{ path: filePath, contents: yaml }]).orThrow();
    const root = tree.getDirectory('/').orThrow();
    return (await FileTreePromptStore.create({ root })).orThrow();
  }

  const validYaml = `
id: greeting
title: Greeting
schemaVersion: '1'
surface: chat
slots: []
output:
  kind: free-text
candidates:
  - conditions: {}
    body: 'Hello!'
`;

  const mismatchYaml = `
id: farewell
title: Mismatch
schemaVersion: '1'
surface: chat
slots: []
output:
  kind: free-text
candidates:
  - conditions: {}
    body: 'Hello!'
`;

  test('get rejects a file whose descriptor.id differs from the filename stem', async () => {
    const store = await buildStoreFromYaml(`/${GLOBAL_SCOPE}/greeting.yaml`, mismatchYaml);
    const result = await store.get(GLOBAL_SCOPE, GREETING);
    expect(result).toFailWith(/descriptor\.id 'farewell' does not match filename stem 'greeting'/);
    expect(result).toFailWith(/greeting\.yaml/);
  });

  test('list rejects a file whose descriptor.id differs from the filename stem', async () => {
    const store = await buildStoreFromYaml(`/${GLOBAL_SCOPE}/greeting.yaml`, mismatchYaml);
    expect(await store.list()).toFailWith(
      /descriptor\.id 'farewell' does not match filename stem 'greeting'/
    );
  });

  test('get succeeds when descriptor.id matches the filename stem', async () => {
    const store = await buildStoreFromYaml(`/${GLOBAL_SCOPE}/greeting.yaml`, validYaml);
    expect(await store.get(GLOBAL_SCOPE, GREETING)).toSucceedAndSatisfy((record) => {
      expect(record?.id).toBe(GREETING);
    });
  });
});
