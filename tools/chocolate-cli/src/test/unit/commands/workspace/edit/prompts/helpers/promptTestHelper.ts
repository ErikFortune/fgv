/*
 * MIT License
 *
 * Copyright (c) 2025 Erik Fortune
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

/**
 * Message-aware prompt mock helper for testing interactive CLI commands.
 *
 * Instead of fragile sequential `mockResolvedValueOnce()` chains that must exactly
 * mirror source code call order, this helper matches prompts by their message content
 * and returns appropriate responses. This makes tests resilient to prompt reordering
 * and clearly documents what user input is being simulated.
 *
 * The prompt source files import `promptInput`, `confirmAction`, and `showMenu` from
 * the shared module. We mock those wrappers (not `@inquirer/prompts` directly) because
 * `menuSystem.ts` imports `chalk` which is ESM-only and breaks in Jest.
 *
 * The wrapper signatures are:
 *   promptInput(message, defaultValue?) =\> Promise of string
 *   confirmAction(message, defaultValue?) =\> Promise of boolean
 *   showMenu(options) =\> Promise of MenuResult
 */

export interface IInputResponse {
  match: RegExp;
  value: string;
}

export interface IConfirmResponse {
  match: RegExp;
  value: boolean;
}

export interface IMenuResponse {
  match: RegExp;
  value: unknown;
}

/**
 * Mock functions that tests wire up via jest.mock of the shared module.
 */
export interface IMockSharedPrompts {
  promptInput: jest.Mock;
  confirmAction: jest.Mock;
  showMenu: jest.Mock;
}

/**
 * A message-aware prompt responder that returns values based on prompt message content.
 * Responses are matched in order; first match wins.
 */
export class PromptResponder {
  private readonly _inputResponses: IInputResponse[] = [];
  private readonly _confirmResponses: IConfirmResponse[] = [];
  private readonly _menuResponses: IMenuResponse[] = [];
  private _defaultInput: string | undefined;
  private _defaultConfirm: boolean | undefined;

  /**
   * Register a response for `promptInput()` calls matching the given pattern.
   */
  public onInput(match: RegExp, value: string): this {
    this._inputResponses.push({ match, value });
    return this;
  }

  /**
   * Register a response for `confirmAction()` calls matching the given pattern.
   */
  public onConfirm(match: RegExp, value: boolean): this {
    this._confirmResponses.push({ match, value });
    return this;
  }

  /**
   * Register a response for `showMenu()` calls matching the given pattern.
   * The value is the menu item value to "select". It will be wrapped as
   * `{ action: 'value', value: <value> }`.
   */
  public onMenu(match: RegExp, value: unknown): this {
    this._menuResponses.push({ match, value });
    return this;
  }

  /**
   * Register a menu "back" response for `showMenu()` calls matching the given pattern.
   */
  public onMenuBack(match: RegExp): this {
    this._menuResponses.push({ match, value: { __action: 'back' } });
    return this;
  }

  /**
   * Set default response for unmatched `promptInput()` calls.
   * If not set, unmatched input prompts return the default value or empty string.
   */
  public defaultInput(value: string): this {
    this._defaultInput = value;
    return this;
  }

  /**
   * Set default response for unmatched `confirmAction()` calls.
   * If not set, unmatched confirm prompts return the prompt's own default value.
   */
  public defaultConfirm(value: boolean): this {
    this._defaultConfirm = value;
    return this;
  }

  /**
   * Install this responder's mock implementations on the mock shared module functions.
   */
  public install(mocks: IMockSharedPrompts): void {
    mocks.promptInput.mockImplementation((message: string, defaultValue?: string) => {
      for (const resp of this._inputResponses) {
        if (resp.match.test(message)) {
          return Promise.resolve(resp.value);
        }
      }
      return Promise.resolve(this._defaultInput ?? defaultValue ?? '');
    });

    mocks.confirmAction.mockImplementation((message: string, defaultValue?: boolean) => {
      for (const resp of this._confirmResponses) {
        if (resp.match.test(message)) {
          return Promise.resolve(resp.value);
        }
      }
      return Promise.resolve(this._defaultConfirm ?? defaultValue ?? true);
    });

    mocks.showMenu.mockImplementation((options: { message: string }) => {
      for (const resp of this._menuResponses) {
        if (resp.match.test(options.message)) {
          const val = resp.value;
          // Check for special action markers
          if (typeof val === 'object' && val !== null && '__action' in val) {
            return Promise.resolve({ action: (val as { __action: string }).__action });
          }
          return Promise.resolve({ action: 'value', value: val });
        }
      }
      // Default: cancelled
      return Promise.resolve({ action: 'back' });
    });
  }
}

/**
 * Creates a fresh PromptResponder.
 */
export function createResponder(): PromptResponder {
  return new PromptResponder();
}
