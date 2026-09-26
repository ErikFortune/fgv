/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  Converter,
  Converters,
  DetailedResult,
  Result,
  captureResult,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import {
  CheckpointWriteVisibility,
  ITaskCheckpointStore,
  ITaskConsumerRecord,
  SubscriptionId
} from '../types';
import { encodeRecord, fingerprintOf, parseJson, recordName } from './layout';
import { RecordStore } from './recordStore';

/** The one field a compare-and-write needs from whatever is stored. */
const _revision: Converter<{ readonly recordRevision: number }> = Converters.object<{
  readonly recordRevision: number;
}>({
  recordRevision: Converters.number
});

/**
 * The default checkpoint store: each subscription's record in the repository's own root, written
 * through the same atomic FileTree boundary as every task record.
 * @internal
 */
export class FileTreeCheckpointStore implements ITaskCheckpointStore {
  public readonly durability: 'session' | 'process-crash';
  private readonly _store: RecordStore;

  public constructor(store: RecordStore) {
    this._store = store;
    this.durability = store.guarantee === 'session' ? 'session' : 'process-crash';
  }

  /** {@inheritDoc ITaskCheckpointStore.read} */
  public read(subscriptionId: SubscriptionId): Result<unknown> {
    const name: string = recordName('consumer', subscriptionId);
    // A record created since the last listing is not visible until the root is re-listed.
    const listed: Result<boolean> = this._store.has(name)
      ? succeed(true)
      : this._store.list().onSuccess(() => succeed(this._store.has(name)));
    return listed.onSuccess((present) =>
      present ? this._store.read(name).onSuccess((text) => parseJson(text)) : succeed(undefined)
    );
  }

  /** {@inheritDoc ITaskCheckpointStore.write} */
  public write(
    subscriptionId: SubscriptionId,
    expectedRecordRevision: number,
    record: ITaskConsumerRecord
  ): DetailedResult<true, CheckpointWriteVisibility> {
    const encoded = encodeRecord(record);
    if (encoded.isFailure()) {
      return failWithDetail<true, CheckpointWriteVisibility>(encoded.message, 'unchanged');
    }
    // Compare-and-write: replace only the revision the caller read. A record that moved, appeared or
    // vanished since is left as it is, and nothing is written.
    const held: Result<number> = this.read(subscriptionId).onSuccess((current) =>
      current === undefined
        ? succeed(0)
        : _revision.convert(current).onSuccess((c) => succeed(c.recordRevision))
    );
    if (held.isFailure() || held.value !== expectedRecordRevision) {
      return failWithDetail<true, CheckpointWriteVisibility>(
        held.isFailure()
          ? `${recordName('consumer', subscriptionId)}: cannot read the current record: ${held.message}`
          : `${recordName(
              'consumer',
              subscriptionId
            )}: expected record revision ${expectedRecordRevision}, ` + `holding ${held.value}`,
        'unchanged'
      );
    }
    const written = this._store.write(recordName('consumer', subscriptionId), encoded.value.text);
    if (written.isFailure()) {
      return failWithDetail<true, CheckpointWriteVisibility>(
        written.message,
        written.detail?.visibility === 'unchanged' ? 'unchanged' : 'unknown'
      );
    }
    // A created name is readable through the store only after a re-listing.
    if (expectedRecordRevision === 0) {
      const listed: Result<ReadonlyArray<string>> = this._store.list();
      if (listed.isFailure()) {
        return failWithDetail<true, CheckpointWriteVisibility>(listed.message, 'unknown');
      }
    }
    return succeedWithDetail<true, CheckpointWriteVisibility>(true);
  }
}

/**
 * A validated consumer record, with the canonical fingerprint and size the repository tracks.
 * @internal
 */
export interface IConsumerRead {
  readonly record: ITaskConsumerRecord;
  readonly fingerprint: string;
  readonly bytes: number;
}

/**
 * The repository's side of a checkpoint store: nothing a store returns is trusted.
 *
 * @remarks
 * A read is round-tripped through JSON — detaching it from anything the store still holds and
 * giving the strict converters an ordinary object — then converted, and its id checked against
 * the subscription asked for. A record is fingerprinted by its canonical encoding, so the
 * repository can tell whether what a store returns later is what it last wrote. A store that
 * throws, or returns something else, fails the call.
 * @internal
 */
