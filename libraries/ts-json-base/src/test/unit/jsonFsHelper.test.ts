/*
 * Copyright (c) 2020 Erik Fortune
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

import { Converters as ExtraConverters } from '@fgv/ts-extras';
import { Converters, Validators, succeed } from '@fgv/ts-utils';
import { IMockFileConfig, MockFileSystem } from '@fgv/ts-utils-jest/lib/helpers/fsHelpers';
import fs from 'fs';
import { JsonFile, JsonValue } from '../..';

describe('JsonFsHelper class', () => {
  const mockDate = new Date();
  const mockGoodPath = 'path/to/some/file.json';
  const mockGoodPayload = {
    someProperty: 'some value',
    prop: [1, 2],
    now: mockDate.toISOString()
  };

  const mockBadPath = 'path/to/some/malformed.json';
  const mockFsConfig: IMockFileConfig[] = [
    {
      path: mockGoodPath,
      payload: JSON.stringify(mockGoodPayload),
      writable: false
    },
    {
      path: mockBadPath,
      payload: '{ bad json',
      writable: false
    }
  ];

  let helper: JsonFile.JsonFsHelper;

  beforeEach(() => {
    helper = JsonFile.DefaultJsonFsHelper;
  });

  describe('readJsonFileSync function', () => {
    test('returns a requested json file', () => {
      const mockFs = new MockFileSystem(mockFsConfig);
      const spies = mockFs.startSpies();
      expect(helper.readJsonFileSync(mockGoodPath)).toSucceedWith(mockGoodPayload);
      expect(spies.read).toHaveBeenCalledTimes(1);
      spies.restore();
    });

    test('fails for malformed json', () => {
      const mockFs = new MockFileSystem(mockFsConfig);
      const spies = mockFs.startSpies();
      expect(helper.readJsonFileSync(mockBadPath)).toFailWith(/in JSON at position/i);
      expect(spies.read).toHaveBeenCalledTimes(1);
      spies.restore();
    });

    test('propagates any error', () => {
      const path = 'path/to/some/file.json';
      jest.spyOn(fs, 'readFileSync').mockImplementation((gotPath: unknown) => {
        if (typeof gotPath !== 'string') {
          throw new Error('Mock implementation only accepts string');
        }
        expect(gotPath).toContain(path);
        throw new Error('Mock Error!');
      });

      expect(helper.readJsonFileSync(path)).toFailWith(/mock error/i);
    });
  });

  describe('processJsonFileSync function', () => {
    test('converts a well-formed JSON file', () => {
      const mockConverter = Converters.object({
        someProperty: Converters.string,
        prop: Converters.arrayOf(Converters.number),
        now: ExtraConverters.isoDate
      });
      const mockConverted = {
        ...mockGoodPayload,
        now: mockDate
      };

      const mockFs = new MockFileSystem(mockFsConfig);
      const spies = mockFs.startSpies();
      spies.clear();
      expect(helper.convertJsonFileSync(mockGoodPath, mockConverter)).toSucceedWith(mockConverted);
      expect(spies.read).toHaveBeenCalledTimes(1);
      spies.restore();
    });

    test('validates a well-formed JSON file', () => {
      const mockValidator = Validators.object({
        someProperty: Validators.string,
        prop: Validators.arrayOf(Validators.number),
        now: Validators.string
      });
      const mockValidated = {
        ...mockGoodPayload,
        now: mockDate.toISOString()
      };

      const mockFs = new MockFileSystem(mockFsConfig);
      const spies = mockFs.startSpies();
      spies.clear();
      expect(helper.convertJsonFileSync(mockGoodPath, mockValidator)).toSucceedWith(mockValidated);
      expect(spies.read).toHaveBeenCalledTimes(1);
      spies.restore();
    });
  });

  describe('processJsonDirectorySync function', () => {
    interface IThing {
      name: string;
      optionalString?: string;
    }
    describe('with a converter', () => {
      const thing = Converters.object<IThing>(
        {
          name: Converters.string,
          optionalString: Converters.string
        },
        {
          optionalFields: ['optionalString']
        }
      );
      const options = { converter: thing };

      test('reads JSON files from a folder, ignoring non-JSON', () => {
        expect(
          helper.convertJsonDirectorySync('src/test/unit/data/file/good', options)
        ).toSucceedAndMatchSnapshot();
      });

      test('fails for a non-folder', () => {
        expect(
          helper.convertJsonDirectorySync('src/test/unit/data/file/good/thing1.json', options)
        ).toFailWith(/not a directory/i);
      });

      test('fails by default if any of the items in the folder fail conversion', () => {
        expect(helper.convertJsonDirectorySync('src/test/unit/data/file/bad', options)).toFailWith(
          /bad3.json/i
        );
      });
    });

    describe('with a validator', () => {
      const thing = Validators.object<IThing>(
        {
          name: Validators.string,
          optionalString: Validators.string
        },
        {
          options: {
            optionalFields: ['optionalString']
          }
        }
      );
      const options = { converter: thing };

      test('reads JSON files from a folder, ignoring non-JSON by default', () => {
        expect(helper.convertJsonDirectorySync('src/test/unit/data/file/good', options)).toSucceedAndSatisfy(
          (items) => {
            expect(
              (items as Array<{ filename: string }>).every((item) => item.filename.endsWith('.json'))
            ).toBe(true);
            expect(items).toMatchSnapshot();
          }
        );
      });

      test('reads JSON files from a folder, using file filter if supplied', () => {
        const options2 = { ...options, files: [/.*.txt/] };
        expect(helper.convertJsonDirectorySync('src/test/unit/data/file/good', options2)).toSucceedAndSatisfy(
          (items) => {
            expect(
              (items as Array<{ filename: string }>).every((item) => item.filename.endsWith('.txt'))
            ).toBe(true);
            expect(items).toMatchSnapshot();
          }
        );
      });
    });
  });

  describe('processJsonDirectoryToMapSync function', () => {
    interface IThing {
      name: string;
      optionalString?: string;
    }
    const thing = Converters.object<IThing>({
      name: Converters.string,
      optionalString: Converters.string.optional()
    });
    const options = { converter: thing };

    test('reads JSON files from a folder, ignoring non-JSON by default', () => {
      expect(
        helper.convertJsonDirectoryToMapSync('src/test/unit/data/file/good', options)
      ).toSucceedAndMatchSnapshot();
    });

    test('applies a name transformation to the returned map if supplied', () => {
      const transformName: JsonFile.ItemNameTransformFunction<IThing> = (n, t) => {
        expect(t).toBeDefined();
        return succeed(`thing:${n}`);
      };
      const myOptions = { ...options, transformName };
      expect(
        helper.convertJsonDirectoryToMapSync('src/test/unit/data/file/good', myOptions)
      ).toSucceedAndMatchSnapshot();
    });

    test('fails for a non-folder', () => {
      expect(
        helper.convertJsonDirectoryToMapSync('src/test/unit/data/file/good/thing1.json', options)
      ).toFailWith(/not a directory/i);
    });

    test('fails by default if any of the items in the folder fail conversion', () => {
      expect(helper.convertJsonDirectoryToMapSync('src/test/unit/data/file/bad', options)).toFailWith(
        /bad3.json/i
      );
    });
  });

  describe('writeJsonFileSync function', () => {
    test('saves to the requested json file', () => {
      const path = 'path/to/some/file.json';
      const payload = { someProperty: 'some value', prop: [1, 2] };
      const spy = jest
        .spyOn(fs, 'writeFileSync')
        .mockImplementation((gotPath: unknown, gotPayload: unknown) => {
          if (typeof gotPath !== 'string' || typeof gotPayload !== 'string') {
            throw new Error('Mock implementation only accepts string');
          }
          expect(gotPath).toContain(path);
          expect(JSON.parse(gotPayload)).toEqual(payload);
        });

      expect(helper.writeJsonFileSync(path, payload)).toSucceedWith(true);
      spy.mockRestore();
    });

    test('fails for undefined by default', () => {
      const path = 'path/to/some/file.json';
      const payload = undefined;
      const spy = jest
        .spyOn(fs, 'writeFileSync')
        .mockImplementation((gotPath: unknown, gotPayload: unknown) => {
          if (typeof gotPath !== 'string') {
            throw new Error('Mock implementation only accepts string');
          }
          expect(gotPath).toContain(path);
          expect(gotPayload).toBeUndefined();
        });

      expect(helper.writeJsonFileSync(path, payload as unknown as JsonValue)).toFailWith(
        /could not stringify undefined/i
      );
      spy.mockRestore();
    });

    test('saves undefined if configured', () => {
      helper = new JsonFile.JsonFsHelper({ allowUndefinedWrite: true });
      const path = 'path/to/some/file.json';
      const payload = undefined;
      const spy = jest
        .spyOn(fs, 'writeFileSync')
        .mockImplementation((gotPath: unknown, gotPayload: unknown) => {
          if (typeof gotPath !== 'string') {
            throw new Error('Mock implementation only accepts string');
          }
          expect(gotPath).toContain(path);
          expect(gotPayload).toBeUndefined();
        });

      expect(helper.writeJsonFileSync(path, payload as unknown as JsonValue)).toSucceedWith(true);
      spy.mockRestore();
    });

    test('propagates an error', () => {
      const path = 'path/to/some/file.json';
      const payload = { someProperty: 'some value', prop: [1, 2] };
      const spy = jest.spyOn(fs, 'writeFileSync').mockImplementation((gotPath: unknown) => {
        if (typeof gotPath !== 'string') {
          throw new Error('Mock implementation only accepts string');
        }
        expect(gotPath).toContain(path);
        throw new Error('Mock Error!');
      });

      expect(helper.writeJsonFileSync(path, payload)).toFailWith(/mock error/i);
      spy.mockRestore();
    });
  });
});
