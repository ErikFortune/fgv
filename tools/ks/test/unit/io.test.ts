jest.mock('readline', () => ({
  createInterface: jest.fn()
}));

jest.mock('clipboardy', () => ({
  write: jest.fn()
}));

jest.mock('@fgv/ts-json-base', () => {
  const actual = jest.requireActual('@fgv/ts-json-base') as typeof import('@fgv/ts-json-base');
  return {
    ...actual,
    FileTree: {
      ...actual.FileTree,
      forFilesystem: jest.fn(),
      isMutableAccessors: jest.fn(),
      isMutableDirectoryItem: jest.fn()
    }
  };
});

import '@fgv/ts-utils-jest';

import os from 'os';
import path from 'path';
import * as readline from 'readline';
import clipboardy from 'clipboardy';
import { FileTree } from '@fgv/ts-json-base';

import { succeed, fail } from '@fgv/ts-utils';

import {
  copyTextToClipboard,
  defaultKeystorePath,
  promptHidden,
  promptVisible,
  readAllFromStdin,
  readTextFile,
  resolvePath,
  writeTextFile
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

describe('readTextFile', () => {
  const forFilesystemMock = FileTree.forFilesystem as unknown as jest.Mock;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns file contents on success', () => {
    const file = { getRawContents: jest.fn().mockReturnValue(succeed('hello world')) };
    const tree = { getFile: jest.fn().mockReturnValue(succeed(file)) };
    forFilesystemMock.mockReturnValue(succeed(tree));

    expect(readTextFile('/test/file.txt')).toSucceedWith('hello world');
  });

  test('returns failure when filesystem cannot be initialized', () => {
    forFilesystemMock.mockReturnValue(fail('filesystem error'));

    expect(readTextFile('/test/file.txt')).toFailWith(/filesystem error/i);
  });

  test('returns failure when file cannot be found', () => {
    const tree = { getFile: jest.fn().mockReturnValue(fail('not found')) };
    forFilesystemMock.mockReturnValue(succeed(tree));

    expect(readTextFile('/test/file.txt')).toFailWith(/not found/i);
  });
});

describe('writeTextFile', () => {
  const forFilesystemMock = FileTree.forFilesystem as unknown as jest.Mock;
  const isMutableAccessorsMock = FileTree.isMutableAccessors as unknown as jest.Mock;
  const isMutableDirectoryItemMock = FileTree.isMutableDirectoryItem as unknown as jest.Mock;

  function makeMocks(): {
    accessors: { createDirectory: jest.Mock };
    directory: { createChildFile: jest.Mock };
    tree: { hal: object; getDirectory: jest.Mock };
  } {
    const accessors = { createDirectory: jest.fn().mockReturnValue(succeed(undefined)) };
    const directory = { createChildFile: jest.fn().mockReturnValue(succeed(undefined)) };
    const tree = { hal: accessors, getDirectory: jest.fn().mockReturnValue(succeed(directory)) };
    return { accessors, directory, tree };
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('writes the file and returns the resolved path', () => {
    const { tree } = makeMocks();
    forFilesystemMock.mockReturnValue(succeed(tree));
    isMutableAccessorsMock.mockReturnValue(true);
    isMutableDirectoryItemMock.mockReturnValue(true);

    const result = writeTextFile('/test/dir/file.txt', 'contents');
    expect(result).toSucceed();
  });

  test('returns failure when filesystem cannot be initialized', () => {
    forFilesystemMock.mockReturnValue(fail('no filesystem'));

    expect(writeTextFile('/test/dir/file.txt', 'contents')).toFailWith(/no filesystem/i);
  });

  test('returns failure when filesystem accessors are not mutable', () => {
    const { tree } = makeMocks();
    forFilesystemMock.mockReturnValue(succeed(tree));
    isMutableAccessorsMock.mockReturnValue(false);

    expect(writeTextFile('/test/dir/file.txt', 'contents')).toFailWith(/read-only/i);
  });

  test('returns failure when createDirectory fails', () => {
    const { tree, accessors } = makeMocks();
    accessors.createDirectory.mockReturnValue(fail('permission denied'));
    forFilesystemMock.mockReturnValue(succeed(tree));
    isMutableAccessorsMock.mockReturnValue(true);

    expect(writeTextFile('/test/dir/file.txt', 'contents')).toFailWith(/permission denied/i);
  });

  test('returns failure when getDirectory fails', () => {
    const { tree } = makeMocks();
    tree.getDirectory.mockReturnValue(fail('dir not found'));
    forFilesystemMock.mockReturnValue(succeed(tree));
    isMutableAccessorsMock.mockReturnValue(true);

    expect(writeTextFile('/test/dir/file.txt', 'contents')).toFailWith(/dir not found/i);
  });

  test('returns failure when directory is not mutable', () => {
    const { tree } = makeMocks();
    forFilesystemMock.mockReturnValue(succeed(tree));
    isMutableAccessorsMock.mockReturnValue(true);
    isMutableDirectoryItemMock.mockReturnValue(false);

    expect(writeTextFile('/test/dir/file.txt', 'contents')).toFailWith(/not mutable/i);
  });

  test('returns failure when createChildFile fails', () => {
    const { tree, directory } = makeMocks();
    directory.createChildFile.mockReturnValue(fail('write failed'));
    forFilesystemMock.mockReturnValue(succeed(tree));
    isMutableAccessorsMock.mockReturnValue(true);
    isMutableDirectoryItemMock.mockReturnValue(true);

    expect(writeTextFile('/test/dir/file.txt', 'contents')).toFailWith(/write failed/i);
  });
});
