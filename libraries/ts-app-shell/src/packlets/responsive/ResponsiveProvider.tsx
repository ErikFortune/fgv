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

import React, { createContext, useContext } from 'react';
import { type IResponsiveLayout, type LayoutMode, useResponsiveLayout } from './useResponsiveLayout';

const ResponsiveContext: React.Context<IResponsiveLayout | undefined> = createContext<
  IResponsiveLayout | undefined
>(undefined);

/**
 * Props for {@link ResponsiveProvider}.
 * @public
 */
export interface IResponsiveProviderProps {
  /** Optional layout mode override (for testing or storybook). */
  readonly forceLayoutMode?: LayoutMode;
  /** Children */
  readonly children: React.ReactNode;
}

/**
 * Provides responsive layout information to the component tree via context.
 *
 * Wrap your app (or a subtree) with this provider. Descendants use
 * {@link useResponsive} to read the current layout mode, device type, etc.
 *
 * @example
 * ```tsx
 * <ResponsiveProvider>
 *   <App />
 * </ResponsiveProvider>
 * ```
 * @public
 */
export function ResponsiveProvider({
  forceLayoutMode,
  children
}: IResponsiveProviderProps): React.JSX.Element {
  const layout = useResponsiveLayout(forceLayoutMode);
  return <ResponsiveContext.Provider value={layout}>{children}</ResponsiveContext.Provider>;
}

/**
 * Access the current responsive layout information.
 *
 * Must be called within a {@link ResponsiveProvider}.
 * @public
 */
export function useResponsive(): IResponsiveLayout {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
}
