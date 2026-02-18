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
import { FileTree, JsonObject } from '@fgv/ts-json-base';
import { CryptoUtils } from '@fgv/ts-extras';

import {
  BaseDecorationId,
  CollectionId,
  DecorationId,
  IngredientId,
  Measurement
} from '../../../../packlets/common';
import { DecorationsLibrary, IDecorationEntity } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { IDecorationFileTreeSource } from '../../../../packlets/entities/decorations/library';

describe('DecorationsLibrary.createAsync', () => {
  const TEST_SECRET_NAME = 'test-secret';
  let testKey: Uint8Array;

  beforeAll(async () => {
    testKey = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
  });

  test('creates library with built-ins by default', async () => {
    const result = await DecorationsLibrary.createAsync();
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('common' as CollectionId)).toBe(true);
      expect(lib.size).toBeGreaterThan(0);
    });
  });

  test('creates library without built-ins when builtin: false', async () => {
    const result = await DecorationsLibrary.createAsync({ builtin: false });
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.size).toBe(0);
      expect(lib.size).toBe(0);
    });
  });

  test('creates library with file sources', async () => {
    const testDecoration: IDecorationEntity = {
      baseId: 'gold-accent' as BaseDecorationId,
      name: 'Gold Leaf Accent',
      ingredients: [
        {
          ingredient: {
            ids: ['common.gold-leaf' as IngredientId],
            preferredId: 'common.gold-leaf' as IngredientId
          },
          amount: 0.1 as Measurement
        }
      ]
    };

    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/decorations/custom.json',
        contents: {
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'gold-accent': testDecoration
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        } as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: IDecorationFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: true
    };

    const result = await DecorationsLibrary.createAsync({
      builtin: false,
      fileSources: fileSource
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('custom' as CollectionId)).toBe(true);
      expect(lib.has('custom.gold-accent' as DecorationId)).toBe(true);
    });
  });

  test('decrypts encrypted file sources with encryption config', async () => {
    const secretDecorationData = {
      /* eslint-disable @typescript-eslint/naming-convention */
      'secret-decoration': {
        baseId: 'secret-decoration',
        name: 'Secret Decoration',
        ingredients: []
      }
      /* eslint-enable @typescript-eslint/naming-convention */
    };

    const encryptedFile = (
      await CryptoUtils.createEncryptedFile({
        content: secretDecorationData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      })
    ).orThrow();

    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/decorations/secret.json',
        contents: encryptedFile as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: IDecorationFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: false
    };

    const result = await DecorationsLibrary.createAsync({
      builtin: false,
      fileSources: fileSource,
      encryption: {
        secrets: [{ name: TEST_SECRET_NAME, key: testKey }],
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      }
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('secret' as CollectionId)).toBe(true);
      expect(lib.has('secret.secret-decoration' as DecorationId)).toBe(true);
    });
  });

  test('skips encrypted files when no encryption config provided', async () => {
    const secretDecorationData = {
      /* eslint-disable @typescript-eslint/naming-convention */
      'secret-decoration': {
        baseId: 'secret-decoration',
        name: 'Secret Decoration',
        ingredients: []
      }
      /* eslint-enable @typescript-eslint/naming-convention */
    };

    const encryptedFile = (
      await CryptoUtils.createEncryptedFile({
        content: secretDecorationData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      })
    ).orThrow();

    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/decorations/secret.json',
        contents: encryptedFile as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: IDecorationFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: false
    };

    const result = await DecorationsLibrary.createAsync({
      builtin: false,
      fileSources: fileSource
    });

    // Without encryption config, encrypted files are skipped
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.size).toBe(0);
    });
  });
});
