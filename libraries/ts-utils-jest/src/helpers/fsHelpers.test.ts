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

import { readFileSync, writeFileSync } from 'fs';
import { MockFileConfig, MockFileSystem } from '..';

describe('MockFileSystem class', () => {
  const configs: MockFileConfig[] = [
    {
      path: 'path/to/backedFile.json',
      backingFile: 'test/data/testData.json',
      writable: false
    },
    {
      path: 'path/to/payloadFile.json',
      payload: '{ "filename": "inlineData" }',
      writable: false
    },
    {
      path: 'path/to/writableFile.json',
      writable: true
    },
    {
      path: 'path/to/writableBackedFile.json',
      backingFile: 'test/data/testData.json',
      writable: true
    },
    {
      path: 'path/to/writablePayloadFile.json',
      payload: '{ "filename": "writableInlineData" }',
      writable: true
    }
  ];

  describe('constructor', () => {
    test('constructs from an array of configs', () => {
      expect(() => new MockFileSystem(configs)).not.toThrowError();
    });
  });

  describe('readMockFileSync method', () => {
    test('reads a backed file', () => {
      const mockFs = new MockFileSystem(configs);
      const received = mockFs.readMockFileSync('path/to/backedFile.json');
      expect(received).toEqual('{\n    "filename": "testData.json",\n    "fromBackingFile": true\n}');
    });

    test('reads a payload file', () => {
      const mockFs = new MockFileSystem(configs);
      expect(mockFs.readMockFileSync('path/to/payloadFile.json')).toEqual('{ "filename": "inlineData" }');
    });

    test('throws for a a file that is not in the config', () => {
      const mockFs = new MockFileSystem(configs);
      expect(() => {
        mockFs.readMockFileSync('./test/data/testData.json');
      }).toThrowError(/mock file not found/i);
    });

    test('throws for a file in the config that has not been written', () => {
      const mockFs = new MockFileSystem(configs);
      expect(() => {
        mockFs.readMockFileSync('path/to/writableFile.json');
      }).toThrowError(/mock file not found/i);
    });

    describe('with mockWriteOnly option set to true', () => {
      test('reads a file that is not in the config but which actually exists', () => {
        const mockFs = new MockFileSystem(configs, { mockWriteOnly: true });
        expect(() => {
          expect(mockFs.readMockFileSync('test/data/testData.json')).toEqual(
            '{\n    "filename": "testData.json",\n    "fromBackingFile": true\n}'
          );
        }).not.toThrow();
      });

      test('fails for a file that is not in the config and does not actually exist', () => {
        const mockFs = new MockFileSystem(configs, { mockWriteOnly: true });
        expect(() => {
          mockFs.readMockFileSync('test/data/notTestData.json');
        }).toThrowError(/no such file or directory/i);
      });
    });
  });

  describe('writeMockFileSync method', () => {
    test('writes a writable mock file', () => {
      const mockFs = new MockFileSystem(configs);
      expect(() => {
        mockFs.readMockFileSync('path/to/writableFile.json');
      }).toThrowError(/mock file not found/i);

      expect(() => {
        mockFs.writeMockFileSync('path/to/writableFile.json', '["payload"]');
      }).not.toThrow();

      expect(mockFs.readMockFileSync('path/to/writableFile.json')).toEqual('["payload"]');
    });

    test('writes a writable backed file', () => {
      const mockFs = new MockFileSystem(configs);

      // file exists before written
      expect(mockFs.readMockFileSync('path/to/writableBackedFile.json')).toEqual(
        '{\n    "filename": "testData.json",\n    "fromBackingFile": true\n}'
      );

      expect(() => {
        mockFs.writeMockFileSync('path/to/writableBackedFile.json', '["payload"]');
      }).not.toThrow();

      expect(mockFs.readMockFileSync('path/to/writableBackedFile.json')).toEqual('["payload"]');
    });

    test('writes a writable payload file', () => {
      const mockFs = new MockFileSystem(configs);

      // file exists before written
      expect(mockFs.readMockFileSync('path/to/writablePayloadFile.json')).toEqual(
        '{ "filename": "writableInlineData" }'
      );
      expect(mockFs.readMockFileSync('path/to/writablePayloadFile.json')).toEqual(
        '{ "filename": "writableInlineData" }'
      );

      expect(() => {
        mockFs.writeMockFileSync('path/to/writableBackedFile.json', '["payload"]');
      }).not.toThrow();

      expect(mockFs.readMockFileSync('path/to/writableBackedFile.json')).toEqual('["payload"]');
    });

    test('fails to write a mock file that is not writable', () => {
      const mockFs = new MockFileSystem(configs);
      expect(() => {
        mockFs.writeMockFileSync('path/to/payloadFile.json', '["payload"]');
      }).toThrowError(/mock permission denied/i);

      expect(mockFs.readMockFileSync('path/to/payloadFile.json')).toEqual('{ "filename": "inlineData" }');
    });

    test('fails to write a file that is not in the config', () => {
      const mockFs = new MockFileSystem(configs);
      expect(() => {
        mockFs.writeMockFileSync('./test.json', '["payload"]');
      }).toThrowError(/mock path not found/i);
    });

    describe('with allowUnknownMockWrite', () => {
      test('fails to write a mock file that is not writable', () => {
        const mockFs = new MockFileSystem(configs, { allowUnknownMockWrite: true });
        expect(() => {
          mockFs.writeMockFileSync('path/to/payloadFile.json', '["payload"]');
        }).toThrowError(/mock permission denied/i);

        expect(mockFs.readMockFileSync('path/to/payloadFile.json')).toEqual('{ "filename": "inlineData" }');
      });

      test('writes a file that is not in the config', () => {
        const mockFs = new MockFileSystem(configs, { allowUnknownMockWrite: true });
        expect(() => {
          mockFs.writeMockFileSync('./test.json', '["payload"]');
        }).not.toThrow();
        expect(mockFs.getExtraFilesWritten()).toEqual([expect.stringContaining('/test.json')]);
        expect(mockFs.tryGetPayload('./test.json')).toEqual('["payload"]');
      });
    });
  });

  describe('reset method', () => {
    test('resets all written files', () => {
      const mockFs = new MockFileSystem(configs);
      // update the files
      mockFs.writeMockFileSync('path/to/writableFile.json', '["payload1"]');
      mockFs.writeMockFileSync('path/to/writableBackedFile.json', '["payload2"]');
      mockFs.writeMockFileSync('path/to/writablePayloadFile.json', '["payload3"]');

      // verify they're updated
      expect(mockFs.readMockFileSync('path/to/writableFile.json')).toEqual('["payload1"]');
      expect(mockFs.readMockFileSync('path/to/writableBackedFile.json')).toEqual('["payload2"]');
      expect(mockFs.readMockFileSync('path/to/writablePayloadFile.json')).toEqual('["payload3"]');

      mockFs.reset();

      // verify they're reset
      expect(() => {
        mockFs.readMockFileSync('path/to/writableFile.json');
      }).toThrowError(/mock file not found/i);
      expect(mockFs.readMockFileSync('path/to/writableBackedFile.json')).toEqual(
        '{\n    "filename": "testData.json",\n    "fromBackingFile": true\n}'
      );
      expect(mockFs.readMockFileSync('path/to/writablePayloadFile.json')).toEqual(
        '{ "filename": "writableInlineData" }'
      );
    });

    describe('with allowUnknownMockWrite', () => {
      test('clears a written extra file', () => {
        const mockFs = new MockFileSystem(configs, { allowUnknownMockWrite: true });
        expect(() => {
          mockFs.writeMockFileSync('./test.json', '["payload"]');
        }).not.toThrow();
        expect(mockFs.getExtraFilesWritten()).toEqual([expect.stringContaining('/test.json')]);
        expect(mockFs.tryGetPayload('./test.json')).toEqual('["payload"]');

        mockFs.reset();

        expect(mockFs.getExtraFilesWritten()).toHaveLength(0);
        expect(mockFs.tryGetPayload('./test.json')).toBeUndefined();
      });
    });
  });

  describe('startSpies method', () => {
    test('starts spies on read/writeFileSync', () => {
      const mockFs = new MockFileSystem(configs);
      const spies = mockFs.startSpies();

      writeFileSync('path/to/writableFile.json', '["payload"]');
      expect(spies.write).toHaveBeenCalled();
      expect(readFileSync('path/to/writableFile.json')).toEqual('["payload"]');
      expect(spies.read).toHaveBeenCalled();

      spies.restore();
    });

    test('spies clear method resets counters', () => {
      const mockFs = new MockFileSystem(configs);
      const spies = mockFs.startSpies();

      writeFileSync('path/to/writableFile.json', '["payload"]');
      expect(spies.write).toHaveBeenCalled();
      expect(readFileSync('path/to/writableFile.json')).toEqual('["payload"]');
      expect(spies.read).toHaveBeenCalled();

      spies.clear();

      expect(spies.write).not.toHaveBeenCalled();
      expect(spies.read).not.toHaveBeenCalled();

      spies.restore();
    });

    test('spies support only path parameters', () => {
      const mockFs = new MockFileSystem(configs);
      const spies = mockFs.startSpies();

      expect(() => writeFileSync(10, '["payload"]')).toThrowError(/mock supports only string/i);
      expect(spies.write).toHaveBeenCalled();

      expect(() => readFileSync(10)).toThrowError(/mock supports only string/i);
      expect(spies.read).toHaveBeenCalled();

      spies.restore();
    });
  });
});
