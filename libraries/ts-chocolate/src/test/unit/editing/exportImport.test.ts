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
import { Converters } from '@fgv/ts-utils';
import {
  serializeToYaml,
  serializeToJson,
  serializeCollection,
  EditableCollection
} from '../../../packlets/editing';
import { ICollectionSourceFile, Converters as LibraryDataConverters } from '../../../packlets/library-data';

interface TestItem {
  name: string;
  value: number;
}

const testItemConverter = Converters.object<TestItem>({
  name: Converters.string,
  value: Converters.number
});

describe('serializeToYaml', () => {
  const testCollection: ICollectionSourceFile<TestItem> = {
    metadata: {
      name: 'Test Collection',
      description: 'A test collection'
    },
    items: {
      item1: { name: 'Item 1', value: 10 },
      item2: { name: 'Item 2', value: 20 }
    }
  };

  test('should serialize collection to YAML with pretty print', () => {
    expect(serializeToYaml(testCollection)).toSucceedAndSatisfy((yaml) => {
      expect(yaml).toContain('metadata:');
      expect(yaml).toContain('name: Test Collection');
      expect(yaml).toContain('items:');
      expect(yaml).toContain('item1:');
      expect(yaml).toContain('name: Item 1');
    });
  });

  test('should serialize collection to YAML without pretty print', () => {
    expect(serializeToYaml(testCollection, { format: 'yaml', prettyPrint: false })).toSucceedAndSatisfy(
      (yaml) => {
        expect(yaml).toContain('metadata');
        expect(yaml).toContain('items');
      }
    );
  });

  test('should serialize empty items', () => {
    const emptyCollection: ICollectionSourceFile<TestItem> = {
      metadata: { name: 'Empty' },
      items: {}
    };

    expect(serializeToYaml(emptyCollection)).toSucceedAndSatisfy((yaml) => {
      expect(yaml).toContain('metadata:');
      expect(yaml).toContain('items:');
    });
  });

  test('should handle special characters in values', () => {
    const specialCollection: ICollectionSourceFile<TestItem> = {
      metadata: { name: 'Test: Special & Chars' },
      items: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Item: 1 & More', value: 10 }
      }
    };

    expect(serializeToYaml(specialCollection)).toSucceed();
  });
});

describe('serializeToJson', () => {
  const testCollection: ICollectionSourceFile<TestItem> = {
    metadata: {
      name: 'Test Collection',
      description: 'A test collection'
    },
    items: {
      item1: { name: 'Item 1', value: 10 },
      item2: { name: 'Item 2', value: 20 }
    }
  };

  test('should serialize collection to JSON with pretty print', () => {
    expect(serializeToJson(testCollection)).toSucceedAndSatisfy((json) => {
      expect(json).toContain('"metadata"');
      expect(json).toContain('"name": "Test Collection"');
      expect(json).toContain('"items"');
      expect(json).toContain('"item1"');
      expect(json).toContain('\n'); // Pretty print includes newlines
    });
  });

  test('should serialize collection to JSON without pretty print', () => {
    expect(serializeToJson(testCollection, { format: 'json', prettyPrint: false })).toSucceedAndSatisfy(
      (json) => {
        expect(json).toContain('"metadata"');
        expect(json).toContain('"items"');
        expect(json).not.toContain('\n  '); // No indentation
      }
    );
  });

  test('should serialize empty items', () => {
    const emptyCollection: ICollectionSourceFile<TestItem> = {
      metadata: { name: 'Empty' },
      items: {}
    };

    expect(serializeToJson(emptyCollection)).toSucceedAndSatisfy((json) => {
      const parsed = JSON.parse(json);
      expect(parsed.items).toEqual({});
    });
  });

  test('should handle special characters', () => {
    const specialCollection: ICollectionSourceFile<TestItem> = {
      metadata: { name: 'Test "quotes" & <tags>' },
      items: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Item "1"', value: 10 }
      }
    };

    expect(serializeToJson(specialCollection)).toSucceedAndSatisfy((json) => {
      const parsed = JSON.parse(json);
      expect(parsed.metadata.name).toBe('Test "quotes" & <tags>');
    });
  });
});

describe('serializeCollection', () => {
  const testCollection: ICollectionSourceFile<TestItem> = {
    metadata: { name: 'Test' },
    items: { item1: { name: 'Item 1', value: 10 } }
  };

  test('should serialize to YAML when format is yaml', () => {
    expect(serializeCollection(testCollection, 'yaml')).toSucceedAndSatisfy((result) => {
      expect(result).toContain('metadata:');
      expect(result).toContain('items:');
    });
  });

  test('should serialize to JSON when format is json', () => {
    expect(serializeCollection(testCollection, 'json')).toSucceedAndSatisfy((result) => {
      expect(result).toContain('"metadata"');
      expect(result).toContain('"items"');
    });
  });
});

