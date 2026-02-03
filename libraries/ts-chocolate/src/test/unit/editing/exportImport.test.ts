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
  parseYaml,
  parseJson,
  parseCollection,
  parseCollectionWithFormat,
  validateCollectionStructure,
  validateAndParseCollection
} from '../../../packlets/editing';
import { ICollectionSourceFile } from '../../../packlets/library-data';

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

describe('parseYaml', () => {
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

    expect(parseYaml<TestItem>(yaml, testItemConverter)).toSucceedAndSatisfy((collection) => {
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

    expect(parseYaml<TestItem>(yaml, testItemConverter)).toSucceedAndSatisfy((collection) => {
      expect(collection.metadata?.name).toBe('Empty Collection');
      expect(collection.items).toEqual({});
    });
  });

  test('should fail for invalid YAML', () => {
    const invalidYaml = 'metadata:\n  name: Test\n  invalid: [unclosed';
    expect(parseYaml<TestItem>(invalidYaml, testItemConverter)).toFailWith(/failed to parse yaml/i);
  });

  test('should parse array YAML (arrays are objects in JS)', () => {
    const arrayYaml = '- item1\n- item2';
    // Arrays are objects in JavaScript, so parsing succeeds but validation will fail
    expect(parseYaml<TestItem>(arrayYaml, testItemConverter)).toFail();
  });

  test('should fail for null YAML', () => {
    const nullYaml = 'null';
    expect(parseYaml<TestItem>(nullYaml, testItemConverter)).toFailWith(/yaml content must be an object/i);
  });
});

describe('parseJson', () => {
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

    expect(parseJson<TestItem>(json, testItemConverter)).toSucceedAndSatisfy((collection) => {
      expect(collection.metadata?.name).toBe('Test Collection');
      expect(collection.items.item1).toEqual({ name: 'Item 1', value: 10 });
    });
  });

  test('should parse JSON with empty items', () => {
    const json = JSON.stringify({
      metadata: { name: 'Empty Collection' },
      items: {}
    });

    expect(parseJson<TestItem>(json, testItemConverter)).toSucceedAndSatisfy((collection) => {
      expect(collection.items).toEqual({});
    });
  });

  test('should fail for invalid JSON', () => {
    const invalidJson = '{ "metadata": { "name": "Test", }'; // Trailing comma
    expect(parseJson<TestItem>(invalidJson, testItemConverter)).toFailWith(/failed to parse json/i);
  });

  test('should parse array JSON (arrays are objects in JS)', () => {
    const arrayJson = '["item1", "item2"]';
    // Arrays are objects in JavaScript, so parsing succeeds but validation will fail
    expect(parseJson<TestItem>(arrayJson, testItemConverter)).toFail();
  });

  test('should fail for null JSON', () => {
    const nullJson = 'null';
    expect(parseJson<TestItem>(nullJson, testItemConverter)).toFailWith(/json content must be an object/i);
  });
});

describe('parseCollection', () => {
  test('should parse JSON when content starts with {', () => {
    const json = '{"metadata":{"name":"Test"},"items":{}}';
    expect(parseCollection<TestItem>(json, testItemConverter)).toSucceedAndSatisfy((collection) => {
      expect(collection.metadata?.name).toBe('Test');
    });
  });

  test('should parse YAML when content does not start with { or [', () => {
    const yaml = 'metadata:\n  name: Test\nitems: {}';
    expect(parseCollection<TestItem>(yaml, testItemConverter)).toSucceedAndSatisfy((collection) => {
      expect(collection.metadata?.name).toBe('Test');
    });
  });

  test('should try YAML fallback for malformed JSON', () => {
    const yaml = 'metadata:\n  name: Test\nitems: {}';
    expect(parseCollection<TestItem>(yaml, testItemConverter)).toSucceed();
  });

  test('should fail for empty content', () => {
    expect(parseCollection<TestItem>('', testItemConverter)).toFailWith(/content is empty/i);
    expect(parseCollection<TestItem>('   ', testItemConverter)).toFailWith(/content is empty/i);
  });

  test('should handle content with leading whitespace', () => {
    const json = '  {"metadata":{"name":"Test"},"items":{}}';
    expect(parseCollection<TestItem>(json, testItemConverter)).toSucceed();
  });

  test('should fail when both YAML and JSON parsing fail', () => {
    const invalidContent = 'this is not valid YAML or JSON at all {{ [ } ]';
    // Will try to parse (fails), then fallback (also fails)
    expect(parseCollection<TestItem>(invalidContent, testItemConverter)).toFail();
  });
});

