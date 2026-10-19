/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  FileTreeMemoryStore,
  IIdentityCodec,
  IIdentityResolver,
  Kind,
  KnowledgeIdentityCodec
} from '../../index';

/** The knowledge kind every flat-record retriever fixture uses. */
const knowledgeKind: Kind = 'knowledge' as Kind;

/**
 * A real `IIdentityResolver` — an empty in-memory `FileTreeMemoryStore` over the
 * given codecs — for suites whose records are synthetic index fixtures rather
 * than store-loaded.
 *
 * @remarks
 * A store rather than a hand-written `resolveIdentity`, so the resolution the
 * merge is tested against is the store's own and cannot drift from it. Defaults to
 * the knowledge codec, which is what the flat fixtures (`entityId === id` under the
 * `knowledge` scope) are addressed by.
 */
export function storeIdentityResolver(
  codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
    [knowledgeKind, new KnowledgeIdentityCodec()]
  ])
): IIdentityResolver {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  const registry = BodyConverterRegistry.create().orThrow();
  for (const kind of codecs.keys()) {
    registry.register(kind, Converters.string);
  }
  return FileTreeMemoryStore.create({ root, registry, codecs }).orThrow();
}
