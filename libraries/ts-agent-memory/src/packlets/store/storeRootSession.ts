/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Converter, Converters, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IMemoryStoreDurability,
  IMemoryStoreDurabilityOptions,
  MemoryDurabilityRequirement
} from './openReport';
import { IRootOwnership, acquireStoreRoot } from './rootOwnership';
import { IRecordWriter, sweepAtomicTemporaries } from './storeFileAccess';

const guaranteeRank: ReadonlyArray<FileTree.AtomicWriteGuarantee> = [
  'session',
  'process-crash',
  'os-crash',
  'power-loss'
];

const requirementConverter: Converter<MemoryDurabilityRequirement> =
  Converters.enumeratedValue<MemoryDurabilityRequirement>(['session', 'process-crash']);

/** Log without letting a throwing logger affect the store operation. */
function log(logger: Logging.ILogger, level: 'info' | 'warn', message: string): void {
  try {
    logger[level](message);
  } catch {
    // Diagnostic logging must not affect the store operation.
  }
}

interface IRootAnswer {
  readonly guarantee?: FileTree.AtomicWriteGuarantee;
  readonly reason: string;
}

/** Ask the root what atomic writes it can make, and pick the strongest guarantee it lists. */
function inquire(root: FileTree.IMutableFileTreeDirectoryItem): Result<IRootAnswer> {
  if (!FileTree.isAtomicDirectoryItem(root)) {
    return succeed({ reason: 'the root does not implement atomic writes' });
  }
  return root
    .getAtomicWriteCapabilities()
    .withErrorFormat((m) => `memory store: cannot ask root '${root.absolutePath}' about atomic writes: ${m}`)
    .onSuccess((capabilities) => {
      const offered: ReadonlyArray<FileTree.AtomicWriteGuarantee> = guaranteeRank.filter((g) =>
        capabilities.guarantees.includes(g)
      );
      const guarantee: FileTree.AtomicWriteGuarantee | undefined = capabilities.atomicReplace
        ? offered[offered.length - 1]
        : undefined;
      const reason: string =
        capabilities.reason ??
        (guarantee === undefined
          ? 'the root reports no atomic replacement'
          : `the root offers [${offered.join(', ')}]`);
      return succeed<IRootAnswer>({ guarantee, reason });
    });
}

/**
 * The open store's hold on its root: the single-writer claim, the durability it established, and
 * the writer every record write and delete goes through.
 * @internal
 */
export class StoreRootSession implements IRecordWriter {
  public readonly durability: IMemoryStoreDurability;
  private readonly _ownership: IRootOwnership;
  private readonly _logger: Logging.ILogger;

  private constructor(
    durability: IMemoryStoreDurability,
    ownership: IRootOwnership,
    logger: Logging.ILogger
  ) {
    this.durability = durability;
    this._ownership = ownership;
    this._logger = logger;
  }

  public get guarantee(): FileTree.AtomicWriteGuarantee | undefined {
    return this.durability.guarantee;
  }

  /**
   * Establish durability, claim the root, then sweep the working files interrupted writes left
   * behind. The sweep runs only once the claim is held, because a live writer's working file is
   * indistinguishable from an orphan. A refused requirement fails before anything is claimed.
   */
  public static open(
    root: FileTree.IMutableFileTreeDirectoryItem,
    options: IMemoryStoreDurabilityOptions | undefined,
    logger: Logging.ILogger
  ): Result<StoreRootSession> {
    const required: Result<MemoryDurabilityRequirement | undefined> =
      options?.require === undefined
        ? succeed(undefined)
        : requirementConverter
            .convert(options.require)
            .withErrorFormat((m) => `memory store: durability.require: ${m}`);
    return required.onSuccess((requirement) =>
      inquire(root).onSuccess((answer) => {
        if (
          requirement !== undefined &&
          (answer.guarantee === undefined ||
            guaranteeRank.indexOf(answer.guarantee) < guaranteeRank.indexOf(requirement))
        ) {
          return fail<StoreRootSession>(
            `memory store: root '${root.absolutePath}' cannot write records atomically at the required ` +
              `'${requirement}' guarantee: ${answer.reason}`
          );
        }
        return acquireStoreRoot(root, answer.guarantee !== 'session').onSuccess((ownership) => {
          const removedTemporaries: ReadonlyArray<string> = sweepAtomicTemporaries(root, '')
            .onSuccess((removed) => {
              if (removed.length > 0) {
                log(
                  logger,
                  'info',
                  `memory store: removed ${removed.length} interrupted-write working file(s): ${removed.join(
                    ', '
                  )}`
                );
              }
              return succeed(removed);
            })
            .onFailure((m) => {
              // A working file is not a record file, so one left behind cannot be read as a record.
              log(logger, 'warn', `memory store: could not sweep interrupted-write working files: ${m}`);
              return fail(m);
            })
            .orDefault([]);
          const durability: IMemoryStoreDurability = {
            atomic: answer.guarantee !== undefined,
            ...(answer.guarantee !== undefined ? { guarantee: answer.guarantee } : {}),
            reason: answer.reason,
            removedTemporaries
          };
          return succeed(new StoreRootSession(durability, ownership, logger));
        });
      })
    );
  }

  /** Release the root. Idempotent. */
  public release(): void {
    this._ownership.release();
  }

  /** {@inheritDoc IRecordWriter.checkWritable} */
  public checkWritable(): Result<true> {
    return this._ownership.released
      ? fail('memory store: disposed; it no longer writes to its root')
      : succeed(true);
  }

  /** {@inheritDoc IRecordWriter.warn} */
  public warn(message: string): void {
    log(this._logger, 'warn', message);
  }
}