export class CheckpointPort {
  public readonly store: ITaskCheckpointStore;
  private readonly _converter: Converter<ITaskConsumerRecord>;

  public constructor(store: ITaskCheckpointStore, converter: Converter<ITaskConsumerRecord>) {
    this.store = store;
    this._converter = converter;
  }

  /** Reads and validates a subscription's record; `undefined` when the store holds none. */
  public read(subscriptionId: SubscriptionId): Result<IConsumerRead | undefined> {
    return this.readValue(subscriptionId).onSuccess((value) =>
      value === undefined
        ? succeed<IConsumerRead | undefined>(undefined)
        : this.accept(subscriptionId, value).withErrorFormat(
            (message) => `checkpoint ${subscriptionId}: ${message}`
          )
    );
  }

  /**
   * Reads a subscription's stored value, round-tripped through JSON, unvalidated; `undefined` when
   * the store holds none. Open reads this way so it can tell a newer storage format from damage.
   */
  public readValue(subscriptionId: SubscriptionId): Result<unknown> {
    // As with `write`, the store's answer is interpreted inside the capture: one that returns
    // something that is not a result, or a value that is not JSON, fails the read.
    return captureResult(() => {
      const inner = this.store.read(subscriptionId);
      if (inner.isFailure()) {
        return { ok: false as const, message: String(inner.message) };
      }
      // `null` is "no record"; a value JSON cannot express (a function, say) stringifies to undefined.
      const text: string | undefined | null = inner.value === undefined ? null : JSON.stringify(inner.value);
      return { ok: true as const, text };
    })
      .onSuccess((answer) =>
        !answer.ok
          ? fail<unknown>(answer.message)
          : answer.text === null
          ? succeed<unknown>(undefined)
          : answer.text === undefined
          ? fail<unknown>(`the checkpoint store returned a value that is not JSON`)
          : parseJson(answer.text)
      )
      .withErrorFormat((message) => `checkpoint ${subscriptionId}: ${message}`);
  }

  /** Validates a stored value as the record of `subscriptionId`. */
  public accept(subscriptionId: SubscriptionId, value: unknown): Result<IConsumerRead> {
    return this._converter
      .convert(value)
      .onSuccess((record) =>
        record.id !== subscriptionId
          ? fail<IConsumerRead>(
              `the checkpoint store returned subscription ${record.id}'s record for ${subscriptionId}`
            )
          : this.describe(record)
      );
  }

  /** The canonical fingerprint and size of a record. */
  public describe(record: ITaskConsumerRecord): Result<IConsumerRead> {
    return encodeRecord(record).onSuccess((encoded) =>
      succeed({ record, fingerprint: fingerprintOf(encoded.text), bytes: encoded.bytes })
    );
  }

  /**
   * Writes a record. A store that throws, or fails without saying nothing changed, is `unknown`.
   */
  public write(
    subscriptionId: SubscriptionId,
    expectedRecordRevision: number,
    record: ITaskConsumerRecord
  ): DetailedResult<true, CheckpointWriteVisibility> {
    // The answer is interpreted inside the capture too: a store is host code, and one that returns
    // something that is not a result has told us nothing about what it wrote.
    const answered = captureResult(() => {
      const inner = this.store.write(subscriptionId, expectedRecordRevision, structuredClone(record));
      return inner.isSuccess()
        ? { ok: true as const }
        : { ok: false as const, message: String(inner.message), unchanged: inner.detail === 'unchanged' };
    });
    if (answered.isFailure()) {
      return failWithDetail<true, CheckpointWriteVisibility>(
        `the checkpoint store failed: ${answered.message}`,
        'unknown'
      );
    }
    const outcome = answered.value;
    return outcome.ok
      ? succeedWithDetail<true, CheckpointWriteVisibility>(true)
      : failWithDetail<true, CheckpointWriteVisibility>(
          outcome.message,
          outcome.unchanged ? 'unchanged' : 'unknown'
        );
  }
}