describe('collectionYamlConverter', () => {
  test('should parse valid YAML collection', () => {
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
    const converter = LibraryDataConverters.collectionYamlConverter(testItemConverter);
    expect(converter.convert(yaml)).toSucceedAndSatisfy((collection) => {
      expect(collection.metadata?.name).toBe('Test Collection');
      expect(collection.items.item1).toEqual({ name: 'Item 1', value: 10 });
      expect(collection.items.item2).toEqual({ name: 'Item 2', value: 20 });
    });
  });

  test('should parse YAML with empty items', () => {
    const yaml = `
metadata:
  name: Empty Collection
items: {}
`;
    const converter = LibraryDataConverters.collectionYamlConverter(testItemConverter);
    expect(converter.convert(yaml)).toSucceedAndSatisfy((collection) => {
      expect(collection.metadata?.name).toBe('Empty Collection');
      expect(collection.items).toEqual({});
    });
  });

  test('should fail for invalid YAML', () => {
    const invalidYaml = 'metadata:\n  name: Test\n  invalid: [unclosed';
    const converter = LibraryDataConverters.collectionYamlConverter(testItemConverter);
    expect(converter.convert(invalidYaml)).toFailWith(/failed to parse yaml/i);
  });

  test('should fail for array YAML', () => {
    const arrayYaml = '- item1\n- item2';
    const converter = LibraryDataConverters.collectionYamlConverter(testItemConverter);
    expect(converter.convert(arrayYaml)).toFail();
  });

  test('should fail for null YAML', () => {
    const nullYaml = 'null';
    const converter = LibraryDataConverters.collectionYamlConverter(testItemConverter);
    expect(converter.convert(nullYaml)).toFailWith(/yaml content must be an object/i);
  });
});

describe('collectionJsonConverter', () => {
  test('should parse valid JSON collection', () => {
    const json = JSON.stringify({
      metadata: {
        name: 'Test Collection',
        description: 'A test collection'
      },
      items: {
        item1: { name: 'Item 1', value: 10 },
        item2: { name: 'Item 2', value: 20 }
      }
    });
    const converter = LibraryDataConverters.collectionJsonConverter(testItemConverter);
    expect(converter.convert(json)).toSucceedAndSatisfy((collection) => {
      expect(collection.metadata?.name).toBe('Test Collection');
      expect(collection.items.item1).toEqual({ name: 'Item 1', value: 10 });
    });
  });

  test('should parse JSON with empty items', () => {
    const json = JSON.stringify({
      metadata: { name: 'Empty Collection' },
      items: {}
    });
    const converter = LibraryDataConverters.collectionJsonConverter(testItemConverter);
    expect(converter.convert(json)).toSucceedAndSatisfy((collection) => {
      expect(collection.items).toEqual({});
    });
  });

  test('should fail for invalid JSON', () => {
    const invalidJson = '{ "metadata": { "name": "Test", }'; // Trailing comma
    const converter = LibraryDataConverters.collectionJsonConverter(testItemConverter);
    expect(converter.convert(invalidJson)).toFailWith(/failed to parse json/i);
  });

  test('should fail for array JSON', () => {
    const arrayJson = '["item1", "item2"]';
    const converter = LibraryDataConverters.collectionJsonConverter(testItemConverter);
    expect(converter.convert(arrayJson)).toFail();
  });

  test('should fail for null JSON', () => {
    const nullJson = 'null';
    const converter = LibraryDataConverters.collectionJsonConverter(testItemConverter);
    expect(converter.convert(nullJson)).toFailWith(/json content must be an object/i);
  });
});

describe('EditableCollection.validateStructure', () => {
  test('should succeed for valid collection structure', () => {
    const data = {
      metadata: { name: 'Test' },
      items: {}
    };
    expect(EditableCollection.validateStructure(data)).toSucceed();
  });

  test('should succeed for collection without metadata', () => {
    const data = {
      items: {}
    };
    expect(EditableCollection.validateStructure(data)).toSucceed();
  });

  test('should fail for non-object data', () => {
    expect(EditableCollection.validateStructure(null)).toFailWith(/must be an object/i);
    expect(EditableCollection.validateStructure('string')).toFailWith(/must be an object/i);
    expect(EditableCollection.validateStructure(123)).toFailWith(/must be an object/i);
  });

  test('should fail for missing items field', () => {
    const data = {
      metadata: { name: 'Test' }
    };
    expect(EditableCollection.validateStructure(data)).toFailWith(/must have an "items" field/i);
  });

  test('should fail for non-object items', () => {
    const data = {
      metadata: { name: 'Test' },
      items: 'not an object'
    };
    expect(EditableCollection.validateStructure(data)).toFailWith(/"items" field must be an object/i);
  });

  test('should fail for null items', () => {
    const data = {
      metadata: { name: 'Test' },
      items: null
    };
    expect(EditableCollection.validateStructure(data)).toFailWith(/"items" field must be an object/i);
  });

  test('should fail for non-object metadata', () => {
    const data = {
      metadata: 'not an object',
      items: {}
    };
    expect(EditableCollection.validateStructure(data)).toFailWith(/"metadata" field must be an object/i);
  });

  test('should fail for null metadata', () => {
    const data = {
      metadata: null,
      items: {}
    };
    expect(EditableCollection.validateStructure(data)).toFailWith(/"metadata" field must be an object/i);
  });
});
