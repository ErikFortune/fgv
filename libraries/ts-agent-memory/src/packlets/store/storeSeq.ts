/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Converter, Converters, Result, succeed } from '@fgv/ts-utils';
import { IRecordWriter, writeStoreFile } from './storeFileAccess';

/** The store-owned file at the root that holds the `seq` high-water mark. */
const SEQ_HIGH_WATER_FILE: string = 'memory-store.seq.json';

/** How many `seq`s one write of the high-water file reserves. */
const SEQ_RESERVATION: number = 64;

/** The persisted shape of the high-water file. */
interface ISeqHighWaterFile {
  readonly version: 1;
  /** The highest `seq` the store may issue without first writing this file again. */
  readonly reserved: number;
}

const highWaterConverter: Converter<ISeqHighWaterFile> = Converters.strictObject<ISeqHighWaterFile>({
  version: Converters.literal<1>(1),
  reserved: Converters.number.withConstraint((n) => Number.isSafeInteger(n) && n >= 0)
});

/**
 * The store's `seq` allocator, with a persisted high-water mark so a `seq` is never issued twice —
 * not even across a restart that follows the deletion of the highest record.
 *
 * @remarks
 * **The file.** `memory-store.seq.json` at the store root holds `reserved`: the highest `seq` the
 * store may issue before it writes the file again. Records never live at the root, so the open
 * walk never reads it as one.
 *
 * **The ordering.** A `seq` past `reserved` is issued only after a new ceiling
 * (`current + 64`) has been written, through the same writer — atomic when the root is — as the
 * records. A crash therefore leaves a ceiling at or above every `seq` any record on disk carries,
 * and the next open resumes past `max(reserved, highest seq on disk)`. The price is that `seq` is
 * strictly increasing but not dense: each open skips to the next reservation.
 *
 * **The fault model.** A missing file means "derive from disk" — the behaviour before the file
 * existed, so an older vault opens unchanged and gains the file on its first write. A file that
 * cannot be read or parsed fails the open: guessing low could re-issue a `seq`. Deleting the file
 * returns the vault to derive-from-disk, and to the hole the file closes. On a root that cannot
 * write atomically the file is written in place, and a torn write is that same unreadable case. An
 * interrupted atomic write can leave a working file beside it, which nothing reads and the open-time
 * sweep (which covers record directories only) leaves in place.
 * @internal
 */
export class SeqHighWater {
  private readonly _root: FileTree.IMutableFileTreeDirectoryItem;
  private readonly _writer: IRecordWriter;
  private _issued: number;
  private _reserved: number;

  private constructor(root: FileTree.IMutableFileTreeDirectoryItem, writer: IRecordWriter, reserved: number) {
    this._root = root;
    this._writer = writer;
    this._issued = reserved;
    this._reserved = reserved;
  }

  /** Read the persisted ceiling; a missing file reads as zero. */
  public static open(
    root: FileTree.IMutableFileTreeDirectoryItem,
    writer: IRecordWriter
  ): Result<SeqHighWater> {
    return root
      .getChildren()
      .onSuccess((children) => {
        const file: FileTree.IFileTreeFileItem | undefined = children.find(
          (c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === SEQ_HIGH_WATER_FILE
        );
        return file === undefined
          ? succeed(0)
          : file.getContents(highWaterConverter).onSuccess((parsed) => succeed(parsed.reserved));
      })
      .withErrorFormat(
        (m) =>
          `memory store: cannot read the seq high-water file '${SEQ_HIGH_WATER_FILE}' (delete it to ` +
          `derive seq from the records, accepting that a seq may then be re-issued): ${m}`
      )
      .onSuccess((reserved) => succeed(new SeqHighWater(root, writer, reserved)));
  }

  /** Resume past a `seq` found on disk. */
  public observe(seq: number): void {
    if (seq > this._issued) {
      this._issued = seq;
    }
  }

  /** Issue the next `seq`, first persisting a new ceiling when the reservation is spent. */
  public next(): Result<number> {
    const seq: number = this._issued + 1;
    if (seq <= this._reserved) {
      this._issued = seq;
      return succeed(seq);
    }
    const reserved: number = this._issued + SEQ_RESERVATION;
    const raw: string = JSON.stringify({ version: 1, reserved });
    return writeStoreFile(this._root, this._writer, SEQ_HIGH_WATER_FILE, raw)
      .withErrorFormat((m) => `memory store: cannot advance the seq high-water mark: ${m}`)
      .onSuccess(() => {
        this._reserved = reserved;
        this._issued = seq;
        return succeed(seq);
      });
  }
}
