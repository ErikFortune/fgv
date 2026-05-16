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

import { Result } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  IQualifierDecl,
  IScopeSlotBindingsRecord,
  IStoredPromptRecord,
  SlotBinding,
  SlotName
} from '../types';
import { FileTreePromptStore } from './fileTreePromptStore';

/**
 * Seed data for building an in-memory prompt store fixture.
 * @public
 */
export interface IPromptStoreFixtureSeed {
  /** Prompt records to include. */
  readonly records?: ReadonlyArray<IStoredPromptRecord>;
  /** Scope-level bindings to include. */
  readonly bindings?: ReadonlyArray<IScopeSlotBindingsRecord>;
  /** Root-level qualifier configuration. */
  readonly qualifiers?: ReadonlyArray<IQualifierDecl>;
}

function mapToObject<V>(map: ReadonlyMap<SlotName, V>): Record<string, V> {
  const obj: Record<string, V> = {};
  for (const [key, value] of map) {
    obj[key as string] = value;
  }
  return obj;
}

function bindingToPlain(binding: SlotBinding): Record<string, unknown> {
  if (binding.kind === 'literal') {
    return {
      kind: binding.kind,
      value: binding.value,
      directive: binding.directive,
      ...(binding.enforced !== undefined ? { enforced: binding.enforced } : {})
    };
  }
  return {
    kind: binding.kind,
    resourceId: binding.resourceId as string,
    directive: binding.directive,
    ...(binding.qualifiers !== undefined ? { qualifiers: binding.qualifiers } : {}),
    ...(binding.scopeOverride !== undefined ? { scopeOverride: binding.scopeOverride } : {}),
    ...(binding.substitutions !== undefined ? { substitutions: binding.substitutions } : {}),
    ...(binding.enforced !== undefined ? { enforced: binding.enforced } : {})
  };
}

/**
 * Helper for building in-memory prompt store fixtures for testing.
 * Uses `FileTreePromptStore` over an in-memory `FileTree`.
 * @public
 */
export class PromptStoreFixture {
  /**
   * Builds a {@link FileTreePromptStore} from seed data.
   * Serializes records to JSON (valid YAML) and populates an in-memory `FileTree`.
   * @param seed - The fixture seed.
   * @returns `Success` with the store, or `Failure` with an error message.
   */
  public static build(seed: IPromptStoreFixtureSeed): Result<FileTreePromptStore> {
    const files: FileTree.IInMemoryFile[] = [];

    for (const record of seed.records ?? []) {
      const { scope, id, descriptor, candidates } = record;
      const fileObject = {
        ...descriptor,
        candidates: candidates.map((c) => ({
          conditions: c.conditions,
          ...(c.isPartial !== undefined ? { isPartial: c.isPartial } : {}),
          body: c.body
        }))
      };
      files.push({
        path: `${scope as string}/${id as string}.yaml`,
        contents: fileObject as FileTree.IInMemoryFile['contents']
      });
    }

    for (const bindingsRecord of seed.bindings ?? []) {
      const { scope, bindings } = bindingsRecord;
      const plainBindings = mapToObject(
        new Map(
          Array.from(bindings.entries()).map(
            ([k, v]) => [k, bindingToPlain(v)] as [SlotName, Record<string, unknown>]
          )
        ) as ReadonlyMap<SlotName, Record<string, unknown>>
      );
      files.push({
        path: `${scope as string}/_bindings.yaml`,
        contents: { bindings: plainBindings }
      });
    }

    if (seed.qualifiers !== undefined && seed.qualifiers.length > 0) {
      files.push({ path: '_qualifiers.yaml', contents: { qualifiers: seed.qualifiers } });
    }

    return FileTree.inMemory(files)
      .withErrorFormat((msg) => `PromptStoreFixture.build: ${msg}`)
      .onSuccess((root) =>
        FileTreePromptStore.create({ root }).withErrorFormat((msg) => `PromptStoreFixture.build: ${msg}`)
      );
  }
}
