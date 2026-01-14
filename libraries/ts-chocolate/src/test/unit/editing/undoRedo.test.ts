// Copyright (c) 2024 Erik Fortune
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

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';
import { UndoManager, createCommand, ICommand } from '../../../packlets/editing';

describe('UndoManager', () => {
  describe('constructor', () => {
    test('creates manager with default history size', () => {
      const manager = new UndoManager();
      expect(manager.maxHistorySize).toBe(100);
      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(false);
    });

    test('creates manager with custom history size', () => {
      const manager = new UndoManager(50);
      expect(manager.maxHistorySize).toBe(50);
    });

    test('throws for invalid history size of 0', () => {
      expect(() => new UndoManager(0)).toThrow('maxHistorySize must be at least 1');
    });

    test('throws for negative history size', () => {
      expect(() => new UndoManager(-1)).toThrow('maxHistorySize must be at least 1');
    });

    test('accepts minimum history size of 1', () => {
      const manager = new UndoManager(1);
      expect(manager.maxHistorySize).toBe(1);
    });
  });

  describe('execute', () => {
    test('executes command and adds to undo stack', () => {
      const manager = new UndoManager();
      let executed = false;

      const command = createCommand(
        'test command',
        () => {
          executed = true;
          return succeed(undefined);
        },
        () => succeed(undefined)
      );

      expect(manager.execute(command)).toSucceed();
      expect(executed).toBe(true);
      expect(manager.canUndo).toBe(true);
      expect(manager.undoCount).toBe(1);
    });

    test('clears redo stack when executing new command', () => {
      const manager = new UndoManager();
      let value = 0;

      const command1 = createCommand(
        'increment',
        () => {
          value++;
          return succeed(undefined);
        },
        () => {
          value--;
          return succeed(undefined);
        }
      );

      const command2 = createCommand(
        'double',
        () => {
          value *= 2;
          return succeed(undefined);
        },
        () => {
          value /= 2;
          return succeed(undefined);
        }
      );

      // Execute first command
      expect(manager.execute(command1)).toSucceed();
      expect(value).toBe(1);

      // Undo it (moves to redo stack)
      expect(manager.undo()).toSucceed();
      expect(value).toBe(0);
      expect(manager.canRedo).toBe(true);

      // Execute new command (should clear redo stack)
      expect(manager.execute(command2)).toSucceed();
      expect(value).toBe(0); // 0 * 2 = 0
      expect(manager.canRedo).toBe(false);
      expect(manager.redoCount).toBe(0);
    });

    test('limits stack size to maxHistorySize', () => {
      const manager = new UndoManager(3);

      for (let i = 0; i < 5; i++) {
        const command = createCommand(
          `command ${i}`,
          () => succeed(undefined),
          () => succeed(undefined)
        );
        expect(manager.execute(command)).toSucceed();
      }

      expect(manager.undoCount).toBe(3);
      expect(manager.getUndoHistory()).toEqual(['command 4', 'command 3', 'command 2']);
    });

    test('returns failure if command execution fails', () => {
      const manager = new UndoManager();

      const command = createCommand(
        'failing command',
        () => fail('execution failed'),
        () => succeed(undefined)
      );

      expect(manager.execute(command)).toFailWith(/execution failed/);
      expect(manager.canUndo).toBe(false);
      expect(manager.undoCount).toBe(0);
    });
  });

  describe('undo', () => {
    test('undoes most recent command', () => {
      const manager = new UndoManager();
      let value = 0;

      const command = createCommand(
        'increment',
        () => {
          value++;
          return succeed(undefined);
        },
        () => {
          value--;
          return succeed(undefined);
        }
      );

      expect(manager.execute(command)).toSucceed();
      expect(value).toBe(1);

      expect(manager.undo()).toSucceed();
      expect(value).toBe(0);
      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(true);
    });

    test('returns failure when nothing to undo', () => {
      const manager = new UndoManager();
      expect(manager.undo()).toFailWith(/no commands to undo/i);
    });

    test('moves command to redo stack', () => {
      const manager = new UndoManager();

      const command = createCommand(
        'test',
        () => succeed(undefined),
        () => succeed(undefined)
      );

      expect(manager.execute(command)).toSucceed();
      expect(manager.undoCount).toBe(1);
      expect(manager.redoCount).toBe(0);

      expect(manager.undo()).toSucceed();
      expect(manager.undoCount).toBe(0);
      expect(manager.redoCount).toBe(1);
    });

    test('returns failure if undo operation fails', () => {
      const manager = new UndoManager();

      const command = createCommand(
        'test',
        () => succeed(undefined),
        () => fail('undo failed')
      );

      expect(manager.execute(command)).toSucceed();
      expect(manager.undo()).toFailWith(/undo failed/);
      // Command is popped before undo() is called, so it's lost on failure
      expect(manager.undoCount).toBe(0);
      expect(manager.redoCount).toBe(0);
    });
  });

  describe('redo', () => {
    test('redoes most recently undone command', () => {
      const manager = new UndoManager();
      let value = 0;

      const command = createCommand(
        'increment',
        () => {
          value++;
          return succeed(undefined);
        },
        () => {
          value--;
          return succeed(undefined);
        }
      );

      expect(manager.execute(command)).toSucceed();
      expect(value).toBe(1);

      expect(manager.undo()).toSucceed();
      expect(value).toBe(0);

      expect(manager.redo()).toSucceed();
      expect(value).toBe(1);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(false);
    });

    test('returns failure when nothing to redo', () => {
      const manager = new UndoManager();
      expect(manager.redo()).toFailWith(/no commands to redo/i);
    });

    test('uses custom redo function if provided', () => {
      const manager = new UndoManager();
      let value = 0;
      let customRedoCalled = false;

      const command: ICommand = {
        description: 'test',
        execute: () => {
          value = 10;
          return succeed(undefined);
        },
        undo: () => {
          value = 0;
          return succeed(undefined);
        },
        redo: () => {
          customRedoCalled = true;
          value = 20; // Different from execute
          return succeed(undefined);
        }
      };

      expect(manager.execute(command)).toSucceed();
      expect(value).toBe(10);

      expect(manager.undo()).toSucceed();
      expect(value).toBe(0);

      expect(manager.redo()).toSucceed();
      expect(customRedoCalled).toBe(true);
      expect(value).toBe(20);
    });

    test('falls back to execute if no redo function provided', () => {
      const manager = new UndoManager();
      let executeCount = 0;

      const command = createCommand(
        'test',
        () => {
          executeCount++;
          return succeed(undefined);
        },
        () => succeed(undefined)
      );

      expect(manager.execute(command)).toSucceed();
      expect(executeCount).toBe(1);

      expect(manager.undo()).toSucceed();

      expect(manager.redo()).toSucceed();
      expect(executeCount).toBe(2); // execute called again for redo
    });

    test('returns failure if redo operation fails', () => {
      const manager = new UndoManager();
      let shouldFail = false;

      const command: ICommand = {
        description: 'test',
        execute: () => succeed(undefined),
        undo: () => succeed(undefined),
        redo: () => {
          if (shouldFail) {
            return fail('redo failed');
          }
          return succeed(undefined);
        }
      };

      expect(manager.execute(command)).toSucceed();
      expect(manager.undo()).toSucceed();

      shouldFail = true;
      expect(manager.redo()).toFailWith(/redo failed/);
      // Command is popped before redo() is called, so it's lost on failure
      expect(manager.redoCount).toBe(0);
      expect(manager.undoCount).toBe(0);
    });
  });

  describe('clear', () => {
    test('clears both undo and redo stacks', () => {
      const manager = new UndoManager();

      const command1 = createCommand(
        'cmd1',
        () => succeed(undefined),
        () => succeed(undefined)
      );
      const command2 = createCommand(
        'cmd2',
        () => succeed(undefined),
        () => succeed(undefined)
      );

      expect(manager.execute(command1)).toSucceed();
      expect(manager.execute(command2)).toSucceed();
      expect(manager.undo()).toSucceed();

      expect(manager.undoCount).toBe(1);
      expect(manager.redoCount).toBe(1);

      manager.clear();

      expect(manager.undoCount).toBe(0);
      expect(manager.redoCount).toBe(0);
      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(false);
    });
  });

  describe('getUndoHistory', () => {
    test('returns descriptions in reverse order (most recent first)', () => {
      const manager = new UndoManager();

      for (let i = 1; i <= 3; i++) {
        const command = createCommand(
          `command ${i}`,
          () => succeed(undefined),
          () => succeed(undefined)
        );
        expect(manager.execute(command)).toSucceed();
      }

      expect(manager.getUndoHistory()).toEqual(['command 3', 'command 2', 'command 1']);
    });

    test('returns empty array when no commands', () => {
      const manager = new UndoManager();
      expect(manager.getUndoHistory()).toEqual([]);
    });
  });

  describe('getRedoHistory', () => {
    test('returns descriptions in reverse order (most recent first)', () => {
      const manager = new UndoManager();

      for (let i = 1; i <= 3; i++) {
        const command = createCommand(
          `command ${i}`,
          () => succeed(undefined),
          () => succeed(undefined)
        );
        expect(manager.execute(command)).toSucceed();
      }

      // Undo all 3
      expect(manager.undo()).toSucceed();
      expect(manager.undo()).toSucceed();
      expect(manager.undo()).toSucceed();

      expect(manager.getRedoHistory()).toEqual(['command 1', 'command 2', 'command 3']);
    });

    test('returns empty array when no undone commands', () => {
      const manager = new UndoManager();
      expect(manager.getRedoHistory()).toEqual([]);
    });
  });

  describe('peekUndo', () => {
    test('returns description of most recent command', () => {
      const manager = new UndoManager();

      const command = createCommand(
        'my command',
        () => succeed(undefined),
        () => succeed(undefined)
      );

      expect(manager.execute(command)).toSucceed();
      expect(manager.peekUndo()).toBe('my command');
    });

    test('returns undefined when no commands', () => {
      const manager = new UndoManager();
      expect(manager.peekUndo()).toBeUndefined();
    });

    test('does not remove command from stack', () => {
      const manager = new UndoManager();

      const command = createCommand(
        'test',
        () => succeed(undefined),
        () => succeed(undefined)
      );

      expect(manager.execute(command)).toSucceed();
      expect(manager.peekUndo()).toBe('test');
      expect(manager.peekUndo()).toBe('test');
      expect(manager.undoCount).toBe(1);
    });
  });

  describe('peekRedo', () => {
    test('returns description of most recently undone command', () => {
      const manager = new UndoManager();

      const command = createCommand(
        'my command',
        () => succeed(undefined),
        () => succeed(undefined)
      );

      expect(manager.execute(command)).toSucceed();
      expect(manager.undo()).toSucceed();
      expect(manager.peekRedo()).toBe('my command');
    });

    test('returns undefined when no undone commands', () => {
      const manager = new UndoManager();
      expect(manager.peekRedo()).toBeUndefined();
    });

    test('does not remove command from stack', () => {
      const manager = new UndoManager();

      const command = createCommand(
        'test',
        () => succeed(undefined),
        () => succeed(undefined)
      );

      expect(manager.execute(command)).toSucceed();
      expect(manager.undo()).toSucceed();
      expect(manager.peekRedo()).toBe('test');
      expect(manager.peekRedo()).toBe('test');
      expect(manager.redoCount).toBe(1);
    });
  });

  describe('complex scenarios', () => {
    test('handles multiple undo/redo cycles', () => {
      const manager = new UndoManager();
      let value = 0;

      const incrementCommand = (): ICommand =>
        createCommand(
          'increment',
          () => {
            value++;
            return succeed(undefined);
          },
          () => {
            value--;
            return succeed(undefined);
          }
        );

      // Execute 3 increments
      expect(manager.execute(incrementCommand())).toSucceed();
      expect(manager.execute(incrementCommand())).toSucceed();
      expect(manager.execute(incrementCommand())).toSucceed();
      expect(value).toBe(3);

      // Undo 2
      expect(manager.undo()).toSucceed();
      expect(manager.undo()).toSucceed();
      expect(value).toBe(1);

      // Redo 1
      expect(manager.redo()).toSucceed();
      expect(value).toBe(2);

      // Execute new command (clears redo)
      expect(manager.execute(incrementCommand())).toSucceed();
      expect(value).toBe(3);
      expect(manager.canRedo).toBe(false);

      // Undo all
      expect(manager.undo()).toSucceed();
      expect(manager.undo()).toSucceed();
      expect(manager.undo()).toSucceed();
      expect(value).toBe(0);
      expect(manager.canUndo).toBe(false);
    });

    test('handles state tracking with different operations', () => {
      const manager = new UndoManager();
      const state: string[] = [];

      const addCommand = (item: string): ICommand =>
        createCommand(
          `add ${item}`,
          () => {
            state.push(item);
            return succeed(undefined);
          },
          () => {
            state.pop();
            return succeed(undefined);
          }
        );

      expect(manager.execute(addCommand('a'))).toSucceed();
      expect(manager.execute(addCommand('b'))).toSucceed();
      expect(manager.execute(addCommand('c'))).toSucceed();
      expect(state).toEqual(['a', 'b', 'c']);

      expect(manager.undo()).toSucceed();
      expect(state).toEqual(['a', 'b']);

      expect(manager.redo()).toSucceed();
      expect(state).toEqual(['a', 'b', 'c']);

      expect(manager.undo()).toSucceed();
      expect(manager.undo()).toSucceed();
      expect(state).toEqual(['a']);

      expect(manager.redo()).toSucceed();
      expect(state).toEqual(['a', 'b']);
    });
  });
});

