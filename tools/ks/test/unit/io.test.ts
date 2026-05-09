jest.mock('readline', () => ({
  createInterface: jest.fn()
}));

jest.mock('clipboardy', () => ({
  write: jest.fn()
}));

import '@fgv/ts-utils-jest';

import os from 'os';
import path from 'path';
import * as readline from 'readline';
import clipboardy from 'clipboardy';

import {
  copyTextToClipboard,
  defaultKeystorePath,
  promptHidden,
  promptVisible,
  readAllFromStdin,
  resolvePath
} from '../../src/io';

const clipboardyWriteMock = clipboardy.write as unknown as jest.Mock;

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

  test('promptVisible fails when SIGINT is received', async () => {
    const originalStdin = process.stdin;
    let sigintHandler: (() => void) | undefined;
    const on = jest.fn((event: string, handler: () => void) => {
      if (event === 'SIGINT') {
        sigintHandler = handler;
      }
    });
    const question = jest.fn(() => {
      sigintHandler?.();
    });
    const close = jest.fn();
    const createInterfaceMock = jest.mocked(readline.createInterface);
    createInterfaceMock.mockReturnValue({ close, on, question } as unknown as readline.Interface);
    jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    Object.defineProperty(process, 'stdin', { configurable: true, value: { isTTY: true } });

    try {
      const result = await promptVisible('Secret name: ');
      expect(result).toFailWith(/prompt cancelled/i);
    } finally {
      Object.defineProperty(process, 'stdin', { configurable: true, value: originalStdin });
    }
  });
});

describe('promptHidden', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function withFakeTTYStdin(
    isTTY: boolean,
    fn: (emit: (data: string) => void) => void | Promise<void>
  ): { stdin: NodeJS.ReadStream & { destroy: jest.Mock }; run: () => Promise<void> } {
    const originalStdin = process.stdin;
    const dataListeners: Array<(chunk: string) => void> = [];
    const fakeStdin = {
      isTTY,
      isRaw: false,
      setRawMode: jest.fn(),
      setEncoding: jest.fn(),
      resume: jest.fn(),
      pause: jest.fn(),
      on: jest.fn((event: string, listener: (chunk: string) => void) => {
        if (event === 'data') dataListeners.push(listener);
      }),
      off: jest.fn()
    };

    Object.defineProperty(process, 'stdin', { configurable: true, value: fakeStdin });

    function emit(data: string): void {
      for (const l of dataListeners) l(data);
    }

    return {
      stdin: fakeStdin as unknown as NodeJS.ReadStream & { destroy: jest.Mock },
      run: async () => {
        try {
          await fn(emit);
        } finally {
          Object.defineProperty(process, 'stdin', { configurable: true, value: originalStdin });
        }
      }
    };
  }

  test('fails when stdin is not a TTY', async () => {
    const originalStdin = process.stdin;
    Object.defineProperty(process, 'stdin', { configurable: true, value: { isTTY: false } });

    try {
      const result = await promptHidden('Password: ');
      expect(result).toFailWith(/interactive prompt requires a TTY/i);
    } finally {
      Object.defineProperty(process, 'stdin', { configurable: true, value: originalStdin });
    }
  });

  test('resolves with the typed value on enter', async () => {
    jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { run } = withFakeTTYStdin(true, async (emit) => {
      const resultPromise = promptHidden('Password: ');
      emit('p');
      emit('a');
      emit('s');
      emit('\r');
      const result = await resultPromise;
      expect(result).toSucceedWith('pas');
    });
    await run();
  });

  test('handles backspace by removing the last character', async () => {
    jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { run } = withFakeTTYStdin(true, async (emit) => {
      const resultPromise = promptHidden('Password: ');
      emit('a');
      emit('b');
      emit(''); // backspace
      emit('\n');
      const result = await resultPromise;
      expect(result).toSucceedWith('a');
    });
    await run();
  });

  test('fails when ^C (ETX) is received', async () => {
    jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { run } = withFakeTTYStdin(true, async (emit) => {
      const resultPromise = promptHidden('Password: ');
      emit(''); // Ctrl+C
      const result = await resultPromise;
      expect(result).toFailWith(/prompt cancelled/i);
    });
    await run();
  });
});

describe('readAllFromStdin', () => {
  test('reads all chunks from stdin and joins them', async () => {
    const originalStdin = process.stdin;
    const fakeStdin = {
      setEncoding: jest.fn(),
      resume: jest.fn(),
      [Symbol.asyncIterator]: async function* () {
        yield 'hello ';
        yield 'world';
      }
    };
    Object.defineProperty(process, 'stdin', { configurable: true, value: fakeStdin });

    try {
      const result = await readAllFromStdin();
      expect(result).toSucceedWith('hello world');
    } finally {
      Object.defineProperty(process, 'stdin', { configurable: true, value: originalStdin });
    }
  });
});

describe('copyTextToClipboard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('writes text to the clipboard and returns copied', async () => {
    clipboardyWriteMock.mockResolvedValue(undefined);

    const result = await copyTextToClipboard('my text');
    expect(result).toSucceedWith('copied');
    expect(clipboardyWriteMock).toHaveBeenCalledWith('my text');
  });

  test('returns a failure when the clipboard write throws', async () => {
    clipboardyWriteMock.mockRejectedValue(new Error('Clipboard unavailable'));

    const result = await copyTextToClipboard('my text');
    expect(result).toFailWith(/clipboard unavailable/i);
  });
});
