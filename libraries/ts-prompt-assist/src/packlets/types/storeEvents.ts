/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { PromptId, ScopeKey } from './ids';
import { PromptStoreEventKind } from './enums';

/**
 * Pinned store-change event shape (per OQ-3). No v0.1 adapter emits these;
 * the shape is fixed now so a future watch-implementing adapter doesn't
 * churn the type surface.
 * @public
 */
export interface IPromptStoreEvent {
  /** Discriminator. */
  readonly kind: PromptStoreEventKind;
  readonly scope: ScopeKey;
  /**
   * Set for `descriptor-changed` / `descriptor-removed`; undefined for the
   * scope-scoped events.
   */
  readonly id?: PromptId;
}

/**
 * Minimal disposable contract for `watch` subscriptions.
 * @public
 */
export interface IDisposable {
  dispose(): void;
}
