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

import { useState, useEffect } from 'react';

/**
 * Device type detection result.
 * @public
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Screen orientation.
 * @public
 */
export type ScreenOrientation = 'portrait' | 'landscape';

/**
 * Layout mode that drives structural rendering decisions.
 * - `full`: Desktop — sidebar visible, cascade columns side-by-side.
 * - `compact`: Tablet — sidebar as drawer, cascade still horizontal.
 * - `mobile`: Phone — sidebar as drawer, cascade becomes a view stack.
 * @public
 */
export type LayoutMode = 'full' | 'compact' | 'mobile';

/**
 * Responsive layout information exposed by the hook and context.
 * @public
 */
export interface IResponsiveLayout {
  /** Device type based on screen size and touch capability */
  readonly deviceType: DeviceType;

  /** Current screen orientation */
  readonly orientation: ScreenOrientation;

  /** Structural layout mode driving component tree decisions */
  readonly layoutMode: LayoutMode;

  /** Viewport width in pixels */
  readonly screenWidth: number;

  /** Viewport height in pixels */
  readonly screenHeight: number;

  /** Whether the device supports touch input */
  readonly isTouchDevice: boolean;
}

/**
 * Breakpoints for responsive design (in CSS pixels).
 */
const BREAKPOINTS = {
  /** At or below this width, use mobile layout */
  mobile: 640,
  /** At or below this width, use compact layout */
  compact: 1024
} as const;

/**
 * Detect if the device supports touch input.
 */
function detectTouchSupport(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    ((navigator as unknown as { msMaxTouchPoints?: number }).msMaxTouchPoints ?? 0) > 0
  );
}

/**
 * Determine device type from viewport dimensions and touch capability.
 */
function determineDeviceType(width: number, isTouch: boolean): DeviceType {
  if (width <= BREAKPOINTS.mobile) {
    return 'mobile';
  }
  if (width <= BREAKPOINTS.compact && isTouch) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Determine the structural layout mode from viewport width.
 */
function determineLayoutMode(width: number): LayoutMode {
  if (width <= BREAKPOINTS.mobile) {
    return 'mobile';
  }
  if (width <= BREAKPOINTS.compact) {
    return 'compact';
  }
  return 'full';
}

/**
 * Compute the full layout info from current viewport state.
 */
function computeLayout(forceLayoutMode?: LayoutMode): IResponsiveLayout {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouchDevice = detectTouchSupport();
  const orientation: ScreenOrientation = width > height ? 'landscape' : 'portrait';
  const deviceType = determineDeviceType(width, isTouchDevice);
  const layoutMode = forceLayoutMode ?? determineLayoutMode(width);

  return {
    deviceType,
    orientation,
    layoutMode,
    screenWidth: width,
    screenHeight: height,
    isTouchDevice
  };
}

/**
 * Hook that tracks responsive layout information for the current viewport.
 *
 * Listens to `resize` and `orientationchange` events and recomputes layout
 * on every change. Use the `layoutMode` field to drive structural rendering
 * decisions (e.g., sidebar as drawer vs. fixed panel).
 *
 * @param forceLayoutMode - Optional override for testing or storybook use.
 * @public
 */
export function useResponsiveLayout(forceLayoutMode?: LayoutMode): IResponsiveLayout {
  const [layout, setLayout] = useState<IResponsiveLayout>(() => computeLayout(forceLayoutMode));

  useEffect(() => {
    if (forceLayoutMode) {
      return;
    }

    function updateLayout(): void {
      setLayout(computeLayout());
    }

    window.addEventListener('resize', updateLayout);

    const onOrientationChange = (): void => {
      // Small delay to let the browser update viewport dimensions
      setTimeout(updateLayout, 100);
    };
    window.addEventListener('orientationchange', onOrientationChange);

    // Sync on mount in case viewport changed between SSR and hydration
    updateLayout();

    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, [forceLayoutMode]);

  return layout;
}
