/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
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

import * as Files from '../files';
import * as Puzzles from '../puzzles';

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';

import { IPuzzleDescription, PuzzleSession } from '../common';
import DefaultPuzzles from './data/puzzles.json';
import { FileTree } from '@fgv/ts-json-base';

/**
 * A collection of puzzles of various types.
 * @public
 */
export class PuzzleCollection {
  /**
   * All puzzles in the collection.
   */
  public readonly puzzles: readonly IPuzzleDescription[];

  private readonly _byId: Map<string, IPuzzleDescription>;

  private constructor(puzzles: Files.Model.IPuzzlesFile) {
    this.puzzles = puzzles.puzzles;
    this._byId = new Map(
      this.puzzles
        .map((p): [string | undefined, IPuzzleDescription] => [p.id, p])
        .filter((p): p is [string, IPuzzleDescription] => p !== undefined)
    );
  }

  /**
   * Creates a new puzzle from a loaded {@link Files.Model.IPuzzlesFile | PuzzlesFile}
   * @param from - The {@link Files.Model.IPuzzlesFile | puzzles file} to be loaded.
   * @returns `Success` with the resulting {@link PuzzleCollection | PuzzleCollection}
   * or `Failure` with details if an error occurs.
   */
  public static create(from: Files.Model.IPuzzlesFile): Result<PuzzleCollection> {
    return captureResult(() => new PuzzleCollection(from));
  }

  /**
   * Creates a new puzzle from a JSON file.
   * @param path - path to the JSON file to be loaded.
   * @returns `Success` with the resulting {@link PuzzleCollection | PuzzleCollection}
   * or `Failure` with details if an error occurs.
   */
  public static load(file: FileTree.IFileTreeFileItem): Result<PuzzleCollection> {
    return Files.Converters.loadPuzzlesFile(file).onSuccess(PuzzleCollection.create);
  }

  /**
   * Gets a puzzle by id from this collection.
   * @param id - The string ID of the puzzle to be returned.
   * @returns `Success` with the requested {@link PuzzleSession | puzzle}, or
   * `Failure` with details if an error occurs.
   */
  public getPuzzle(id: string): Result<PuzzleSession> {
    return this.getDescription(id)
      .onSuccess((desc) => {
        return Puzzles.Any.create(desc);
      })
      .onSuccess((puzzle) => {
        return PuzzleSession.create(puzzle);
      });
  }

  /**
   * Gets a puzzle by id from this collection.
   * @param id - The string ID of the puzzle to be returned.
   * @returns `Success` with the requested {@link PuzzleSession | puzzle}, or
   * `Failure` with details if an error occurs.
   */
  public getDescription(id: string): Result<IPuzzleDescription> {
    const desc = this._byId.get(id);
    if (!desc) {
      return fail(`Puzzle "${id}" not found`);
    }
    return succeed(desc);
  }
}

/**
 * Get well-known {@link PuzzleCollection | puzzle collections}.
 * @public
 */
export class PuzzleCollections {
  private static _default: PuzzleCollection | undefined = undefined;

  /**
   * The default {@link PuzzleCollection | puzzle collection}.
   */
  public static get default(): PuzzleCollection {
    if (!PuzzleCollections._default) {
      PuzzleCollections._default = Files.Converters.puzzlesFile
        .convert(DefaultPuzzles)
        .onSuccess(PuzzleCollection.create)
        .orThrow();
    }
    return PuzzleCollections._default;
  }
}
