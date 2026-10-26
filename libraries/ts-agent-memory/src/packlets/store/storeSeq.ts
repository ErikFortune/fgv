/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { IRecordWriter, writeStoreFile } from './storeFileAccess';

/**
 * The two store-owned files at the root that hold the `seq` high-water mark, written alternately.
 * @internal
 */
export const SEQ_HIGH_WATER_SLOTS: readonly [string, string] = [
  'memory-store.seq.a.json',
  'memory-store.seq.b.json'
];

/** How many `seq`s one write of the high-water mark reserves. */
const SEQ_RESERVATION: number = 64;

/** The persisted shape of a high-water slot. */
interface ISeqHighWaterFile {
  readonly version: 1;
  /** The highest `seq` the store may issue without first writing a slot again. */
  readonly reserved: number;
}

const highWaterConverter: Converter<ISeqHighWaterFile> = Converters.strictObject<ISeqHighWaterFile>({
  version: Converters.literal<1>(1),
  reserved: Converters.number.withConstraint((n) => Number.isSafeInteger(n) && n >= 0)
});

/** What one slot held at open: its ceiling, or `undefined` when it is missing or unreadable. */
interface ISlotState {
  readonly present: boolean;
  readonly reserved: number | undefined;
}

/**
 * The store's `seq` allocator, with a persisted high-water mark so a `seq` is never issued twice —
 * not even across a restart that follows the deletion of the highest record.
 *
 * @remarks
 * **The files.** Two slots at the store root, `memory-store.seq.a.json` and
 * `memory-store.seq.b.json`, each holding `reserved`: a ceiling on the `seq`s the store may issue
 * before it writes again. The mark is the larger readable ceiling. Records never live at the root,
 * so the open walk never reads a slot as a record; a root *directory* with either name is refused
 * at open, since the walk would otherwise read it as a scope.
 *
 * **The ordering.** A `seq` past the mark is issued only after a new ceiling (`current + 64`) has
 * been written, through the same writer — atomic when the root is — as the records. A crash
 * therefore leaves a ceiling at or above every `seq` any record on disk carries, and the next open
 * resumes past `max(mark, highest seq on disk)`. The price is that `seq` is strictly increasing but
 * not dense: each open skips to the next reservation.
 *
 * **Why two slots.** On a root that cannot write atomically a slot is rewritten in place, and a
 * crash can tear it. Each write goes to the slot that is missing, unreadable, or holds the lower
 * ceiling — never the only good one — so a torn write leaves the other slot's ceiling, which still
 * covers every `seq` issued, and the alternation is re-derived at every open.
 *
 * **The fault model.** No slot at all means "derive from disk" — the behaviour before the mark
 * existed, so an older vault opens unchanged and gains a slot on its first write. A torn or
 * unreadable slot beside a readable one is ignored. Slots that exist but none of which reads fail
 * the open: guessing low could re-issue a `seq`. Deleting both returns the vault to derive-from-disk,
 * reopening the hole the mark closes. An interrupted atomic write can leave a working file beside a
 * slot, which nothing reads and the open-time sweep (which covers record directories only) leaves.
 * @internal
 */
export class SeqHighWater {
  private readonly _root: FileTree.IMutableFileTreeDirectoryItem;
  private readonly _writer: IRecordWriter;
  /** Each slot's known ceiling; `undefined` when missing, unreadable, or after a failed write. */
  private readonly _slots: [number | undefined, number | undefined];
  private _issued: number;
  private _reserved: number;

  private constructor(
    root: FileTree.IMutableFileTreeDirectoryItem,
    writer: IRecordWriter,
    slots: [number | undefined, number | undefined]
  ) {
    this._root = root;
    this._writer = writer;
    this._slots = slots;
    this._reserved = Math.max(slots[0] ?? 0, slots[1] ?? 0);
    this._issued = this._reserved;
  }

  /** Read both slots and take the larger readable ceiling; no slot reads as zero. */
  public static open(
    root: FileTree.IMutableFileTreeDirectoryItem,
    writer: IRecordWriter
  ): Result<SeqHighWater> {
    return root
      .getChildren()
      .withErrorFormat(
        (m) => `memory store: cannot list root '${root.absolutePath}' for the seq high-water mark: ${m}`
      )
      .onSuccess((children) =>
        mapResults(SEQ_HIGH_WATER_SLOTS.map((name) => SeqHighWater._readSlot(children, name)))
      )
      .onSuccess(([a, b]) => {
        if ((a.present || b.present) && a.reserved === undefined && b.reserved === undefined) {
          return fail<SeqHighWater>(
            `memory store: no seq high-water slot is readable (${SEQ_HIGH_WATER_SLOTS.join(', ')}); ` +
              `deleting both lets the store open by deriving seq from the records, which reopens ` +
              `the hole they close: a seq may then be re-issued`
          );
        }
        return succeed(new SeqHighWater(root, writer, [a.reserved, b.reserved]));
      });
  }

  /** One slot's state; a directory squatting on the name is refused. */
  private static _readSlot(children: ReadonlyArray<FileTree.FileTreeItem>, name: string): Result<ISlotState> {
    const item: FileTree.FileTreeItem | undefined = children.find((c) => c.name === name);
    if (item === undefined) {
      return succeed({ present: false, reserved: undefined });
    }
    if (item.type === 'directory') {
      return fail(
        `memory store: the root holds a directory named '${name}', a name reserved for the seq high-water mark`
      );
    }
    return succeed({ present: true, reserved: item.getContents(highWaterConverter).orDefault()?.reserved });
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
    const [a, b] = this._slots;
    // Never the only good slot: a missing or unreadable one first, else the lower ceiling.
    const slot: 0 | 1 = a === undefined ? 0 : b === undefined ? 1 : a <= b ? 0 : 1;
    const raw: string = JSON.stringify({ version: 1, reserved });
    return writeStoreFile(this._root, this._writer, SEQ_HIGH_WATER_SLOTS[slot], raw, 'seq')
      .onFailure((m) => {
        // A failed write may have torn the slot; treat it as unreadable so it is the next target.
        this._slots[slot] = undefined;
        return fail(`memory store: cannot advance the seq high-water mark: ${m}`);
      })
      .onSuccess(() => {
        this._slots[slot] = reserved;
        this._reserved = reserved;
        this._issued = seq;
        return succeed(seq);
      });
  }
}
