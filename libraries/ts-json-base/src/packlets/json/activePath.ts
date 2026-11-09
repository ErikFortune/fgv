/*
 * Copyright (c) 2026 Erik Fortune
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
 * The objects and arrays the recursive JSON converters and validators are currently inside, with
 * the key path that reached each. JSON cannot be cyclic, so meeting an object that is already on
 * the path fails at once, rather than recursing until the stack is exhausted.
 *
 * @remarks
 * The converters and the validators each hold one private instance, shared by their three
 * recursive members because those call one another. The walk is synchronous, so module-level state
 * is safe. When the outermost container exits, the state is cleared outright, so an exit cut short
 * by stack exhaustion cannot leave a stale entry behind to report a false cycle later.
 *
 * The state is per walk only in the sense that one walk is in progress at a time. A recursive JSON
 * conversion started *during* another one — from a getter on a value being walked, say — over an
 * object the outer walk is still inside reports that object as circular, although neither walk
 * alone would. JSON values have no getters, so this needs a value that is not JSON to begin with:
 * for example an accessor property on the walked value whose getter itself converts an ancestor of
 * that value, which then fails as `circular reference at $` from inside the getter.
 * @internal
 */
export class _JsonActivePath {
  private readonly _active: Set<object> = new Set<object>();
  private readonly _segments: string[] = [];
  private _depth: number = 0;

  /**
   * The key path to the current position, as `$`, `$.name` or `$[0]`.
   */
  public get path(): string {
    return `$${this._segments.join('')}`;
  }

  /**
   * Runs `body` with `container` on the active path, or reports `circular reference at <path>`
   * through `onCycle` if `container` is already on it.
   * @param container - The object or array about to be walked.
   * @param onCycle - Builds the failure for a circular reference from its message.
   * @param body - The walk.
   * @returns The result of `body`, or of `onCycle`.
   */
  public container<R>(container: object, onCycle: (message: string) => R, body: () => R): R {
    if (this._active.has(container)) {
      return onCycle(`circular reference at ${this.path}`);
    }
    this._active.add(container);
    this._depth++;
    try {
      return body();
    } finally {
      this._depth--;
      if (this._depth === 0) {
        this._active.clear();
        this._segments.length = 0;
      } else {
        this._active.delete(container);
      }
    }
  }

  /**
   * Runs `body` with the path extended by one member.
   * @param member - An object key or an array index.
   * @param body - The walk of that member.
   * @returns The result of `body`.
   */
  public member<T>(member: string | number, body: () => T): T {
    this._segments.push(typeof member === 'number' ? `[${member}]` : `.${member}`);
    try {
      return body();
    } finally {
      this._segments.pop();
    }
  }
}
