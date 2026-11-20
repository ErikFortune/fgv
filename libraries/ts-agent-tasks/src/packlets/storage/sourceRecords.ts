/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import { ITaskCapacityProfile, ITaskRepositoryManifest, ITaskSourceRecord, TaskResult } from '../types';
import { classify, ok, propagate, taskFailure } from './failures';
import { IEncodedRecord, encodeValidated, fingerprintOf, recordName, utf8Length } from './layout';
import { CapacityLedger, ILedgerEntry } from './ledger';
import { ITaskSourceCommitRequest } from './model';
import { ISourceRecordState } from './openRepository';
import { sourceEntry } from './projection';
import { RecordStore } from './recordStore';

/**
 * What the source-checkpoint record operations need from the repository that owns them.
 * @internal
 */
export interface ISourceHost {
  readonly converters: TaskConverters;
  readonly store: RecordStore;
  profile(): ITaskCapacityProfile;
  ledger(): CapacityLedger;
  sources(): Map<string, ISourceRecordState>;
  manifest(): ITaskRepositoryManifest;
  manifestEntry(manifest: ITaskRepositoryManifest): TaskResult<ILedgerEntry>;
  writeManifest(manifest: ITaskRepositoryManifest): TaskResult<true>;
  writeFile(name: string, text: string): TaskResult<true>;
  fence(reason: string): void;
}

/**
 * Broker source-checkpoint records (T6), moved out of the repository class in T7 so it stays under
 * the line limit; behaviour unchanged.
 * @internal
 */
export class SourceRecords {
  private readonly _host: ISourceHost;

  public constructor(host: ISourceHost) {
    this._host = host;
  }

  /**
   * Creates or replaces a source's checkpoint record.
   *
   * @remarks
   * Replacement checks the file on disk is still the one this instance committed, as the manifest
   * does: an out-of-band edit fences rather than being erased. Creation writes the record, then the
   * live inventory entry. A crash between the two leaves an uninventoried file; a retry of the same
   * creation adopts it only when it is byte-for-byte what that retry would write, and refuses
   * anything else — so a crash can never make the cursor lead its committed observations.
   */
  public commit(request: ITaskSourceCommitRequest): TaskResult<ITaskSourceRecord> {
    const converted: Result<{ id: string; current: ISourceRecordState | undefined }> =
      this._host.converters.ids.sourceId.convert(request.sourceId).onSuccess((id) => {
        const cursorBytes: number = utf8Length(request.cursor ?? '');
        return cursorBytes > this._host.profile().encoded.maxSourceCursorBytes
          ? fail(
              `the cursor is ${cursorBytes} bytes, over the bound of ${
                this._host.profile().encoded.maxSourceCursorBytes
              }`
            )
          : succeed({ id, current: this._host.sources().get(id) });
      });
    if (converted.isFailure()) {
      return taskFailure(`commitSource: ${converted.message}`, 'invalid', 'after-host-action');
    }
    const { id, current } = converted.value;
    const revision: number = current?.record.recordRevision ?? 0;
    if (request.expectedRecordRevision !== revision) {
      return taskFailure(
        `commitSource ${id}: expected record ${request.expectedRecordRevision}, found ${revision}`,
        'conflict',
        'reconcile-first'
      );
    }
    if (current !== undefined && current.record.history !== request.history) {
      return taskFailure(
        `commitSource ${id}: a source's history contract is fixed ('${current.record.history}')`,
        'invalid',
        'after-host-action'
      );
    }
    const record: ITaskSourceRecord = {
      formatVersion: 1,
      id,
      recordRevision: revision + 1,
      history: request.history,
      ...(request.cursor !== undefined ? { cursor: request.cursor } : {}),
      pages: request.pages
    };
    const name: string = recordName('source', id);
    const converter = this._host.converters.storage.sourceRecord;
    const encoded: TaskResult<IEncodedRecord> = classify(
      encodeValidated(record, (from) => converter.convert(from)),
      'invalid',
      'after-host-action'
    ).withErrorFormat((message) => `commitSource ${id}: ${message}`);
    if (encoded.isFailure()) {
      return propagate(encoded);
    }
    const entry: ILedgerEntry = sourceEntry(id, encoded.value.bytes, this._host.profile());
    const key: string = `source:${id}`;
    if (current !== undefined) {
      return this._checkSourceOnDisk(name, current)
        .onSuccess(() => this._host.ledger().admit(new Map([[key, entry]])))
        .onSuccess(() => this._host.writeFile(name, encoded.value.text))
        .onSuccess(() => {
          this._host.sources().set(id, {
            record,
            fingerprint: fingerprintOf(encoded.value.text),
            bytes: encoded.value.bytes
          });
          this._host.ledger().apply(new Map([[key, entry]]));
          return ok(record);
        });
    }
    return this._createSource(id, name, record, encoded.value, entry);
  }

  private _createSource(
    id: string,
    name: string,
    record: ITaskSourceRecord,
    encoded: IEncodedRecord,
    entry: ILedgerEntry
  ): TaskResult<ITaskSourceRecord> {
    const current: ITaskRepositoryManifest = this._host.manifest();
    const manifest: ITaskRepositoryManifest = {
      ...current,
      manifestRevision: current.manifestRevision + 1,
      sources: [...current.sources, { id, state: 'live' as const }].sort((a, b) => (a.id < b.id ? -1 : 1))
    };
    const listed: Result<ReadonlyArray<string>> = this._host.store.list();
    if (listed.isFailure()) {
      return taskFailure(`commitSource ${id}: ${listed.message}`, 'storage-unavailable', 'safe');
    }
    let landed: boolean = false;
    if (listed.value.includes(name)) {
      const text: Result<string> = this._host.store.read(name);
      if (text.isFailure() || text.value !== encoded.text) {
        return taskFailure(
          `commitSource ${id}: ${name} already exists but this repository never committed it, and it is not ` +
            `this creation's record; it is left untouched`,
          'conflict',
          'after-host-action'
        );
      }
      landed = true;
    }
    return this._host.manifestEntry(manifest).onSuccess((manifestLedger) =>
      this._host
        .ledger()
        .admit(
          new Map([
            [`source:${id}`, entry],
            ['repository', manifestLedger]
          ])
        )
        .onSuccess(() => (landed ? ok<true>(true) : this._host.writeFile(name, encoded.text)))
        .onSuccess(() => this._host.writeManifest(manifest))
        .onSuccess(() => {
          this._host
            .sources()
            .set(id, { record, fingerprint: fingerprintOf(encoded.text), bytes: encoded.bytes });
          this._host.ledger().apply(
            new Map([
              [`source:${id}`, entry],
              ['repository', manifestLedger]
            ])
          );
          return ok(record);
        })
    );
  }

  /** A source record must still be the one this instance committed before it is replaced. */
  private _checkSourceOnDisk(name: string, current: ISourceRecordState): TaskResult<true> {
    const text: Result<string> = this._host.store.list().onSuccess(() => this._host.store.read(name));
    if (text.isFailure()) {
      return taskFailure(
        `${name}: cannot be re-read before rewriting it: ${text.message}`,
        'storage-unavailable',
        'safe'
      );
    }
    if (fingerprintOf(text.value) === current.fingerprint) {
      return ok(true);
    }
    const message: string = `${name} differs from the one this repository committed`;
    this._host.fence(message);
    return taskFailure(message, 'storage-corrupt', 'after-host-action');
  }
}
