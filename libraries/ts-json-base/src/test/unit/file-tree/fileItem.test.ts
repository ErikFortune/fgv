/*
 * Copyright (c) 2025 Erik Fortune
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
import { FileItem, InMemoryTreeAccessors, IInMemoryFile } from '../../../packlets/file-tree';

describe('FileItem', () => {
  let sampleFiles: IInMemoryFile[];
  let accessors: InMemoryTreeAccessors;

  beforeEach(() => {
    sampleFiles = [
      { path: '/config.json', contents: '{"name": "test", "enabled": true}' },
      { path: '/data/items.json', contents: '[1, 2, 3]' },
      { path: '/docs/readme.txt', contents: 'This is a readme file' },
      { path: '/docs/api/reference.json', contents: '{"endpoints": []}' },
      { path: '/data/metadata.xml', contents: '<root><version>1.0</version></root>' },
      { path: '/scripts/build.sh', contents: '#!/bin/bash\necho "Building..."' },
      { path: '/empty.json', contents: '{}' },
      { path: '/invalid.json', contents: '{ "incomplete": json' },
      { path: '/simple-name', contents: 'file without extension' }
    ];

    accessors = InMemoryTreeAccessors.create(sampleFiles).orThrow();
  });

  describe('create static method', () => {
    test('creates FileItem with valid path and accessors', () => {
      const result = FileItem.create('/config.json', accessors);
      expect(result).toSucceedAndSatisfy((fileItem) => {
        expect(fileItem).toBeInstanceOf(FileItem);
        expect(fileItem.type).toBe('file');
        expect(fileItem.absolutePath).toBe('/config.json');
      });
    });

    test('creates FileItem with relative path', () => {
      const result = FileItem.create('config.json', accessors);
      expect(result).toSucceedAndSatisfy((fileItem) => {
        expect(fileItem.absolutePath).toBe('/config.json');
      });
    });

    test('creates FileItem with nested path', () => {
      const result = FileItem.create('/docs/api/reference.json', accessors);
      expect(result).toSucceedAndSatisfy((fileItem) => {
        expect(fileItem.absolutePath).toBe('/docs/api/reference.json');
      });
    });

    test('creates FileItem even for non-existent files', () => {
      const result = FileItem.create('/non-existent.json', accessors);
      expect(result).toSucceedAndSatisfy((fileItem) => {
        expect(fileItem.absolutePath).toBe('/non-existent.json');
      });
    });
  });

  describe('properties', () => {
    test('type property is always "file"', () => {
      const fileItem = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem.type).toBe('file');
    });

    test('absolutePath property returns resolved absolute path', () => {
      const fileItem1 = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem1.absolutePath).toBe('/config.json');

      const fileItem2 = FileItem.create('config.json', accessors).orThrow();
      expect(fileItem2.absolutePath).toBe('/config.json');
    });

    test('name property returns file name', () => {
      const fileItem1 = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem1.name).toBe('config.json');

      const fileItem2 = FileItem.create('/docs/api/reference.json', accessors).orThrow();
      expect(fileItem2.name).toBe('reference.json');

      const fileItem3 = FileItem.create('/docs/readme.txt', accessors).orThrow();
      expect(fileItem3.name).toBe('readme.txt');
    });

    test('baseName property returns base name without extension', () => {
      const fileItem1 = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem1.baseName).toBe('config');

      const fileItem2 = FileItem.create('/docs/api/reference.json', accessors).orThrow();
      expect(fileItem2.baseName).toBe('reference');

      const fileItem3 = FileItem.create('/docs/readme.txt', accessors).orThrow();
      expect(fileItem3.baseName).toBe('readme');
    });

    test('extension property returns file extension', () => {
      const fileItem1 = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem1.extension).toBe('.json');

      const fileItem2 = FileItem.create('/docs/readme.txt', accessors).orThrow();
      expect(fileItem2.extension).toBe('.txt');

      const fileItem3 = FileItem.create('/data/metadata.xml', accessors).orThrow();
      expect(fileItem3.extension).toBe('.xml');

      const fileItem4 = FileItem.create('/scripts/build.sh', accessors).orThrow();
      expect(fileItem4.extension).toBe('.sh');
    });

    test('handles files without extensions', () => {
      const fileItem = FileItem.create('/simple-name', accessors).orThrow();
      expect(fileItem.name).toBe('simple-name');
      expect(fileItem.baseName).toBe('simple-name');
      expect(fileItem.extension).toBe('');
    });

    test('handles root directory files', () => {
      const fileItem = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem.name).toBe('config.json');
      expect(fileItem.baseName).toBe('config');
      expect(fileItem.extension).toBe('.json');
    });

    test('contentType property returns current content type', () => {
      const fileItem = FileItem.create('/test.json', accessors).orThrow();

      // Initial contentType should be undefined (since our test accessors don't set it)
      expect(fileItem.contentType).toBeUndefined();
    });
  });

  describe('setContentType method', () => {
    test('sets content type to a specific value', () => {
      const fileItem = FileItem.create('/test.json', accessors).orThrow();

      expect(fileItem.contentType).toBeUndefined();

      fileItem.setContentType('application/json');
      expect(fileItem.contentType).toBe('application/json');
    });

    test('sets content type to undefined', () => {
      const fileItem = FileItem.create('/test.json', accessors).orThrow();

      // First set a content type
      fileItem.setContentType('application/json');
      expect(fileItem.contentType).toBe('application/json');

      // Then set it back to undefined
      fileItem.setContentType(undefined);
      expect(fileItem.contentType).toBeUndefined();
    });

    test('can change content type multiple times', () => {
      const fileItem = FileItem.create('/test.json', accessors).orThrow();

      fileItem.setContentType('application/json');
      expect(fileItem.contentType).toBe('application/json');

      fileItem.setContentType('text/plain');
      expect(fileItem.contentType).toBe('text/plain');

      fileItem.setContentType('application/xml');
      expect(fileItem.contentType).toBe('application/xml');
    });

    test('handles special content types', () => {
      const fileItem = FileItem.create('/test.json', accessors).orThrow();

      const specialTypes = [
        'application/vnd.api+json',
        'text/plain; charset=utf-8',
        'multipart/form-data; boundary=test',
        ''
      ];

      specialTypes.forEach((contentType) => {
        fileItem.setContentType(contentType);
        expect(fileItem.contentType).toBe(contentType);
      });
    });
  });

  describe('getContents method', () => {
    test('retrieves and parses JSON contents', () => {
      const fileItem = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem.getContents()).toSucceedAndSatisfy((content) => {
        expect(content).toEqual({ name: 'test', enabled: true });
      });
    });

    test('retrieves array JSON contents', () => {
      const fileItem = FileItem.create('/data/items.json', accessors).orThrow();
      expect(fileItem.getContents()).toSucceedAndSatisfy((content) => {
        expect(content).toEqual([1, 2, 3]);
      });
    });

    test('retrieves empty JSON object', () => {
      const fileItem = FileItem.create('/empty.json', accessors).orThrow();
      expect(fileItem.getContents()).toSucceedAndSatisfy((content) => {
        expect(content).toEqual({});
      });
    });

    test('returns raw string for non-JSON files', () => {
      const fileItem = FileItem.create('/docs/readme.txt', accessors).orThrow();
      expect(fileItem.getContents()).toSucceedAndSatisfy((content) => {
        expect(content).toBe('This is a readme file');
      });
    });

    test('returns raw string for invalid JSON', () => {
      const fileItem = FileItem.create('/invalid.json', accessors).orThrow();
      expect(fileItem.getContents()).toSucceedAndSatisfy((content) => {
        expect(content).toBe('{ "incomplete": json');
      });
    });

    test('returns raw string for XML files', () => {
      const fileItem = FileItem.create('/data/metadata.xml', accessors).orThrow();
      expect(fileItem.getContents()).toSucceedAndSatisfy((content) => {
        expect(content).toBe('<root><version>1.0</version></root>');
      });
    });

    test('fails for non-existent files', () => {
      const fileItem = FileItem.create('/missing.json', accessors).orThrow();
      expect(fileItem.getContents()).toFailWith(/not found/i);
    });
  });

  describe('getContents with converter', () => {
    test('converts JSON content with string converter', () => {
      const fileItem = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem.getContents(Converters.string)).toFailWith(/not a string/i);
    });

    test('converts JSON content with object converter', () => {
      const configConverter = Converters.object<{ name: string; enabled: boolean }>({
        name: Converters.string,
        enabled: Converters.boolean
      });

      const fileItem = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem.getContents(configConverter)).toSucceedAndSatisfy((content) => {
        expect(content.name).toBe('test');
        expect(content.enabled).toBe(true);
      });
    });

    test('converts array JSON content', () => {
      const arrayConverter = Converters.arrayOf(Converters.number);

      const fileItem = FileItem.create('/data/items.json', accessors).orThrow();
      expect(fileItem.getContents(arrayConverter)).toSucceedAndSatisfy((content) => {
        expect(content).toEqual([1, 2, 3]);
        expect(content).toHaveLength(3);
      });
    });

    test('converts empty JSON with object converter', () => {
      const emptyConverter = Converters.object<Record<string, never>>({});

      const fileItem = FileItem.create('/empty.json', accessors).orThrow();
      expect(fileItem.getContents(emptyConverter)).toSucceedAndSatisfy((content) => {
        expect(content).toEqual({});
      });
    });

    test('fails conversion with incompatible converter', () => {
      const arrayConverter = Converters.arrayOf(Converters.string);

      const fileItem = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem.getContents(arrayConverter)).toFailWith(/not an array/i);
    });

    test('converts raw string content with string converter', () => {
      const fileItem = FileItem.create('/docs/readme.txt', accessors).orThrow();
      expect(fileItem.getContents(Converters.string)).toSucceedAndSatisfy((content) => {
        expect(content).toBe('This is a readme file');
      });
    });

    test('fails to convert non-JSON string with JSON converter', () => {
      const objectConverter = Converters.object<{ key: string }>({
        key: Converters.string
      });

      const fileItem = FileItem.create('/docs/readme.txt', accessors).orThrow();
      expect(fileItem.getContents(objectConverter)).toFailWith(/cannot convert.*key.*from non-object/i);
    });

    test('fails for non-existent files with converter', () => {
      const fileItem = FileItem.create('/missing.json', accessors).orThrow();
      expect(fileItem.getContents(Converters.string)).toFailWith(/not found/i);
    });
  });

  describe('getRawContents method', () => {
    test('retrieves raw JSON contents as string', () => {
      const fileItem = FileItem.create('/config.json', accessors).orThrow();
      expect(fileItem.getRawContents()).toSucceedAndSatisfy((content) => {
        expect(content).toBe('{"name": "test", "enabled": true}');
      });
    });

    test('retrieves raw text contents', () => {
      const fileItem = FileItem.create('/docs/readme.txt', accessors).orThrow();
      expect(fileItem.getRawContents()).toSucceedAndSatisfy((content) => {
        expect(content).toBe('This is a readme file');
      });
    });

    test('retrieves raw XML contents', () => {
      const fileItem = FileItem.create('/data/metadata.xml', accessors).orThrow();
      expect(fileItem.getRawContents()).toSucceedAndSatisfy((content) => {
        expect(content).toBe('<root><version>1.0</version></root>');
      });
    });

    test('retrieves raw shell script contents', () => {
      const fileItem = FileItem.create('/scripts/build.sh', accessors).orThrow();
      expect(fileItem.getRawContents()).toSucceedAndSatisfy((content) => {
        expect(content).toBe('#!/bin/bash\necho "Building..."');
      });
    });

    test('retrieves raw invalid JSON as string', () => {
      const fileItem = FileItem.create('/invalid.json', accessors).orThrow();
      expect(fileItem.getRawContents()).toSucceedAndSatisfy((content) => {
        expect(content).toBe('{ "incomplete": json');
      });
    });

    test('retrieves empty content', () => {
      const emptyFiles: IInMemoryFile[] = [{ path: '/empty.txt', contents: '' }];
      const emptyAccessors = InMemoryTreeAccessors.create(emptyFiles).orThrow();

      const fileItem = FileItem.create('/empty.txt', emptyAccessors).orThrow();
      expect(fileItem.getRawContents()).toSucceedAndSatisfy((content) => {
        expect(content).toBe('');
      });
    });

    test('fails for non-existent files', () => {
      const fileItem = FileItem.create('/missing.txt', accessors).orThrow();
      expect(fileItem.getRawContents()).toFailWith(/not found/i);
    });
  });

  describe('integration scenarios', () => {
    test('can access file properties and contents consistently', () => {
      const fileItem = FileItem.create('/docs/api/reference.json', accessors).orThrow();

      expect(fileItem.name).toBe('reference.json');
      expect(fileItem.baseName).toBe('reference');
      expect(fileItem.extension).toBe('.json');
      expect(fileItem.absolutePath).toBe('/docs/api/reference.json');

      expect(fileItem.getContents()).toSucceedAndSatisfy((content) => {
        expect(content).toEqual({ endpoints: [] });
      });

      expect(fileItem.getRawContents()).toSucceedAndSatisfy((raw) => {
        expect(raw).toBe('{"endpoints": []}');
      });
    });

    test('handles various file types with different extensions', () => {
      const extensions = ['.json', '.txt', '.xml', '.sh', ''];
      const filePaths = [
        '/config.json',
        '/docs/readme.txt',
        '/data/metadata.xml',
        '/scripts/build.sh',
        '/simple-name'
      ];

      filePaths.forEach((path, index) => {
        const fileItem = FileItem.create(path, accessors).orThrow();
        expect(fileItem.extension).toBe(extensions[index]);
        expect(fileItem.type).toBe('file');
        expect(fileItem.getRawContents()).toSucceed();
      });
    });

    test('consistent behavior with different path formats', () => {
      const absoluteItem = FileItem.create('/config.json', accessors).orThrow();
      const relativeItem = FileItem.create('config.json', accessors).orThrow();

      expect(absoluteItem.absolutePath).toBe(relativeItem.absolutePath);
      expect(absoluteItem.name).toBe(relativeItem.name);
      expect(absoluteItem.baseName).toBe(relativeItem.baseName);
      expect(absoluteItem.extension).toBe(relativeItem.extension);

      expect(absoluteItem.getContents()).toSucceedWith(relativeItem.getContents().orThrow());
      expect(absoluteItem.getRawContents()).toSucceedWith(relativeItem.getRawContents().orThrow());
    });
  });

  describe('static methods', () => {
    describe('defaultAcceptContentType', () => {
      test('returns success with provided content type when provided is defined', () => {
        const result = FileItem.defaultAcceptContentType('/test/file.json', 'application/json');
        expect(result).toSucceedWith('application/json');
      });

      test('returns success with provided content type for different content types', () => {
        expect(FileItem.defaultAcceptContentType('/test/file.xml', 'application/xml')).toSucceedWith(
          'application/xml'
        );
        expect(FileItem.defaultAcceptContentType('/test/file.txt', 'text/plain')).toSucceedWith('text/plain');
        expect(FileItem.defaultAcceptContentType('/test/file.html', 'text/html')).toSucceedWith('text/html');
        expect(FileItem.defaultAcceptContentType('/test/script.js', 'application/javascript')).toSucceedWith(
          'application/javascript'
        );
      });

      test('returns success with undefined when provided is undefined', () => {
        const result = FileItem.defaultAcceptContentType('/test/file.json');
        expect(result).toSucceedWith(undefined);
      });

      test('returns success with undefined when provided is explicitly undefined', () => {
        const result = FileItem.defaultAcceptContentType('/test/file.json', undefined);
        expect(result).toSucceedWith(undefined);
      });

      test('ignores file path parameter - works with any path', () => {
        const testPaths = [
          '/simple.json',
          '/path/to/nested/file.xml',
          '/deeply/nested/directory/structure/file.txt',
          '/file-without-extension',
          '/file.with.multiple.dots.json',
          '/UPPERCASE.JSON',
          '/special-chars_123.json',
          '',
          '/',
          'relative/path.json',
          './relative/path.json',
          '../parent/path.json'
        ];

        testPaths.forEach((path) => {
          expect(FileItem.defaultAcceptContentType(path, 'test/content-type')).toSucceedWith(
            'test/content-type'
          );
          expect(FileItem.defaultAcceptContentType(path)).toSucceedWith(undefined);
        });
      });

      test('works with typed content type parameter', () => {
        type CustomContentType = 'custom/type1' | 'custom/type2';

        const result1 = FileItem.defaultAcceptContentType<CustomContentType>('/test.file', 'custom/type1');
        expect(result1).toSucceedWith('custom/type1');

        const result2 = FileItem.defaultAcceptContentType<CustomContentType>('/test.file', 'custom/type2');
        expect(result2).toSucceedWith('custom/type2');

        const result3 = FileItem.defaultAcceptContentType<CustomContentType>('/test.file');
        expect(result3).toSucceedWith(undefined);
      });

      test('handles empty string as content type', () => {
        const result = FileItem.defaultAcceptContentType('/test/file.json', '');
        expect(result).toSucceedWith('');
      });

      test('handles special characters in content type', () => {
        const specialContentTypes = [
          'application/vnd.api+json',
          'text/plain; charset=utf-8',
          'multipart/form-data; boundary=something',
          'application/x-custom-type'
        ];

        specialContentTypes.forEach((contentType) => {
          expect(FileItem.defaultAcceptContentType('/test.file', contentType)).toSucceedWith(contentType);
        });
      });

      test('is a pure function - same inputs always produce same outputs', () => {
        const path = '/test/consistent.json';
        const contentType = 'application/json';

        // Call multiple times to ensure consistency
        for (let i = 0; i < 5; i++) {
          expect(FileItem.defaultAcceptContentType(path, contentType)).toSucceedWith(contentType);
          expect(FileItem.defaultAcceptContentType(path)).toSucceedWith(undefined);
        }
      });
    });

    describe('defaultInferContentType', () => {
      test('always returns success with undefined regardless of input', () => {
        expect(FileItem.defaultInferContentType('/test/file.json')).toSucceedWith(undefined);
        expect(FileItem.defaultInferContentType('/test/file.xml', 'provided')).toSucceedWith(undefined);
        expect(FileItem.defaultInferContentType('')).toSucceedWith(undefined);
        expect(FileItem.defaultInferContentType('/', undefined)).toSucceedWith(undefined);
      });

      test('ignores all parameters', () => {
        const testCases: Array<[string, string | undefined]> = [
          ['/simple.json', undefined],
          ['/path/to/file.xml', 'some-value'],
          ['', ''],
          ['relative/path', 'application/json']
        ];

        testCases.forEach(([path, provided]) => {
          expect(FileItem.defaultInferContentType(path, provided)).toSucceedWith(undefined);
        });
      });

      test('works with typed content type parameter', () => {
        type CustomContentType = 'custom/type1' | 'custom/type2';

        const result1 = FileItem.defaultInferContentType<CustomContentType>('/test.file');
        expect(result1).toSucceedWith(undefined);

        const result2 = FileItem.defaultInferContentType<CustomContentType>('/test.file', 'provided');
        expect(result2).toSucceedWith(undefined);
      });
    });
  });

  describe('error handling and edge cases', () => {
    test('handles files with complex names', () => {
      const complexFiles: IInMemoryFile[] = [
        { path: '/special-chars_123.json', contents: '{}' },
        { path: '/file.with.multiple.dots.txt', contents: 'content' },
        { path: '/UPPERCASE.JSON', contents: '{"test": true}' }
      ];
      const complexAccessors = InMemoryTreeAccessors.create(complexFiles).orThrow();

      const fileItem1 = FileItem.create('/special-chars_123.json', complexAccessors).orThrow();
      expect(fileItem1.name).toBe('special-chars_123.json');
      expect(fileItem1.baseName).toBe('special-chars_123');
      expect(fileItem1.extension).toBe('.json');

      const fileItem2 = FileItem.create('/file.with.multiple.dots.txt', complexAccessors).orThrow();
      expect(fileItem2.name).toBe('file.with.multiple.dots.txt');
      expect(fileItem2.baseName).toBe('file.with.multiple.dots');
      expect(fileItem2.extension).toBe('.txt');
    });

    test('handles deep directory structures', () => {
      const deepFiles: IInMemoryFile[] = [{ path: '/a/b/c/d/e/f/deep.json', contents: '{"deep": true}' }];
      const deepAccessors = InMemoryTreeAccessors.create(deepFiles).orThrow();

      const fileItem = FileItem.create('/a/b/c/d/e/f/deep.json', deepAccessors).orThrow();
      expect(fileItem.name).toBe('deep.json');
      expect(fileItem.absolutePath).toBe('/a/b/c/d/e/f/deep.json');
      expect(fileItem.getContents()).toSucceedWith({ deep: true });
    });

    test('handles large content', () => {
      const largeContent = 'x'.repeat(10000);
      const largeFiles: IInMemoryFile[] = [{ path: '/large.txt', contents: largeContent }];
      const largeAccessors = InMemoryTreeAccessors.create(largeFiles).orThrow();

      const fileItem = FileItem.create('/large.txt', largeAccessors).orThrow();
      expect(fileItem.getRawContents()).toSucceedAndSatisfy((content) => {
        expect(content).toHaveLength(10000);
        expect(content).toBe(largeContent);
      });
    });
  });
});