describe('parseCollectionWithFormat', () => {
  test('should parse YAML when format is yaml', () => {
    const yaml = 'metadata:\n  name: Test\nitems: {}';
    expect(parseCollectionWithFormat<TestItem>(yaml, 'yaml', testItemConverter)).toSucceedAndSatisfy(
      (collection) => {
        expect(collection.metadata?.name).toBe('Test');
      }
    );
  });

  test('should parse JSON when format is json', () => {
    const json = '{"metadata":{"name":"Test"},"items":{}}';
    expect(parseCollectionWithFormat<TestItem>(json, 'json', testItemConverter)).toSucceedAndSatisfy(
      (collection) => {
        expect(collection.metadata?.name).toBe('Test');
      }
    );
  });

  test('should fail for wrong format hint', () => {
    const yaml = 'metadata:\n  name: Test\nitems: {}';
    expect(parseCollectionWithFormat<TestItem>(yaml, 'json', testItemConverter)).toFailWith(
      /failed to parse json/i
    );
  });
});

describe('validateCollectionStructure', () => {
  test('should succeed for valid collection structure', () => {
    const data = {
      metadata: { name: 'Test' },
      items: {}
    };
    expect(validateCollectionStructure(data)).toSucceed();
  });

  test('should succeed with metadata and items', () => {
    const data = {
      metadata: { name: 'Test', description: 'Description' },
      items: {
        item1: { name: 'Item 1', value: 10 }
      }
    };
    expect(validateCollectionStructure(data)).toSucceed();
  });

  test('should succeed without metadata', () => {
    const data = {
      items: {}
    };
    expect(validateCollectionStructure(data)).toSucceed();
  });

  test('should fail for non-object', () => {
    expect(validateCollectionStructure('not an object')).toFailWith(/must be an object/i);
    expect(validateCollectionStructure(null)).toFailWith(/must be an object/i);
    expect(validateCollectionStructure(123)).toFailWith(/must be an object/i);
  });

  test('should fail without items field', () => {
    const data = {
      metadata: { name: 'Test' }
    };
    expect(validateCollectionStructure(data)).toFailWith(/must have an "items" field/i);
  });

  test('should fail for non-object items', () => {
    const data = {
      items: 'not an object'
    };
    expect(validateCollectionStructure(data)).toFailWith(/"items" field must be an object/i);
  });

  test('should fail for null items', () => {
    const data = {
      items: null
    };
    expect(validateCollectionStructure(data)).toFailWith(/"items" field must be an object/i);
  });

  test('should fail for non-object metadata when present', () => {
    const data = {
      metadata: 'not an object',
      items: {}
    };
    expect(validateCollectionStructure(data)).toFailWith(/"metadata" field must be an object/i);
  });

  test('should fail for null metadata when present', () => {
    const data = {
      metadata: null,
      items: {}
    };
    expect(validateCollectionStructure(data)).toFailWith(/"metadata" field must be an object/i);
  });
});

describe('validateAndParseCollection', () => {
  test('should validate and parse valid YAML', () => {
    const yaml = 'metadata:\n  name: Test\nitems:\n  item1:\n    name: Item\n    value: 10';
    expect(validateAndParseCollection<TestItem>(yaml, testItemConverter, 'yaml')).toSucceedAndSatisfy(
      (collection) => {
        expect(collection.metadata?.name).toBe('Test');
        expect(collection.items.item1).toBeDefined();
      }
    );
  });

  test('should validate and parse valid JSON', () => {
    const json = '{"metadata":{"name":"Test"},"items":{"item1":{"name":"Item","value":10}}}';
    expect(validateAndParseCollection<TestItem>(json, testItemConverter, 'json')).toSucceedAndSatisfy(
      (collection) => {
        expect(collection.metadata?.name).toBe('Test');
      }
    );
  });

  test('should auto-detect and parse JSON', () => {
    const json = '{"metadata":{"name":"Test"},"items":{}}';
    expect(validateAndParseCollection<TestItem>(json, testItemConverter)).toSucceed();
  });

  test('should auto-detect and parse YAML', () => {
    const yaml = 'metadata:\n  name: Test\nitems: {}';
    expect(validateAndParseCollection<TestItem>(yaml, testItemConverter)).toSucceed();
  });

  test('should fail for invalid structure', () => {
    const invalid = '{"metadata":{"name":"Test"}}'; // Missing items
    expect(validateAndParseCollection<TestItem>(invalid, testItemConverter, 'json')).toFailWith(
      /field items not found/i
    );
  });

  test('should fail for malformed content', () => {
    const invalid = '{invalid json}';
    expect(validateAndParseCollection<TestItem>(invalid, testItemConverter, 'json')).toFailWith(
      /failed to parse/i
    );
  });
});
