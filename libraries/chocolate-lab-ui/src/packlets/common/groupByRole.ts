/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Utility for grouping ingredients by role while preserving original indices.
 * @packageDocumentation
 */

import type { IngredientRole } from '@fgv/ts-chocolate';

/**
 * A single item within a role group, carrying its original array index.
 * @public
 */
export interface IGroupedItem<T> {
  readonly item: T;
  readonly originalIndex: number;
}

/**
 * A group of ingredients sharing the same role.
 * @public
 */
export interface IIngredientGroup<T> {
  /** The role for this group, or `undefined` for ungrouped ingredients. */
  readonly role: IngredientRole | undefined;
  /** Human-friendly label derived from the role (kebab-case → Title Case), or `undefined` for the default group. */
  readonly label: string | undefined;
  /** Items in this group with their original array indices preserved. */
  readonly items: ReadonlyArray<IGroupedItem<T>>;
}

/**
 * Converts a kebab-case role to a title-case label.
 * Example: "ganache-base" → "Ganache Base"
 */
function roleToLabel(role: IngredientRole): string {
  return String(role)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Groups items by role, preserving original array indices and insertion order.
 *
 * Group order is determined by the position of the first item with each role.
 * Items without a role are collected into a single default group whose position
 * is determined by the first role-less item.
 *
 * When no items have roles, returns a single group with `label: undefined`,
 * effectively degenerating to a flat list.
 *
 * @param items - The array of items to group
 * @param getRole - Extracts the role from an item
 * @returns Ordered array of groups
 * @public
 */
export function groupByRole<T>(
  items: ReadonlyArray<T>,
  getRole: (item: T) => IngredientRole | undefined
): ReadonlyArray<IIngredientGroup<T>> {
  const groupMap = new Map<string, IGroupedItem<T>[]>();
  const groupOrder: string[] = [];
  const DEFAULT_KEY = '\0__default__';

  for (let i = 0; i < items.length; i++) {
    const role = getRole(items[i]);
    const key = role !== undefined ? String(role) : DEFAULT_KEY;

    let group = groupMap.get(key);
    if (group === undefined) {
      group = [];
      groupMap.set(key, group);
      groupOrder.push(key);
    }
    group.push({ item: items[i], originalIndex: i });
  }

  // When there are multiple groups (some with roles, some without),
  // give the default group a visible label so it doesn't silently merge
  // with an adjacent role group.
  const hasRoleGroups = groupOrder.some((key) => key !== DEFAULT_KEY);
  const hasDefaultGroup = groupOrder.indexOf(DEFAULT_KEY) >= 0;
  const showDefaultLabel = hasRoleGroups && hasDefaultGroup;

  // Move default group to end when role groups exist, so "Other" always appears last.
  if (showDefaultLabel) {
    const idx = groupOrder.indexOf(DEFAULT_KEY);
    groupOrder.splice(idx, 1);
    groupOrder.push(DEFAULT_KEY);
  }

  return groupOrder.map((key) => {
    const role = key === DEFAULT_KEY ? undefined : (key as IngredientRole);
    return {
      role,
      label: role !== undefined ? roleToLabel(role) : showDefaultLabel ? 'Other' : undefined,
      items: groupMap.get(key)!
    };
  });
}
