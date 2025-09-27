/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
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
 * Device type detection result
 * @public
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Screen orientation
 * @public
 */
export type ScreenOrientation = 'portrait' | 'landscape';

/**
 * Layout mode for dual keypad
 * @public
 */
export type KeypadLayoutMode = 'side-by-side' | 'stacked' | 'overlay' | 'hidden';

/**
 * Responsive layout information
 * @public
 */
export interface IResponsiveLayoutInfo {
  /** Device type based on screen size and touch capability */
  readonly deviceType: DeviceType;

  /** Current screen orientation */
  readonly orientation: ScreenOrientation;

  /** Recommended keypad layout mode */
  readonly keypadLayoutMode: KeypadLayoutMode;

  /** Screen width in pixels */
  readonly screenWidth: number;

  /** Screen height in pixels */
  readonly screenHeight: number;

  /** Whether touch is supported */
  readonly isTouchDevice: boolean;

  /** Whether the screen is considered small */
  readonly isSmallScreen: boolean;

  /** Whether the screen has enough space for dual keypads */
  readonly hasSpaceForDualKeypads: boolean;
}

/**
 * Breakpoints for responsive design
 */
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  smallHeight: 600
} as const;

/**
 * Detect if device supports touch
 */
function detectTouchSupport(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    ((navigator as unknown as { msMaxTouchPoints?: number }).msMaxTouchPoints ?? 0) > 0
  );
}

/**
 * Determine device type based on screen size and touch capability
 */
function determineDeviceType(width: number, height: number, isTouch: boolean): DeviceType {
  if (width <= BREAKPOINTS.mobile) {
    return 'mobile';
  }

  if (width <= BREAKPOINTS.tablet && isTouch) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Determine optimal keypad layout mode
 */
function determineKeypadLayoutMode(
  deviceType: DeviceType,
  orientation: ScreenOrientation,
  width: number,
  height: number,
  isTouch: boolean
): KeypadLayoutMode {
  // Desktop: show overlay on demand or hidden by default
  if (deviceType === 'desktop') {
    return isTouch ? 'overlay' : 'hidden';
  }

  // Mobile portrait: side-by-side if width allows
  if (deviceType === 'mobile' && orientation === 'portrait') {
    return width >= 360 ? 'side-by-side' : 'stacked';
  }

  // Mobile landscape: stacked beside grid if height allows
  if (deviceType === 'mobile' && orientation === 'landscape') {
    return height >= BREAKPOINTS.smallHeight ? 'stacked' : 'overlay';
  }

  // Tablet: side-by-side in portrait, stacked in landscape
  if (deviceType === 'tablet') {
    return orientation === 'portrait' ? 'side-by-side' : 'stacked';
  }

  return 'overlay';
}

/**
 * Hook to detect responsive layout information for optimal keypad display
 * @public
 */
export function useResponsiveLayout(): IResponsiveLayoutInfo {
  const [layoutInfo, setLayoutInfo] = useState<IResponsiveLayoutInfo>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouchDevice = detectTouchSupport();
    const orientation: ScreenOrientation = width > height ? 'landscape' : 'portrait';
    const deviceType = determineDeviceType(width, height, isTouchDevice);
    const keypadLayoutMode = determineKeypadLayoutMode(deviceType, orientation, width, height, isTouchDevice);

    return {
      deviceType,
      orientation,
      keypadLayoutMode,
      screenWidth: width,
      screenHeight: height,
      isTouchDevice,
      isSmallScreen: width <= BREAKPOINTS.mobile,
      hasSpaceForDualKeypads:
        width >= 480 || (orientation === 'landscape' && height >= BREAKPOINTS.smallHeight)
    };
  });

  useEffect(() => {
    function updateLayoutInfo(): void {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = detectTouchSupport();
      const orientation: ScreenOrientation = width > height ? 'landscape' : 'portrait';
      const deviceType = determineDeviceType(width, height, isTouchDevice);
      const keypadLayoutMode = determineKeypadLayoutMode(
        deviceType,
        orientation,
        width,
        height,
        isTouchDevice
      );

      setLayoutInfo({
        deviceType,
        orientation,
        keypadLayoutMode,
        screenWidth: width,
        screenHeight: height,
        isTouchDevice,
        isSmallScreen: width <= BREAKPOINTS.mobile,
        hasSpaceForDualKeypads:
          width >= 480 || (orientation === 'landscape' && height >= BREAKPOINTS.smallHeight)
      });
    }

    // Update on resize
    window.addEventListener('resize', updateLayoutInfo);

    // Update on orientation change
    window.addEventListener('orientationchange', () => {
      // Small delay to ensure screen dimensions are updated
      setTimeout(updateLayoutInfo, 100);
    });

    // Initial update
    updateLayoutInfo();

    return () => {
      window.removeEventListener('resize', updateLayoutInfo);
      window.removeEventListener('orientationchange', updateLayoutInfo);
    };
  }, []);

  return layoutInfo;
}
