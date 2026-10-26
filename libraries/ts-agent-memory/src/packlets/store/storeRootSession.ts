/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Converter, Converters, Logging, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import {
  IMemoryStoreDurability,
  IMemoryStoreDurabilityOptions,
  MemoryDurabilityRequirement,
  memoryDurabilityRequirements
} from './openReport';
import { IRootOwnership, acquireStoreRoot } from './rootOwnership';
import { IRecordWriter, ISweepReport, sweepAtomicTemporaries } from './storeFileAccess';

const guaranteeRank: ReadonlyArray<FileTree.AtomicWriteGuarantee> = FileTree.atomicWriteGuarantees;

const requirementConverter: Converter<MemoryDurabilityRequirement> =
  Converters.enumeratedValue<MemoryDurabilityRequirement>(memoryDurabilityRequirements);

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

/**
 * Ask the root what atomic writes it can make, and pick the strongest guarantee it lists. Never
 * fails: a root that cannot answer (or throws) is answered as offering none, with the reason, so
 * the store degrades exactly as it does for a root without the capability — and a `require`
 * refuses it.
 */
function inquire(root: FileTree.IMutableFileTreeDirectoryItem): IRootAnswer {
  if (!FileTree.isAtomicDirectoryItem(root)) {
    return { reason: 'the root does not implement atomic writes' };
  }
  const asked: Result<IRootAnswer> = captureResult(() => root.getAtomicWriteCapabilities())
    .onSuccess((answer) => answer)
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
  return asked.isSuccess()
    ? asked.value
    : { reason: `the root could not say what atomic writes it offers: ${asked.message}` };
}

/** Sweep, turning a throw into a reported failure: the claim is already held. */
function sweep(root: FileTree.IFileTreeDirectoryItem): ISweepReport {
  const swept: Result<ISweepReport> = captureResult(() => sweepAtomicTemporaries(root));
  return swept.isSuccess() ? swept.value : { removed: [], failures: [`the sweep threw: ${swept.message}`] };
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

  /** Whether this session has released its root (the store was disposed). */
  public get released(): boolean {
    return this._ownership.released;
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
    return required.onSuccess((requirement) => {
      const answer: IRootAnswer = inquire(root);
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
      return acquireStoreRoot(root).onSuccess((ownership) => {
        const swept: ISweepReport = sweep(root);
        if (swept.removed.length > 0) {
          log(
            logger,
            'info',
            `memory store: removed ${
              swept.removed.length
            } interrupted-write working file(s): ${swept.removed.join(', ')}`
          );
        }
        if (swept.failures.length > 0) {
          // A working file is not a record file, so one left behind cannot be read as a record.
          log(
            logger,
            'warn',
            `memory store: could not sweep every interrupted-write working file: ${swept.failures.join('; ')}`
          );
        }
        const durability: IMemoryStoreDurability = {
          atomic: answer.guarantee !== undefined,
          ...(answer.guarantee !== undefined ? { guarantee: answer.guarantee } : {}),
          reason: answer.reason,
          removedTemporaries: swept.removed
        };
        return succeed(new StoreRootSession(durability, ownership, logger));
      });
    });
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
