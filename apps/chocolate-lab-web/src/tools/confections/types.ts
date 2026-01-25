/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import type { ConfectionType } from '@fgv/ts-chocolate';

/**
 * Confection filter state
 */
export interface IConfectionFilters {
  /** Search text */
  search: string;
  /** Selected confection types */
  confectionTypes: ConfectionType[];
  /** Selected collections */
  collections: string[];
  /** Selected tags */
  tags: string[];
}
