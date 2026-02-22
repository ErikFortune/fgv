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

const mockTryDecryptFile = jest.fn();
jest.mock('@fgv/ts-extras', () => {
  const actual = jest.requireActual('@fgv/ts-extras');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CryptoUtils: {
      ...actual.CryptoUtils,
      tryDecryptFile: mockTryDecryptFile,
      nodeCryptoProvider: actual.CryptoUtils.nodeCryptoProvider
    }
  };
});

const mockIsEncryptedCollectionFile = jest.fn();
jest.mock('@fgv/ts-chocolate', () => {
  const actual = jest.requireActual('@fgv/ts-chocolate');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    LibraryData: {
      ...actual.LibraryData,
      isEncryptedCollectionFile: mockIsEncryptedCollectionFile
    }
  };
});

jest.mock('yaml', () => ({
  parse: jest.fn((content: string) => JSON.parse(content)),
  stringify: jest.fn((obj: unknown) => JSON.stringify(obj))
}));

import { succeed, fail } from '@fgv/ts-utils';
import { createFetchDataCommand } from '../../../commands/fetchData';

describe('fetchData command', () => {
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
    mockTryDecryptFile.mockReset();
    mockIsEncryptedCollectionFile.mockReset();
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('option validation', () => {
    test('rejects when no key source provided', async () => {
      const originalEnv = process.env.CHOCO_ENCRYPTION_KEY;
      delete process.env.CHOCO_ENCRYPTION_KEY;

      const cmd = createFetchDataCommand();

      await expect(
        cmd.parseAsync(['fetch-data', '--source', '/src', '--dest', '/dst'], { from: 'user' })
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('No decryption key provided'));
      expect(mockExit).toHaveBeenCalledWith(1);

      if (originalEnv !== undefined) {
        process.env.CHOCO_ENCRYPTION_KEY = originalEnv;
      }
    });
  });

  describe('source directory validation', () => {
    test('rejects when source directory does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const cmd = createFetchDataCommand();

      await expect(
        cmd.parseAsync(['fetch-data', '--source', '/nonexistent', '--dest', '/dst', '--key', validKey], {
          from: 'user'
        })
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

    test('handles no JSON files found', async () => {
      mockReaddirSync.mockReturnValue([]);

      const cmd = createFetchDataCommand();

      await cmd.parseAsync(['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey], {
        from: 'user'
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No JSON files found'));
      expect(mockExit).not.toHaveBeenCalled();
    });

    test('decrypts encrypted file with --key', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ secretName: 'test-secret', encryptedData: 'abc', algorithm: 'aes-256-gcm' })
      );
      mockIsEncryptedCollectionFile.mockReturnValue(true);
      mockTryDecryptFile.mockResolvedValue(succeed([{ id: '1' }]));

      const cmd = createFetchDataCommand();

      await cmd.parseAsync(['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey], {
        from: 'user'
      });

      expect(mockTryDecryptFile).toHaveBeenCalled();
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('data.yaml'),
        expect.any(String),
        'utf-8'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Decrypted: data.json -> data.yaml')
      );
    });

    test('decrypts encrypted file using secrets-file lookup', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync
        // eslint-disable-next-line @typescript-eslint/naming-convention
        .mockReturnValueOnce(JSON.stringify({ 'test-secret': validKey }))
        .mockReturnValueOnce(
          JSON.stringify({ secretName: 'test-secret', encryptedData: 'abc', algorithm: 'aes-256-gcm' })
        );
      mockIsEncryptedCollectionFile.mockReturnValue(true);
      mockTryDecryptFile.mockResolvedValue(succeed([{ id: '1' }]));

      const cmd = createFetchDataCommand();

      await cmd.parseAsync(
        ['fetch-data', '--source', '/src', '--dest', '/dst', '--secrets-file', '/secrets.yaml'],
        { from: 'user' }
      );

      expect(mockTryDecryptFile).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Decrypted'));
    });

    test('copies plain file when not --skip-plain', async () => {
      mockReaddirSync.mockReturnValue([createDirent('plain.json', false)]);
      mockReadFileSync.mockReturnValue(JSON.stringify([{ id: '1' }]));
      mockIsEncryptedCollectionFile.mockReturnValue(false);

      const cmd = createFetchDataCommand();

      await cmd.parseAsync(['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey], {
        from: 'user'
      });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('plain.yaml'),
        expect.any(String),
        'utf-8'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Copied: plain.json'));
    });

    test('skips plain file when --skip-plain', async () => {
      mockReaddirSync.mockReturnValue([createDirent('plain.json', false)]);
      mockReadFileSync.mockReturnValue(JSON.stringify([{ id: '1' }]));
      mockIsEncryptedCollectionFile.mockReturnValue(false);

      const cmd = createFetchDataCommand();

      await cmd.parseAsync(
        ['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey, '--skip-plain'],
        { from: 'user' }
      );

      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Skipped (not encrypted)'));
    });

    test('outputs as YAML by default (converts .json to .yaml)', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockReturnValue(JSON.stringify([{ id: '1' }]));
      mockIsEncryptedCollectionFile.mockReturnValue(false);

      const cmd = createFetchDataCommand();

      await cmd.parseAsync(['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey], {
        from: 'user'
      });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('data.yaml'),
        expect.any(String),
        'utf-8'
      );
    });

    test('outputs as JSON when -f json', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockReturnValue(JSON.stringify([{ id: '1' }]));
      mockIsEncryptedCollectionFile.mockReturnValue(false);

      const cmd = createFetchDataCommand();

      await cmd.parseAsync(
        ['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey, '-f', 'json'],
        { from: 'user' }
      );

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('data.json'),
        expect.any(String),
        'utf-8'
      );
    });

    test('handles decryption failure and continues processing', async () => {
      mockReaddirSync.mockReturnValue([
        createDirent('fail.json', false),
        createDirent('success.json', false)
      ]);
      mockReadFileSync
        .mockReturnValueOnce(
          JSON.stringify({ secretName: 'test-secret', encryptedData: 'abc', algorithm: 'aes-256-gcm' })
        )
        .mockReturnValueOnce(
          JSON.stringify({ secretName: 'test-secret', encryptedData: 'xyz', algorithm: 'aes-256-gcm' })
        );
      mockIsEncryptedCollectionFile.mockReturnValue(true);
      mockTryDecryptFile
        .mockResolvedValueOnce(fail('Decryption failed'))
        .mockResolvedValueOnce(succeed([{ id: '1' }]));

      const cmd = createFetchDataCommand();

      await expect(
        cmd.parseAsync(['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey], {
          from: 'user'
        })
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('ERROR: fail.json'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Decrypted: success.json'));
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('errors when encrypted file missing secretName', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockReturnValue(JSON.stringify({ encryptedData: 'abc', algorithm: 'aes-256-gcm' }));
      mockIsEncryptedCollectionFile.mockReturnValue(true);

      const cmd = createFetchDataCommand();

      await expect(
        cmd.parseAsync(['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey], {
          from: 'user'
        })
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Encrypted file missing secretName')
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('errors when secret not found in secrets file', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify({ otherSecret: validKey }))
        .mockReturnValueOnce(
          JSON.stringify({ secretName: 'missing-secret', encryptedData: 'abc', algorithm: 'aes-256-gcm' })
        );
      mockIsEncryptedCollectionFile.mockReturnValue(true);

      const cmd = createFetchDataCommand();

      await expect(
        cmd.parseAsync(
          ['fetch-data', '--source', '/src', '--dest', '/dst', '--secrets-file', '/secrets.yaml'],
          { from: 'user' }
        )
      ).rejects.toThrow('process.exit');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('No key found for secret "missing-secret"')
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('dry-run mode shows what would be done', async () => {
      mockReaddirSync.mockReturnValue([createDirent('data.json', false)]);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ secretName: 'test-secret', encryptedData: 'abc', algorithm: 'aes-256-gcm' })
      );
      mockIsEncryptedCollectionFile.mockReturnValue(true);
      mockTryDecryptFile.mockResolvedValue(succeed([{ id: '1' }]));

      const cmd = createFetchDataCommand();

      await cmd.parseAsync(
        ['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey, '--dry-run'],
        { from: 'user' }
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Would decrypt: data.json'));
      expect(mockWriteFileSync).not.toHaveBeenCalled();
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

      const cmd = createFetchDataCommand();

      await expect(
        cmd.parseAsync(['fetch-data', '--source', '/src', '--dest', '/dst', '--key', validKey], {
          from: 'user'
        })
      ).rejects.toThrow('process.exit');

      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
