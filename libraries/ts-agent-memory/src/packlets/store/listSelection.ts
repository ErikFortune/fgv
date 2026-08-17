/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Kind, MemoryScopeKey, Tag } from '../types';

/**
 * Filter for {@link IMemoryStore.list}. All present fields are ANDed together.
 *
 * @remarks
 * **At least one of `scope` / `kind` / `tag` must be present.** `asOf` is a
 * temporal *projection*, not a narrowing — it collapses versions rather than
 * excluding entities — so it does not satisfy the requirement on its own. A
 * selection that narrows nothing fails with a message naming
 * {@link scanEveryRecord}.
 * @public
 */
export interface IMemoryStoreListFilter {
  /**
   * Never present on a narrowing filter.
   *
   * @remarks
   * Exclusivity marker, paired with the `never`s on {@link IWholeVaultScan}.
   * Without it `{ scanEveryRecord: true, kind }` type-checks — TypeScript's
   * excess-property check on a union admits any property declared by *any*
   * member — and `list` then takes the scan branch and silently discards the
   * narrowing. Since the whole point of requiring a selection is that a
   * whole-vault read must be deliberate, a call that reads the whole vault while
   * *looking* narrowed is the one outcome this surface must not permit.
   */
  readonly scanEveryRecord?: never;
  /** Restrict to records in this scope. */
  readonly scope?: MemoryScopeKey;
  /** Restrict to records of this kind. */
  readonly kind?: Kind;
  /** Restrict to records carrying this tag (exact match). */
  readonly tag?: Tag;
  /**
   * For temporal (versioned) kinds: collapse each entity to the single version
   * valid at this epoch ms. Non-temporal records are timeless and pass through
   * unchanged. Absent = no temporal projection (every version is returned).
   */
  readonly asOf?: number;
}

/**
 * The named, deliberately uncomfortable opt-out from
 * {@link IMemoryStore.list}'s narrowing requirement — build one with
 * {@link scanEveryRecord}.
 * @public
 */
export interface IWholeVaultScan {
  /** Discriminator. Always `true`; produced only by {@link scanEveryRecord}. */
  readonly scanEveryRecord: true;
  /**
   * Never present on a whole-vault scan — see
   * {@link IMemoryStoreListFilter.scanEveryRecord} for why these markers exist.
   * A scan that also carried a narrowing axis would have that axis dropped.
   */
  readonly scope?: never;
  /** Never present on a whole-vault scan. See {@link IWholeVaultScan.scope}. */
  readonly kind?: never;
  /** Never present on a whole-vault scan. See {@link IWholeVaultScan.scope}. */
  readonly tag?: never;
  /**
   * Optional temporal projection, exactly as on {@link IMemoryStoreListFilter}.
   * NOT excluded, because `asOf` projects rather than narrows and composes with
   * a whole-vault read exactly as it does with a filtered one.
   */
  readonly asOf?: number;
}

/**
 * What {@link IMemoryStore.list} accepts: a narrowing filter, or the explicit
 * whole-vault scan.
 * @public
 */
export type MemoryListSelection = IMemoryStoreListFilter | IWholeVaultScan;

/**
 * Ask {@link IMemoryStore.list} for **every record in the vault**, bodies
 * included.
 *
 * @remarks
 * `list` requires a selection and rejects one that narrows nothing, so this is
 * the only way to get the whole vault — and that is the point. Since the index
 * holds envelopes only, `list` materializes every survivor from storage, so an
 * unnarrowed call reads one file per record. Making it impossible to write by
 * accident is worth more than making it fast.
 *
 * It is named for what it costs rather than for what it returns, and it is
 * greppable: `scanEveryRecord` enumerates every whole-vault read in a codebase in
 * one search. This mirrors `@fgv/ts-extras`' `safer-fetch`, where `addressGuard`
 * is required with no default and `allowAnyAddress()` is the named opt-out.
 *
 * **If you only need to select, you do not need this.** Use
 * {@link IMemoryStore.listEntries}, which returns every entry's scope and
 * envelope, reads no files, and needs no selection.
 * @public
 */
export function scanEveryRecord(options?: { readonly asOf?: number }): IWholeVaultScan {
  return {
    scanEveryRecord: true,
    ...(options?.asOf !== undefined ? { asOf: options.asOf } : {})
  };
}

/**
 * Whether a selection is the explicit whole-vault opt-out.
 * @public
 */
export function isWholeVaultScan(selection: MemoryListSelection): selection is IWholeVaultScan {
  return (selection as IWholeVaultScan).scanEveryRecord === true;
}
