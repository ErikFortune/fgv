jest.mock('readline', () => ({
  createInterface: jest.fn()
}));

import '@fgv/ts-utils-jest';

import os from 'os';
import path from 'path';
import * as readline from 'readline';

import { defaultKeystorePath, promptVisible, resolvePath } from '../../src/io';

describe('io helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('defaultKeystorePath uses the home keystore name', () => {
    expect(defaultKeystorePath()).toBe(path.join(os.homedir(), '.fgv-ks'));
  });

  test('resolvePath expands tilde paths', () => {
    const resolved = resolvePath('~/fgv-ks-test');
    expect(resolved).not.toContain('~');
  });

  test('promptVisible rejects when stdin is not a TTY', async () => {
    const originalStdin = process.stdin;
    Object.defineProperty(process, 'stdin', {
      configurable: true,
      value: { isTTY: false }
    });

    try {
      const result = await promptVisible('Secret name: ');
      expect(result).toFailWith(/interactive prompt requires a TTY/i);
    } finally {
      Object.defineProperty(process, 'stdin', {
        configurable: true,
        value: originalStdin
      });
    }
  });

  test('promptVisible writes the prompt to stderr and resolves the entered value', async () => {
    const originalStdin = process.stdin;
    const question = jest.fn((query: string, callback: (answer: string) => void) => {
      callback('api-key');
    });
    const close = jest.fn();
    const on = jest.fn();
    const createInterfaceMock = jest.mocked(readline.createInterface);
    createInterfaceMock.mockReturnValue({
      close,
      on,
      question
    } as unknown as readline.Interface);
    const stderrWriteSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    Object.defineProperty(process, 'stdin', {
      configurable: true,
      value: { isTTY: true }
    });

    try {
      const result = await promptVisible('Secret name: ');
      expect(result).toSucceedAndSatisfy((value) => {
        expect(value).toBe('api-key');
      });
      expect(createInterfaceMock).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stderr,
        terminal: true
      });
      expect(question).toHaveBeenCalledWith('Secret name: ', expect.any(Function));
      expect(close).toHaveBeenCalledTimes(1);
      expect(stderrWriteSpy).toHaveBeenCalledWith('\n');
    } finally {
      Object.defineProperty(process, 'stdin', {
        configurable: true,
        value: originalStdin
      });
    }
  });
});
