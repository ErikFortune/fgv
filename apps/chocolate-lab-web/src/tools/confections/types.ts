/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import type { ConfectionType } from '@fgv/ts-chocolate';
import type { IBaseFilterState } from '@fgv/ts-chocolate-ui';

/**
 * Confection filter state
 */
export interface IConfectionFilters extends IBaseFilterState {
  /** Selected confection types */
  confectionTypes: ConfectionType[];
}
