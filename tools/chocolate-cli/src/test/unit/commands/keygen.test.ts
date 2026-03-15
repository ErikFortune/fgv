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
const mockMkdirSync = jest.fn();
jest.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args)
}));

const mockGenerateKey = jest.fn();
const mockDeriveKey = jest.fn();
jest.mock('@fgv/ts-extras', () => {
  const actual = jest.requireActual('@fgv/ts-extras');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CryptoUtils: {
      ...actual.CryptoUtils,
      nodeCryptoProvider: {
        ...actual.CryptoUtils.nodeCryptoProvider,
        generateKey: mockGenerateKey,
        deriveKey: mockDeriveKey
      }
    }
  };
});

const mockYamlParse = jest.fn();
const mockYamlStringify = jest.fn();
jest.mock('yaml', () => ({
  parse: mockYamlParse,
  stringify: mockYamlStringify
}));

import { succeed, fail } from '@fgv/ts-utils';
import { createKeygenCommand } from '../../../commands/keygen';

describe('keygen command', () => {
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

    // Default: generateKey succeeds
    const mockKey = new Uint8Array(32);
    mockKey.fill(1);
    mockGenerateKey.mockResolvedValue(succeed(mockKey));
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  test('generates random key and outputs as base64', async () => {
    const cmd = createKeygenCommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockGenerateKey).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/^[A-Za-z0-9+/]+=*$/));
  });

  test('generates random key and outputs as hex', async () => {
    const cmd = createKeygenCommand();
    await cmd.parseAsync(['--format', 'hex'], { from: 'user' });

    expect(mockGenerateKey).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/^[0-9a-f]+$/));
  });

  test('exits with error when --update without --name', async () => {
    const cmd = createKeygenCommand();

    try {
      await cmd.parseAsync(['--update', 'secrets.yaml'], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('--name is required'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('updates existing secrets file with new entry', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('existing: { key: "abc123" }');
    mockYamlParse.mockReturnValue({ existing: { key: 'abc123' } });
    mockYamlStringify.mockReturnValue('updated-content');

    const cmd = createKeygenCommand();
    await cmd.parseAsync(['--update', 'secrets.yaml', '--name', 'new-secret'], { from: 'user' });

    expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('secrets.yaml'), 'utf-8');
    expect(mockYamlParse).toHaveBeenCalled();
    const stringifyArg = mockYamlStringify.mock.calls[0][0] as Record<string, unknown>;
    expect(stringifyArg).toHaveProperty('existing');
    expect(stringifyArg).toHaveProperty('new-secret');
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('secrets.yaml'),
      'updated-content',
      'utf-8'
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Added secret "new-secret"'));
  });

  test('creates new secrets file when it does not exist', async () => {
    const secretName = 'my-secret';
    mockExistsSync.mockReturnValue(false);
    mockYamlStringify.mockReturnValue('new-content');

    const cmd = createKeygenCommand();
    await cmd.parseAsync(['--update', 'secrets.yaml', '--name', secretName], { from: 'user' });

    expect(mockExistsSync).toHaveBeenCalled();
    expect(mockReadFileSync).not.toHaveBeenCalled();
    expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    const stringifyArg = mockYamlStringify.mock.calls[0][0] as Record<string, unknown>;
    expect(stringifyArg[secretName]).toBeDefined();
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining(`Added secret "${secretName}"`));
  });

  test('updates existing entry in secrets file', async () => {
    const secretName = 'my-secret';
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('my-secret: { key: "old-key" }');
    mockYamlParse.mockReturnValue({ [secretName]: { key: 'old-key' } });
    mockYamlStringify.mockReturnValue('updated-content');

    const cmd = createKeygenCommand();
    await cmd.parseAsync(['--update', 'secrets.yaml', '--name', 'my-secret'], { from: 'user' });

    const stringifyArg = mockYamlStringify.mock.calls[0][0] as Record<string, { key: string }>;
    expect(stringifyArg[secretName]).toBeDefined();
    expect(stringifyArg[secretName].key).not.toBe('old-key');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Updated secret "my-secret"'));
  });

  test('exits with error when key generation fails', async () => {
    mockGenerateKey.mockResolvedValue(fail('Crypto provider error'));

    const cmd = createKeygenCommand();

    try {
      await cmd.parseAsync([], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Crypto provider error'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('exits with error when secrets file read fails', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockImplementation(() => {
      throw new Error('File read error');
    });

    const cmd = createKeygenCommand();

    try {
      await cmd.parseAsync(['--update', 'secrets.yaml', '--name', 'my-secret'], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to read secrets file'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('exits with error when secrets file write fails', async () => {
    mockExistsSync.mockReturnValue(false);
    mockYamlStringify.mockReturnValue('content');
    mockWriteFileSync.mockImplementation(() => {
      throw new Error('Write error');
    });

    const cmd = createKeygenCommand();

    try {
      await cmd.parseAsync(['--update', 'secrets.yaml', '--name', 'my-secret'], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to write secrets file'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('reads YAML secrets file', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('secret1: { key: "key1" }');
    mockYamlParse.mockReturnValue({ secret1: { key: 'key1' } });
    mockYamlStringify.mockReturnValue('updated');
    mockMkdirSync.mockReturnValue(undefined);
    mockWriteFileSync.mockReturnValue(undefined);

    const cmd = createKeygenCommand();
    await cmd.parseAsync(['--update', 'secrets.yml', '--name', 'secret2'], { from: 'user' });

    expect(mockYamlParse).toHaveBeenCalledWith('secret1: { key: "key1" }');
    expect(mockYamlStringify).toHaveBeenCalled();
  });

  test('reads JSON secrets file', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('{"secret1": {"key": "key1"}}');
    mockMkdirSync.mockReturnValue(undefined);
    mockWriteFileSync.mockReturnValue(undefined);

    const cmd = createKeygenCommand();
    await cmd.parseAsync(['--update', 'secrets.json', '--name', 'secret2'], { from: 'user' });

    expect(mockYamlParse).not.toHaveBeenCalled();
    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('secrets.json'),
      expect.any(String),
      'utf-8'
    );
    expect(writtenContent).toContain('"secret1"');
    expect(writtenContent).toContain('"secret2"');
  });

  test('returns empty object for non-existent secrets file', async () => {
    mockExistsSync.mockReturnValue(false);
    mockYamlStringify.mockReturnValue('my-secret: { key: "xyz" }');
    mockMkdirSync.mockReturnValue(undefined);
    mockWriteFileSync.mockReturnValue(undefined);

    const cmd = createKeygenCommand();
    await cmd.parseAsync(['--update', 'new-secrets.yaml', '--name', 'my-secret'], { from: 'user' });

    expect(mockReadFileSync).not.toHaveBeenCalled();
    const stringifyArg = mockYamlStringify.mock.calls[0][0] as Record<string, unknown>;
    expect(stringifyArg).toHaveProperty('my-secret');
  });

  test('writes YAML secrets file based on extension', async () => {
    const secretName = 'my-secret';
    mockExistsSync.mockReturnValue(false);
    mockYamlStringify.mockReturnValue('yaml-content');

    const cmd = createKeygenCommand();
    await cmd.parseAsync(['--update', 'secrets.yaml', '--name', secretName], { from: 'user' });

    expect(mockYamlStringify).toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledWith(expect.any(String), 'yaml-content', 'utf-8');
  });

  test('exits with error for unsupported file extension', async () => {
    mockExistsSync.mockReturnValue(false);

    const cmd = createKeygenCommand();

    try {
      await cmd.parseAsync(['--update', 'secrets.txt', '--name', 'my-secret'], { from: 'user' });
    } catch {
      // Expected - process.exit throws
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Unsupported file extension'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('does not output key to console when using --update', async () => {
    mockExistsSync.mockReturnValue(false);
    mockYamlStringify.mockReturnValue('content');

    const cmd = createKeygenCommand();
    await cmd.parseAsync(['--update', 'secrets.yaml', '--name', 'my-secret'], { from: 'user' });

    // Should not log the key itself, only the success message
    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Added secret'));
  });
});
