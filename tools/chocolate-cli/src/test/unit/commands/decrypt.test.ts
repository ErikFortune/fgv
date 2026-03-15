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

// Mocks before imports
jest.mock('@inquirer/prompts', () => ({
  search: jest.fn()
}));

const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();
jest.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args)
}));

const mockDecryptFile = jest.fn();
const mockDeriveKey = jest.fn();
jest.mock('@fgv/ts-extras', () => {
  const actual = jest.requireActual('@fgv/ts-extras');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CryptoUtils: {
      ...actual.CryptoUtils,
      decryptFile: mockDecryptFile,
      nodeCryptoProvider: {
        ...actual.CryptoUtils.nodeCryptoProvider,
        deriveKey: mockDeriveKey
      }
    }
  };
});

const mockIsEncryptedCollectionFile = jest.fn();
const mockEncryptedCollectionFileConvert = jest.fn();
jest.mock('@fgv/ts-chocolate', () => {
  const actual = jest.requireActual('@fgv/ts-chocolate');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    LibraryData: {
      ...actual.LibraryData,
      isEncryptedCollectionFile: mockIsEncryptedCollectionFile,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Converters: {
        ...actual.LibraryData?.Converters,
        encryptedCollectionFile: {
          convert: mockEncryptedCollectionFileConvert
        }
      }
    }
  };
});

import { succeed, fail } from '@fgv/ts-utils';
import { createDecryptCommand } from '../../../commands/decrypt';

describe('decrypt command', () => {
  const validKey = Buffer.from(new Uint8Array(32)).toString('base64');
  const validEncryptedFile = {
    format: 'encrypted-collection',
    version: '1.0',
    secretName: 'my-secret',
    encrypted: 'encrypted-data'
  };
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as unknown as () => never);

    // Default successful behavior
    mockReadFileSync.mockReturnValue(JSON.stringify(validEncryptedFile));
    mockWriteFileSync.mockImplementation();
    mockIsEncryptedCollectionFile.mockReturnValue(true);
    mockEncryptedCollectionFileConvert.mockReturnValue(succeed(validEncryptedFile));
    mockDecryptFile.mockResolvedValue(succeed({ decrypted: 'data' }));
    mockDeriveKey.mockResolvedValue(succeed(new Uint8Array(32)));
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  test('neither key nor password → error "Either --key or --password"', async () => {
    const cmd = createDecryptCommand();

    try {
      await cmd.parseAsync(['input.json'], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Either --key or --password must be provided/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockDecryptFile).not.toHaveBeenCalled();
  });

  test('both key and password → error "Cannot specify both"', async () => {
    const cmd = createDecryptCommand();

    try {
      await cmd.parseAsync(['input.json', '-k', validKey, '-p', 'password'], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Cannot specify both --key and --password/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockDecryptFile).not.toHaveBeenCalled();
  });

  test('successful decryption with --key', async () => {
    const cmd = createDecryptCommand();
    await cmd.parseAsync(['input.json', '-k', validKey], { from: 'user' });

    expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('input.json'), 'utf-8');
    expect(mockIsEncryptedCollectionFile).toHaveBeenCalled();
    expect(mockEncryptedCollectionFileConvert).toHaveBeenCalled();
    expect(mockDecryptFile).toHaveBeenCalledWith(
      validEncryptedFile,
      expect.any(Uint8Array),
      expect.anything()
    );
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Successfully decrypted'));
  });

  test('writes to output file when -o specified', async () => {
    const cmd = createDecryptCommand();
    await cmd.parseAsync(['input.json', '-k', validKey, '-o', 'output.json'], { from: 'user' });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('output.json'),
      expect.any(String),
      'utf-8'
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('input.json -> output.json'));
  });

  test('overwrites input when no -o (default)', async () => {
    const cmd = createDecryptCommand();
    await cmd.parseAsync(['input.json', '-k', validKey], { from: 'user' });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('input.json'),
      expect.any(String),
      'utf-8'
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('input.json -> input.json'));
  });

  test('file not found → error', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT: file not found');
    });

    const cmd = createDecryptCommand();
    try {
      await cmd.parseAsync(['missing.json', '-k', validKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to read JSON file.*missing\.json/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockDecryptFile).not.toHaveBeenCalled();
  });

  test('file is not encrypted collection → error', async () => {
    mockIsEncryptedCollectionFile.mockReturnValue(false);

    const cmd = createDecryptCommand();
    try {
      await cmd.parseAsync(['plain.json', '-k', validKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringMatching(/not an encrypted collection file/i));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockDecryptFile).not.toHaveBeenCalled();
  });

  test('invalid encrypted file format → error', async () => {
    mockEncryptedCollectionFileConvert.mockReturnValue(fail('Missing required field: encrypted'));

    const cmd = createDecryptCommand();
    try {
      await cmd.parseAsync(['invalid.json', '-k', validKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Invalid encrypted file format.*Missing required field/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockDecryptFile).not.toHaveBeenCalled();
  });

  test('invalid key length → error', async () => {
    const invalidKey = Buffer.from(new Uint8Array(16)).toString('base64');
    const cmd = createDecryptCommand();

    try {
      await cmd.parseAsync(['input.json', '-k', invalidKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Invalid key.*32 bytes.*got 16 bytes/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockDecryptFile).not.toHaveBeenCalled();
  });

  test('decryption failure → error', async () => {
    mockDecryptFile.mockResolvedValue(fail('Decryption algorithm failed'));

    const cmd = createDecryptCommand();
    try {
      await cmd.parseAsync(['input.json', '-k', validKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Decryption failed.*Decryption algorithm failed/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('write failure → error', async () => {
    mockWriteFileSync.mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    const cmd = createDecryptCommand();
    try {
      await cmd.parseAsync(['input.json', '-k', validKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to write file.*input\.json/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('password mode with keyDerivation params → derives key and decrypts', async () => {
    const fileWithKeyDerivation = {
      ...validEncryptedFile,
      keyDerivation: {
        kdf: 'pbkdf2',
        salt: 'test-salt-base64',
        iterations: 100000
      }
    };
    mockReadFileSync.mockReturnValue(JSON.stringify(fileWithKeyDerivation));
    mockEncryptedCollectionFileConvert.mockReturnValue(succeed(fileWithKeyDerivation));

    const cmd = createDecryptCommand();
    await cmd.parseAsync(['input.json', '-p', 'my-password'], { from: 'user' });

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Deriving key using pbkdf2 with 100000 iterations/i)
    );
    expect(mockDeriveKey).toHaveBeenCalledWith('my-password', expect.any(Uint8Array), 100000);
    expect(mockDecryptFile).toHaveBeenCalledWith(
      fileWithKeyDerivation,
      expect.any(Uint8Array),
      expect.anything()
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Successfully decrypted'));
  });

  test('password mode without keyDerivation params → error with hint', async () => {
    mockEncryptedCollectionFileConvert.mockReturnValue(
      succeed({
        ...validEncryptedFile,
        keyDerivation: undefined
      })
    );

    const cmd = createDecryptCommand();
    try {
      await cmd.parseAsync(['input.json', '-p', 'my-password'], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/does not contain key derivation parameters/i)
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Hint.*Use --key instead of --password/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockDeriveKey).not.toHaveBeenCalled();
    expect(mockDecryptFile).not.toHaveBeenCalled();
  });
});
