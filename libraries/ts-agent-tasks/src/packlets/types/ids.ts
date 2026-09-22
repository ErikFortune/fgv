/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Brand } from '@fgv/ts-utils';

/**
 * Stable identity of a task within one repository. Never derived from a scope,
 * an assignee or a source-supplied path fragment, and never recycled.
 * @public
 */
export type TaskId = Brand<string, 'TaskId'>;

/**
 * Registered kind of a task, such as `fgv.tracked`. Paired with a detail version
 * to select a registered converter.
 * @public
 */
export type TaskKind = Brand<string, 'TaskKind'>;

/**
 * Monotonic semantic revision of a task. A positive safe integer; timestamps are
 * never concurrency tokens.
 * @public
 */
export type TaskRevision = Brand<number, 'TaskRevision'>;

/**
 * Caller-supplied identity of one mutating operation, used for deduplication.
 * @public
 */
export type OperationId = Brand<string, 'OperationId'>;

/**
 * Identity of one immutable update payload owed to an audience.
 * @public
 */
export type UpdateId = Brand<string, 'UpdateId'>;

/**
 * Identity of a consumer of task updates.
 * @public
 */
export type ConsumerId = Brand<string, 'ConsumerId'>;

/**
 * Identity of one subscription held by a consumer.
 * @public
 */
export type SubscriptionId = Brand<string, 'SubscriptionId'>;

/**
 * Identity of one issued delivery.
 * @public
 */
export type DeliveryId = Brand<string, 'DeliveryId'>;

/**
 * Identity of one repository-generated capacity claim.
 * @public
 */
export type CapacityClaimId = Brand<string, 'CapacityClaimId'>;

/**
 * Opaque keyset paging cursor, bound to a normalized query and a repository generation.
 * @public
 */
export type PageCursor = Brand<string, 'TaskPageCursor'>;

/**
 * An absolute instant, as canonical UTC `YYYY-MM-DDTHH:mm:ss.sssZ`.
 *
 * @remarks
 * Zone-free, offset-qualified and non-canonical spellings are rejected at the
 * converter boundary; hosts normalize before reaching it.
 * @public
 */
export type Instant = Brand<string, 'TaskInstant'>;
