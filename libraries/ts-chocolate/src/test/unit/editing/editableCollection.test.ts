// Copyright (c) 2024 Erik Fortune
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
import { Converters, Result, succeed } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';
import { FileTree } from '@fgv/ts-json-base';
import { CollectionId } from '../../../index';
import { EditableCollection } from '../../../packlets/editing';

interface IMockMutableFileItemOptions {
  name?: string;
  getIsMutable?: () => Result<boolean>;
  setRawContents?: (content: string) => Result<undefined>;
}

function createMockMutableFileItem(options?: IMockMutableFileItemOptions): FileTree.IMutableFileTreeFileItem {
  return {
    type: 'file' as const,
    absolutePath: `/${options?.name ?? 'test'}`,
    name: options?.name ?? 'test',
    baseName: options?.name ?? 'test',
    extension: '.yaml',
    contentType: undefined,
    getContents: () => succeed({}),
    getRawContents: () => succeed(''),
    getIsMutable: options?.getIsMutable ?? (() => succeed(true)),
    setContents: () => succeed(undefined),
    setRawContents: options?.setRawContents ?? ((_content: string) => succeed(undefined)),
    delete: () => succeed(true)
  } as unknown as FileTree.IMutableFileTreeFileItem;
}

const TEST_SOURCE_ID = 'test' as CollectionId;
const testKeyConverter = Converters.string;
const testValueConverter = Converters.object<TestItem>({
  name: Converters.string,
  value: Converters.number
});

interface TestItem {
  name: string;
  value: number;
}

