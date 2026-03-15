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
const mockExistsSync = jest.fn();
jest.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  existsSync: (...args: unknown[]) => mockExistsSync(...args)
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

import { succeed, fail } from '@fgv/ts-utils';
import { createEncryptCommand } from '../../../commands/encrypt';

describe('encrypt command', () => {
  const validKey = Buffer.from(new Uint8Array(32)).toString('base64');
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
    mockReadFileSync.mockReturnValue('{"key": "value"}');
    mockWriteFileSync.mockImplementation();
    mockCreateEncryptedFile.mockResolvedValue(succeed({ encrypted: 'data' }));
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  test('encrypts file successfully with valid key', async () => {
    const cmd = createEncryptCommand();
    await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', validKey], { from: 'user' });

    expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('input.json'), 'utf-8');
    expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        content: { key: 'value' },
        secretName: 'my-secret',
        key: expect.any(Uint8Array),
        metadata: undefined
      })
    );
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Successfully encrypted'));
  });

  test('writes to output file when -o specified', async () => {
    const cmd = createEncryptCommand();
    await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', validKey, '-o', 'output.json'], {
      from: 'user'
    });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('output.json'),
      expect.any(String),
      'utf-8'
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('input.json -> output.json'));
  });

  test('overwrites input when no -o (default)', async () => {
    const cmd = createEncryptCommand();
    await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', validKey], { from: 'user' });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('input.json'),
      expect.any(String),
      'utf-8'
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('input.json -> input.json'));
  });

  test('includes metadata when -m flag used', async () => {
    const cmd = createEncryptCommand();
    await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', validKey, '-m'], { from: 'user' });

    expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          collectionId: 'input',
          itemCount: 1
        })
      })
    );
  });

  test('excludes metadata by default', async () => {
    const cmd = createEncryptCommand();
    await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', validKey], { from: 'user' });

    expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: undefined
      })
    );
  });

  test('stores key derivation params when --salt provided', async () => {
    const cmd = createEncryptCommand();
    await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', validKey, '--salt', 'test-salt'], {
      from: 'user'
    });

    expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        keyDerivation: {
          kdf: 'pbkdf2',
          salt: 'test-salt',
          iterations: 100000
        }
      })
    );
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Storing key derivation params'));
  });

  test('uses custom iterations when provided with --salt', async () => {
    const cmd = createEncryptCommand();
    await cmd.parseAsync(
      ['input.json', '-s', 'my-secret', '-k', validKey, '--salt', 'test-salt', '--iterations', '50000'],
      { from: 'user' }
    );

    expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        keyDerivation: {
          kdf: 'pbkdf2',
          salt: 'test-salt',
          iterations: 50000
        }
      })
    );
  });

  test('default iterations is 100000 when --salt but no --iterations', async () => {
    const cmd = createEncryptCommand();
    await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', validKey, '--salt', 'test-salt'], {
      from: 'user'
    });

    expect(mockCreateEncryptedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        keyDerivation: expect.objectContaining({
          iterations: 100000
        })
      })
    );
  });

  test('invalid key (wrong length) → error + exit(1)', async () => {
    const invalidKey = Buffer.from(new Uint8Array(16)).toString('base64');
    const cmd = createEncryptCommand();

    try {
      await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', invalidKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Invalid key.*32 bytes.*got 16 bytes/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockCreateEncryptedFile).not.toHaveBeenCalled();
  });

  test('invalid iterations (NaN) → error + exit(1)', async () => {
    const cmd = createEncryptCommand();

    try {
      await cmd.parseAsync(
        [
          'input.json',
          '-s',
          'my-secret',
          '-k',
          validKey,
          '--salt',
          'test-salt',
          '--iterations',
          'not-a-number'
        ],
        { from: 'user' }
      );
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/iterations must be a positive number/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockCreateEncryptedFile).not.toHaveBeenCalled();
  });

  test('input file read error → error + exit(1)', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT: file not found');
    });

    const cmd = createEncryptCommand();
    try {
      await cmd.parseAsync(['missing.json', '-s', 'my-secret', '-k', validKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to read JSON file.*missing\.json/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    expect(mockCreateEncryptedFile).not.toHaveBeenCalled();
  });

  test('encryption failure → error + exit(1)', async () => {
    mockCreateEncryptedFile.mockResolvedValue(fail('Encryption algorithm failed'));

    const cmd = createEncryptCommand();
    try {
      await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', validKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Encryption failed.*Encryption algorithm failed/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('write failure → error + exit(1)', async () => {
    mockWriteFileSync.mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    const cmd = createEncryptCommand();
    try {
      await cmd.parseAsync(['input.json', '-s', 'my-secret', '-k', validKey], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to write file.*input\.json/i)
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