describe('createCommand', () => {
  test('creates command with required properties', () => {
    const command = createCommand(
      'test description',
      () => succeed(undefined),
      () => succeed(undefined)
    );

    expect(command.description).toBe('test description');
    expect(typeof command.execute).toBe('function');
    expect(typeof command.undo).toBe('function');
    expect(command.redo).toBeUndefined();
  });

  test('creates command with optional redo', () => {
    const command = createCommand(
      'test',
      () => succeed(undefined),
      () => succeed(undefined),
      () => succeed(undefined)
    );

    expect(command.redo).toBeDefined();
    expect(typeof command.redo).toBe('function');
  });

  test('execute function works correctly', () => {
    let called = false;
    const command = createCommand(
      'test',
      () => {
        called = true;
        return succeed(undefined);
      },
      () => succeed(undefined)
    );

    expect(command.execute()).toSucceed();
    expect(called).toBe(true);
  });

  test('undo function works correctly', () => {
    let undoCalled = false;
    const command = createCommand(
      'test',
      () => succeed(undefined),
      () => {
        undoCalled = true;
        return succeed(undefined);
      }
    );

    expect(command.undo()).toSucceed();
    expect(undoCalled).toBe(true);
  });

  test('redo function works correctly', () => {
    let redoCalled = false;
    const command = createCommand(
      'test',
      () => succeed(undefined),
      () => succeed(undefined),
      () => {
        redoCalled = true;
        return succeed(undefined);
      }
    );

    expect(command.redo?.()).toSucceed();
    expect(redoCalled).toBe(true);
  });
});