describe('EditableCollection', () => {
  const testMetadata = {
    name: 'Test Collection',
    description: 'A test collection'
  };

  // ==========================================================================
  // Factory method (create)
  // ==========================================================================

  describe('create', () => {
    test('should create collection with correct properties', () => {
      const items = new Map([['item1', { name: 'Item 1', value: 10 }]]);
      expect(
        EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          initialItems: items,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.collectionId).toBe('test');
        expect(collection.isMutable).toBe(true);
        expect(collection.size).toBe(1);
      });
    });

    test('should fail without collection ID', () => {
      expect(
        EditableCollection.createEditable<TestItem>({
          collectionId: '' as CollectionId,
          metadata: testMetadata,
          isMutable: true,
          initialItems: new Map(),
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFailWith(/collection id is required/i);
    });

    test('should create collection with custom valueConverter', () => {
      const customConverter = Converters.object<TestItem>({
        name: Converters.string,
        value: Converters.number
      });
      expect(
        EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          initialItems: new Map(),
          keyConverter: testKeyConverter,
          valueConverter: customConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.collectionId).toBe('test');
      });
    });

    test('should create collection with custom keyConverter', () => {
      const customKeyConverter = Converters.string.withConstraint((s) => s.length > 0 && s.length <= 50, {
        description: 'must be 1-50 characters'
      });
      expect(
        EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          initialItems: new Map(),
          keyConverter: customKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.collectionId).toBe('test');
      });
    });
  });

  // ==========================================================================
  // Metadata (new functionality)
  // ==========================================================================

  describe('metadata', () => {
    test('should return metadata copy', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      const metadata1 = collection.metadata;
      const metadata2 = collection.metadata;

      expect(metadata1).toEqual(testMetadata);
      expect(metadata1).not.toBe(metadata2); // Different object instances
    });
  });

  describe('updateMetadata', () => {
    test('should update metadata in mutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.updateMetadata({ name: 'Updated Name' })).toSucceed();
      expect(collection.metadata.name).toBe('Updated Name');
      expect(collection.metadata.description).toBe('A test collection'); // Preserved
    });

    test('should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.updateMetadata({ name: 'New' })).toFailWith(/immutable.*cannot be modified/i);
    });
  });

  // ==========================================================================
  // Export (new functionality)
  // ==========================================================================

  describe('export', () => {
    test('should export collection to ICollectionSourceFile format', () => {
      const items = new Map([
        ['item1', { name: 'Item 1', value: 10 }],
        ['item2', { name: 'Item 2', value: 20 }]
      ]);

      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: items,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.export()).toSucceedAndSatisfy((exported) => {
        expect(exported.metadata).toEqual(testMetadata);
        expect(exported.items).toEqual({
          item1: { name: 'Item 1', value: 10 },
          item2: { name: 'Item 2', value: 20 }
        });
      });
    });

    test('should export empty collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.export()).toSucceedAndSatisfy((exported) => {
        expect(exported.items).toEqual({});
      });
    });
  });

  // ==========================================================================
  // Immutability guards (overridden behavior)
  // ==========================================================================

  describe('immutability guards', () => {
    test('set should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.set('item1', { name: 'Item', value: 10 })).toFailWith(
        /immutable.*cannot be modified/i
      );
    });

    test('add should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.add('item1', { name: 'Item', value: 10 })).toFailWith(
        /immutable.*cannot be modified/i
      );
    });

    test('update should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.update('item1', { name: 'Updated', value: 20 })).toFailWith(
        /immutable.*cannot be modified/i
      );
    });

    test('delete should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.delete('item1')).toFailWith(/immutable.*cannot be modified/i);
    });

    test('clear should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.clear()).toFailWith(/immutable.*cannot be modified/i);
    });

    test('mutations should succeed for mutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      // Verify mutations work when mutable
      expect(collection.set('item1', { name: 'Item 1', value: 10 })).toSucceed();
      expect(collection.update('item1', { name: 'Updated', value: 20 })).toSucceed();
      expect(collection.delete('item1')).toSucceed();
      expect(collection.add('item2', { name: 'Item 2', value: 30 })).toSucceed();
      expect(collection.clear()).toSucceed();
    });
  });

  // ==========================================================================
  // Parsing methods (fromYaml, fromJson, parse)
  // ==========================================================================

  describe('fromYaml', () => {
    test('should parse valid YAML with metadata', () => {
      const yaml = `
metadata:
  name: Test Collection
  description: A test collection
items:
  item1:
    name: Item 1
    value: 10
  item2:
    name: Item 2
    value: 20
`;

      expect(
        EditableCollection.fromYaml(yaml, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.size).toBe(2);
        expect(collection.metadata.name).toBe('Test Collection');
        expect(collection.metadata.description).toBe('A test collection');
      });
    });

    test('should parse YAML without metadata', () => {
      const yaml = `
items:
  item1:
    name: Item 1
    value: 10
`;

      expect(
        EditableCollection.fromYaml(yaml, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.size).toBe(1);
        expect(collection.metadata.name).toBe('Test Collection');
      });
    });

    test('should fail on invalid value', () => {
      const yaml = `
items:
  item1:
    name: 123
    value: not-a-number
`;

      expect(
        EditableCollection.fromYaml(yaml, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFail();
    });

    test('should fail on invalid YAML', () => {
      const yaml = 'invalid: [yaml: syntax';

      expect(
        EditableCollection.fromYaml(yaml, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFail();
    });

    test('should fail when key conversion fails', () => {
      const yaml = `
items:
  '':
    name: Invalid Key
    value: 10
`;
      const strictKeyConverter = Converters.string.withConstraint((s) => s.length > 0, {
        description: 'must not be empty'
      });

      expect(
        EditableCollection.fromYaml(yaml, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: strictKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFailWith(/invalid key ""/i);
    });
  });

  describe('fromJson', () => {
    test('should parse valid JSON with metadata', () => {
      const json = JSON.stringify({
        metadata: {
          name: 'JSON Collection',
          description: 'From JSON'
        },
        items: {
          item1: { name: 'Item 1', value: 10 },
          item2: { name: 'Item 2', value: 20 }
        }
      });

      expect(
        EditableCollection.fromJson(json, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.size).toBe(2);
        expect(collection.metadata.name).toBe('JSON Collection');
      });
    });

    test('should use params metadata when sourceFile has no metadata', () => {
      const json = JSON.stringify({
        items: {
          item1: { name: 'Item 1', value: 10 }
        }
      });

      expect(
        EditableCollection.fromJson(json, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.metadata.name).toBe('Test Collection');
        expect(collection.metadata.description).toBe('A test collection');
      });
    });

    test('should fail on invalid JSON', () => {
      const json = '{invalid json}';

      expect(
        EditableCollection.fromJson(json, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFail();
    });

    test('should fail when key conversion fails', () => {
      const json = JSON.stringify({
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          '': { name: 'Invalid Key', value: 10 }
        }
      });
      const strictKeyConverter = Converters.string.withConstraint((s) => s.length > 0, {
        description: 'must not be empty'
      });

      expect(
        EditableCollection.fromJson(json, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: strictKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFailWith(/invalid key ""/i);
    });
  });

  describe('parse', () => {
    test('should parse JSON when content starts with brace', () => {
      const json = JSON.stringify({
        metadata: { name: 'Auto-detected JSON' },
        items: {
          item1: { name: 'Item 1', value: 10 }
        }
      });

      expect(
        EditableCollection.parse(json, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.size).toBe(1);
        expect(collection.metadata.name).toBe('Auto-detected JSON');
      });
    });

    test('should parse YAML when content does not start with brace', () => {
      const yaml = `
metadata:
  name: Auto-detected YAML
items:
  item1:
    name: Item 1
    value: 10
`;

      expect(
        EditableCollection.parse(yaml, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.size).toBe(1);
        expect(collection.metadata.name).toBe('Auto-detected YAML');
      });
    });

    test('should fail on empty content', () => {
      expect(
        EditableCollection.parse('', {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFailWith(/empty/i);
    });

    test('should fallback from JSON to YAML on parse failure', () => {
      const yaml = `
metadata:
  name: YAML fallback
items:
  item1:
    name: Item 1
    value: 10
`;

      expect(
        EditableCollection.parse(yaml, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.size).toBe(1);
      });
    });

    test('should fallback from YAML to JSON when content looks like JSON but YAML fails', () => {
      const json = JSON.stringify({
        items: {
          item1: { name: 'Item 1', value: 10 }
        }
      });

      expect(
        EditableCollection.parse(json, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.size).toBe(1);
      });
    });

    test('should fallback from JSON to YAML when content starts with brace but is not valid JSON', () => {
      // YAML flow mapping syntax starts with { but is not valid JSON
      const yamlFlowMapping = `{metadata: {name: YAML flow}, items: {item1: {name: Item 1, value: 10}}}`;

      expect(
        EditableCollection.parse(yamlFlowMapping, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.size).toBe(1);
      });
    });

    test('should use params metadata when parsed file has no metadata', () => {
      const yaml = `
items:
  item1:
    name: Item 1
    value: 10
`;

      expect(
        EditableCollection.parse(yaml, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.metadata.name).toBe('Test Collection');
        expect(collection.metadata.description).toBe('A test collection');
      });
    });

    test('should fail when both converters fail during fallback', () => {
      const invalidContent = '{not: valid, yaml: or, json}';

      expect(
        EditableCollection.parse(invalidContent, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFail();
    });

    test('should fail when key conversion fails after successful parse', () => {
      const yaml = `
items:
  '':
    name: Invalid Key
    value: 10
`;
      const strictKeyConverter = Converters.string.withConstraint((s) => s.length > 0, {
        description: 'must not be empty'
      });

      expect(
        EditableCollection.parse(yaml, {
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          keyConverter: strictKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFailWith(/invalid key ""/i);
    });
  });

  // ==========================================================================
  // Serialization methods
  // ==========================================================================

  describe('serializeToYaml', () => {
    test('should serialize collection to YAML', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.serializeToYaml()).toSucceedAndSatisfy((yaml) => {
        expect(yaml).toContain('metadata:');
        expect(yaml).toContain('Test Collection');
        expect(yaml).toContain('items:');
        expect(yaml).toContain('item1:');
      });
    });
  });

  describe('serializeToJson', () => {
    test('should serialize collection to JSON', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.serializeToJson()).toSucceedAndSatisfy((json) => {
        const parsed = JSON.parse(json);
        expect(parsed.metadata.name).toBe('Test Collection');
        expect(parsed.items.item1.name).toBe('Item 1');
      });
    });
  });

  describe('serialize', () => {
    test('should serialize to YAML when format is yaml', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.serialize('yaml')).toSucceedAndSatisfy((yaml) => {
        expect(yaml).toContain('metadata:');
      });
    });

    test('should serialize to JSON when format is json', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.serialize('json')).toSucceedAndSatisfy((json) => {
        const parsed = JSON.parse(json);
        expect(parsed.metadata).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // Persistence methods (canSave, save)
  // ==========================================================================

  describe('canSave', () => {
    test('should return false when no sourceItem', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.canSave()).toBe(false);
    });

    test('should return false when sourceItem is not a file', () => {
      const mockSourceItem = {
        name: 'test'
      };

      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter,
        sourceItem: mockSourceItem as unknown as import('@fgv/ts-json-base').FileTree.FileTreeItem
      }).orThrow();

      expect(collection.canSave()).toBe(false);
    });

    test('should return true when sourceItem is mutable file', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter,
        sourceItem: createMockMutableFileItem()
      }).orThrow();

      expect(collection.canSave()).toBe(true);
    });

    test('should return false when sourceItem is immutable file', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter,
        sourceItem: createMockMutableFileItem({ getIsMutable: () => succeed(false) })
      }).orThrow();

      expect(collection.canSave()).toBe(false);
    });
  });

  describe('save', () => {
    test('should fail when collection is immutable', async () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(await collection.save()).toFailWith(/immutable.*cannot be saved/i);
    });

    test('should fail when no sourceItem', async () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(await collection.save()).toFailWith(/no source file/i);
    });

    test('should fail when sourceItem is not a file', async () => {
      const mockSourceItem = {
        name: 'test'
      };

      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter,
        sourceItem: mockSourceItem as unknown as import('@fgv/ts-json-base').FileTree.FileTreeItem
      }).orThrow();

      expect(await collection.save()).toFailWith(/not a mutable file/i);
    });

    test('should fail when sourceItem file is immutable', async () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter,
        sourceItem: createMockMutableFileItem({ getIsMutable: () => succeed(false) })
      }).orThrow();

      expect(await collection.save()).toFailWith(/not mutable/i);
    });

    test('should fail when getIsMutable returns failure', async () => {
      const mockGetIsMutable = (): Result<boolean> => {
        return {
          isSuccess: () => false,
          isFailure: () => true,
          message: 'Failed to check mutability'
        } as unknown as Result<boolean>;
      };

      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter,
        sourceItem: createMockMutableFileItem({ getIsMutable: mockGetIsMutable })
      }).orThrow();

      expect(await collection.save()).toFailWith(/not mutable.*Failed to check mutability/i);
    });

    test('should save as plain YAML when no secretName', async () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter,
        sourceItem: createMockMutableFileItem()
      }).orThrow();

      expect(await collection.save()).toSucceedWith(true);
    });

    test('should save as plain YAML when secretName present but no keyStore', async () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: { ...testMetadata, secretName: 'my-secret' },
        isMutable: true,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter,
        sourceItem: createMockMutableFileItem()
      }).orThrow();

      expect(await collection.save()).toSucceedWith(true);
    });

    describe('encrypted save', () => {
      const cryptoProvider = CryptoUtils.nodeCryptoProvider;
      const testPassword = 'test-password';

      let keyStore: CryptoUtils.KeyStore.KeyStore;

      beforeEach(async () => {
        keyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
        await keyStore.initialize(testPassword);
        await keyStore.addSecret('my-secret');
      });

      test('should encrypt when secretName and keyStore are provided via constructor', async () => {
        let savedContent = '';
        const mockSourceItem = createMockMutableFileItem({
          setRawContents: (content: string) => {
            savedContent = content;
            return succeed(undefined);
          }
        });

        const collection = EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: { ...testMetadata, secretName: 'my-secret' },
          isMutable: true,
          initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter,
          sourceItem: mockSourceItem,
          encryptionProvider: keyStore
        }).orThrow();

        expect(await collection.save()).toSucceedWith(true);

        // Verify it wrote encrypted JSON, not plain YAML
        const parsed = JSON.parse(savedContent);
        expect(parsed.format).toBe(CryptoUtils.Constants.ENCRYPTED_FILE_FORMAT);
        expect(parsed.secretName).toBe('my-secret');
        expect(typeof parsed.encryptedData).toBe('string');
      });

      test('should encrypt when encryptionProvider is provided via save options', async () => {
        let savedContent = '';
        const mockSourceItem = createMockMutableFileItem({
          setRawContents: (content: string) => {
            savedContent = content;
            return succeed(undefined);
          }
        });

        const collection = EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: { ...testMetadata, secretName: 'my-secret' },
          isMutable: true,
          initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter,
          sourceItem: mockSourceItem
        }).orThrow();

        expect(await collection.save({ encryptionProvider: keyStore })).toSucceedWith(true);

        const parsed = JSON.parse(savedContent);
        expect(parsed.format).toBe(CryptoUtils.Constants.ENCRYPTED_FILE_FORMAT);
        expect(parsed.secretName).toBe('my-secret');
      });

      test('should fail when secret is not found in encryptionProvider', async () => {
        const collection = EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: { ...testMetadata, secretName: 'nonexistent-secret' },
          isMutable: true,
          initialItems: new Map(),
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter,
          sourceItem: createMockMutableFileItem(),
          encryptionProvider: keyStore
        }).orThrow();

        expect(await collection.save()).toFailWith(/not found/i);
      });

      test('should fail when keyStore is locked', async () => {
        keyStore.lock(true);

        const collection = EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: { ...testMetadata, secretName: 'my-secret' },
          isMutable: true,
          initialItems: new Map(),
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter,
          sourceItem: createMockMutableFileItem(),
          encryptionProvider: keyStore
        }).orThrow();

        expect(await collection.save()).toFailWith(/locked/i);
      });

      test('options encryptionProvider overrides constructor encryptionProvider', async () => {
        const otherKeyStore = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider }).orThrow();
        await otherKeyStore.initialize('other-password');
        await otherKeyStore.addSecret('other-secret');

        let savedContent = '';
        const mockSourceItem = createMockMutableFileItem({
          setRawContents: (content: string) => {
            savedContent = content;
            return succeed(undefined);
          }
        });

        // Constructor encryptionProvider doesn't have 'other-secret', but options one does
        const collection = EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: { ...testMetadata, secretName: 'other-secret' },
          isMutable: true,
          initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter,
          sourceItem: mockSourceItem,
          encryptionProvider: keyStore
        }).orThrow();

        // Should fail with constructor encryptionProvider (doesn't have 'other-secret')
        expect(await collection.save()).toFailWith(/not found/i);

        // Should succeed with options encryptionProvider override
        expect(await collection.save({ encryptionProvider: otherKeyStore })).toSucceedWith(true);

        const parsed = JSON.parse(savedContent);
        expect(parsed.format).toBe(CryptoUtils.Constants.ENCRYPTED_FILE_FORMAT);
        expect(parsed.secretName).toBe('other-secret');
      });
    });
  });

  describe('isDirty', () => {
    test('should always return false (not implemented)', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.isDirty()).toBe(false);
    });
  });

  describe('fromLibrary', () => {
    test('should create editable collection from library with metadata', () => {
      const mockLibrary = {
        collections: {
          get: (id: CollectionId) => {
            if (id === TEST_SOURCE_ID) {
              return {
                asResult: succeed({
                  metadata: { name: 'Library Collection', description: 'From library' },
                  isMutable: true,
                  items: new Map([['item1', { name: 'Item 1', value: 10 }]])
                }),
                isSuccess: () => true
              };
            }
            return {
              asResult: { isFailure: () => true, message: 'Not found' },
              isSuccess: () => false
            };
          }
        },
        getCollectionSourceItem: (_id: CollectionId) => undefined
      };

      expect(
        EditableCollection.fromLibrary(
          mockLibrary as unknown as import('../../../packlets/library-data').SubLibraryBase<
            string,
            string,
            TestItem
          >,
          TEST_SOURCE_ID,
          testKeyConverter,
          testValueConverter
        )
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.metadata.name).toBe('Library Collection');
        expect(collection.size).toBe(1);
      });
    });

    test('should use empty metadata when library collection has no metadata', () => {
      const mockLibrary = {
        collections: {
          get: (id: CollectionId) => {
            if (id === TEST_SOURCE_ID) {
              return {
                asResult: succeed({
                  metadata: undefined,
                  isMutable: true,
                  items: new Map([['item1', { name: 'Item 1', value: 10 }]])
                }),
                isSuccess: () => true
              };
            }
            return {
              asResult: { isFailure: () => true, message: 'Not found' },
              isSuccess: () => false
            };
          }
        },
        getCollectionSourceItem: (_id: CollectionId) => undefined
      };

      expect(
        EditableCollection.fromLibrary(
          mockLibrary as unknown as import('../../../packlets/library-data').SubLibraryBase<
            string,
            string,
            TestItem
          >,
          TEST_SOURCE_ID,
          testKeyConverter,
          testValueConverter
        )
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.metadata).toEqual({});
      });
    });

    test('should fail when collection not found in library', () => {
      const mockLibrary = {
        collections: {
          get: (_id: CollectionId) => ({
            asResult: { isFailure: () => true, message: 'Not found' },
            isSuccess: () => false
          })
        },
        getCollectionSourceItem: (_id: CollectionId) => undefined
      };

      expect(
        EditableCollection.fromLibrary(
          mockLibrary as unknown as import('../../../packlets/library-data').SubLibraryBase<
            string,
            string,
            TestItem
          >,
          TEST_SOURCE_ID,
          testKeyConverter,
          testValueConverter
        )
      ).toFailWith(/not found/i);
    });
  });
});
