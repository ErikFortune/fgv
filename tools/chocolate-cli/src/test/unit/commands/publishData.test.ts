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

jest.mock('@inquirer/prompts', () => ({
  search: jest.fn()
}));

const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockExistsSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockMkdirSync = jest.fn();
jest.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args)
}));

const mockCreateEncryptedFile = jest.fn();
jest.mock('@fgv/ts-extras', () => {
  const actual = jest.requireActual('@fgv/ts-extras');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CryptoUtils: {
      ...actual.CryptoUtils,
      createEncryptedFile: mockCreateEncryptedFile,
      nodeCryptoProvider: actual.CryptoUtils.nodeCryptoProvider
    }
  };
});

jest.mock('yaml', () => ({
  parse: jest.fn((content: string) => JSON.parse(content)),
  stringify: jest.fn((obj: unknown) => JSON.stringify(obj))
}));

import { succeed, fail } from '@fgv/ts-utils';
import { createPublishDataCommand } from '../../../commands/publishData';

describe('publishData command', () => {
  let mockExit: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  const validKey = Buffer.from(new Uint8Array(32)).toString('base64');

  function createDirent(
    name: string,
    isDir: boolean
  ): { name: string; isDirectory: () => boolean; isFile: () => boolean } {
    return {
      name,
      isDirectory: () => isDir,
      isFile: () => !isDir
    };
  }

  beforeEach(() => {
    mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as unknown as () => never);
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {
      // Intentionally empty
    });
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // Intentionally empty
    });

    mockReadFileSync.mockReset();
    mockWriteFileSync.mockReset();
    mockExistsSync.mockReset();
    mockReaddirSync.mockReset();
    mockMkdirSync.mockReset();
    mockCreateEncryptedFile.mockReset();
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('option validation', () => {
    test('rejects --secrets-file with --secret-name', async () => {
      const cmd = createPublishDataCommand();

      await expect(
        cmd.parseAsync(
          [
            'publish-data',
            '--source',
            '/src',
            '--dest',
            '/dst',
            '--secrets-file',
            '/secrets.yaml',
            '--secret-name',
            'test-secret'
          ],
          { from: 'user' }
        )
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error: Cannot use --secrets-file with --secret-name or --key'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('rejects --secrets-file with --key', async () => {
      const cmd = createPublishDataCommand();

      await expect(
        cmd.parseAsync(
          [
            'publish-data',
            '--source',
            '/src',
            '--dest',
            '/dst',
            '--secrets-file',
            '/secrets.yaml',
            '--key',
            validKey
          ],
          { from: 'user' }
        )
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error: Cannot use --secrets-file with --secret-name or --key'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('rejects when no --secrets-file and no --secret-name', async () => {
      const cmd = createPublishDataCommand();

      await expect(
        cmd.parseAsync(['publish-data', '--source', '/src', '--dest', '/dst'], { from: 'user' })
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error: Must provide either --secrets-file or --secret-name'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('source directory validation', () => {
    test('rejects when source directory does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const cmd = createPublishDataCommand();

      await expect(
        cmd.parseAsync(
          ['publish-data', '--source', '/nonexistent', '--dest', '/dst', '--secret-name', 'test'],
          { from: 'user' }
        )
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error: Source directory does not exist')
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('file processing', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
    });

    test('handles no data files found in source directory', async () => {
      mockReaddirSync.mockReturnValue([]);

      const cmd = createPublishDataCommand();

      await cmd.parseAsync(['publish-data', '--source', '/src', '--dest', '/dst', '--secret-name', 'test'], {
        from: 'user'
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No data files (YAML/JSON) found'));
      expect(mockExit).not.toHaveBeenCalled();
    });

    test('encrypts single JSON file with --secret-name and --key', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockReturnValue(JSON.stringify({ items: [{ id: '1' }] }));
      mockCreateEncryptedFile.mockResolvedValue(
        succeed({ secretName: 'test', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
      );

      const cmd = createPublishDataCommand();

      await cmd.parseAsync(
        ['publish-data', '--source', '/src', '--dest', '/dst', '--secret-name', 'test', '--key', validKey],
        { from: 'user' }
      );

      expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
        expect.objectContaining({
          content: [{ id: '1' }],
          secretName: 'test'
        })
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('data.json'),
        expect.stringContaining('xyz'),
        'utf-8'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Encrypted: data.json'));
    });

    test('converts YAML path to .json for output', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.yaml', false)]);
      mockReadFileSync.mockReturnValue(JSON.stringify({ items: [{ id: '1' }] }));
      mockCreateEncryptedFile.mockResolvedValue(
        succeed({ secretName: 'test', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
      );

      const cmd = createPublishDataCommand();

      await cmd.parseAsync(
        ['publish-data', '--source', '/src', '--dest', '/dst', '--secret-name', 'test', '--key', validKey],
        { from: 'user' }
      );

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('data.json'),
        expect.any(String),
        'utf-8'
      );
    });

    test('handles encryption failure for individual file and continues processing', async () => {
      mockReaddirSync.mockReturnValue([
        createDirent('fail.json', false),
        createDirent('success.json', false)
      ]);
      mockReadFileSync.mockReturnValue(JSON.stringify({ items: [{ id: '1' }] }));
      mockCreateEncryptedFile
        .mockResolvedValueOnce(fail('Encryption failed'))
        .mockResolvedValueOnce(
          succeed({ secretName: 'test', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
        );

      const cmd = createPublishDataCommand();

      await expect(
        cmd.parseAsync(
          ['publish-data', '--source', '/src', '--dest', '/dst', '--secret-name', 'test', '--key', validKey],
          { from: 'user' }
        )
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('ERROR: fail.json'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Encrypted: success.json'));
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('handles file read error and continues processing', async () => {
      mockReaddirSync.mockReturnValue([
        createDirent('fail.json', false),
        createDirent('success.json', false)
      ]);
      mockReadFileSync.mockImplementation((path: unknown) => {
        if (typeof path === 'string' && path.includes('fail.json')) {
          throw new Error('File read error');
        }
        return JSON.stringify({ items: [{ id: '1' }] });
      });
      mockCreateEncryptedFile.mockResolvedValue(
        succeed({ secretName: 'test', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
      );

      const cmd = createPublishDataCommand();

      await expect(
        cmd.parseAsync(
          ['publish-data', '--source', '/src', '--dest', '/dst', '--secret-name', 'test', '--key', validKey],
          { from: 'user' }
        )
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('ERROR: fail.json'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Encrypted: success.json'));
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('dry-run mode shows what would be done without writing files', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockReturnValue(JSON.stringify({ items: [{ id: '1' }] }));
      mockCreateEncryptedFile.mockResolvedValue(
        succeed({ secretName: 'test', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
      );

      const cmd = createPublishDataCommand();

      await cmd.parseAsync(
        [
          'publish-data',
          '--source',
          '/src',
          '--dest',
          '/dst',
          '--secret-name',
          'test',
          '--key',
          validKey,
          '--dry-run'
        ],
        { from: 'user' }
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Would encrypt: data.json'));
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });
  });

  describe('metadata-based secret resolution', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
    });

    test('uses metadata.secretName when present in source file', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify({ 'test-secret': validKey }))
        .mockReturnValueOnce(
          JSON.stringify({ metadata: { secretName: 'test-secret' }, items: [{ id: '1' }] })
        );
      mockCreateEncryptedFile.mockResolvedValue(
        succeed({ secretName: 'test-secret', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
      );

      const cmd = createPublishDataCommand();

      await cmd.parseAsync([
        'publish-data',
        '--source',
        '/src',
        '--dest',
        '/dst',
        '--secrets-file',
        '/secrets.yaml'
      ]);

      expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
        expect.objectContaining({
          secretName: 'test-secret'
        })
      );
    });

    test('errors when secret from metadata not found in secrets file', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify({ 'other-secret': validKey }))
        .mockReturnValueOnce(
          JSON.stringify({ metadata: { secretName: 'missing-secret' }, items: [{ id: '1' }] })
        );

      const cmd = createPublishDataCommand();

      await expect(
        cmd.parseAsync([
          'publish-data',
          '--source',
          '/src',
          '--dest',
          '/dst',
          '--secrets-file',
          '/secrets.yaml'
        ])
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('No key found for secret "missing-secret"')
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('directory-based secret resolution', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
    });

    test('resolves secret name from directory with --secrets-file', async () => {
      mockReaddirSync
        .mockReturnValueOnce([createDirent('subdir', true)])
        .mockReturnValueOnce([createDirent('data.json', false)]);
      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify({ subdir: validKey }))
        .mockReturnValueOnce(JSON.stringify({ items: [{ id: '1' }] }));
      mockCreateEncryptedFile.mockResolvedValue(
        succeed({ secretName: 'subdir', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
      );

      const cmd = createPublishDataCommand();

      await cmd.parseAsync([
        'publish-data',
        '--source',
        '/src',
        '--dest',
        '/dst',
        '--secrets-file',
        '/secrets.yaml'
      ]);

      expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
        expect.objectContaining({
          secretName: 'subdir'
        })
      );
    });
  });

  describe('single-key mode with env var fallback', () => {
    const originalEnv = process.env.CHOCO_ENCRYPTION_KEY;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.CHOCO_ENCRYPTION_KEY = originalEnv;
      } else {
        delete process.env.CHOCO_ENCRYPTION_KEY;
      }
    });

    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
    });

    test('uses env var when --key not provided', async () => {
      process.env.CHOCO_ENCRYPTION_KEY = validKey;

      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockReturnValue(JSON.stringify({ items: [{ id: '1' }] }));
      mockCreateEncryptedFile.mockResolvedValue(
        succeed({ secretName: 'test', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
      );

      const cmd = createPublishDataCommand();

      await cmd.parseAsync(['publish-data', '--source', '/src', '--dest', '/dst', '--secret-name', 'test']);

      expect(mockCreateEncryptedFile).toHaveBeenCalled();
    });
  });

  describe('error count handling', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
    });

    test('exits with code 1 when error count > 0', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Read failed');
      });

      const cmd = createPublishDataCommand();

      await expect(
        cmd.parseAsync([
          'publish-data',
          '--source',
          '/src',
          '--dest',
          '/dst',
          '--secret-name',
          'test',
          '--key',
          validKey
        ])
      ).rejects.toThrow('process.exit');

      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('new format with items wrapper', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
    });

    test('extracts items from new format {items: [...]} wrapper', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ metadata: { version: '1.0' }, items: [{ id: '1' }, { id: '2' }] })
      );
      mockCreateEncryptedFile.mockResolvedValue(
        succeed({ secretName: 'test', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
      );

      const cmd = createPublishDataCommand();

      await cmd.parseAsync([
        'publish-data',
        '--source',
        '/src',
        '--dest',
        '/dst',
        '--secret-name',
        'test',
        '--key',
        validKey
      ]);

      expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
        expect.objectContaining({
          content: [{ id: '1' }, { id: '2' }]
        })
      );
    });
  });
});
