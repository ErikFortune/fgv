'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.useResponsiveLayout = useResponsiveLayout;
const react_1 = require('react');
/**
 * Breakpoints for responsive design
 */
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  smallHeight: 600
};
/**
 * Detect if device supports touch
 */
function detectTouchSupport() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator.msMaxTouchPoints ?? 0) > 0;
}
/**
 * Determine device type based on screen size and touch capability
 */
function determineDeviceType(width, height, isTouch) {
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
function determineKeypadLayoutMode(deviceType, orientation, width, height, isTouch) {
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
  /* c8 ignore next 2 - defense in depth: all device types are explicitly handled above */
  return 'overlay';
}
/**
 * Hook to detect responsive layout information for optimal keypad display
 * @param forceLayoutMode - Optional layout mode override for testing
 * @public
 */
function useResponsiveLayout(forceLayoutMode) {
  const [layoutInfo, setLayoutInfo] = (0, react_1.useState)(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouchDevice = detectTouchSupport();
    const orientation = width > height ? 'landscape' : 'portrait';
    const deviceType = determineDeviceType(width, height, isTouchDevice);
    const keypadLayoutMode =
      forceLayoutMode ?? determineKeypadLayoutMode(deviceType, orientation, width, height, isTouchDevice);
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
  (0, react_1.useEffect)(() => {
    // Don't set up listeners if layout mode is forced
    if (forceLayoutMode) {
      return;
    }
    function updateLayoutInfo() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = detectTouchSupport();
      const orientation = width > height ? 'landscape' : 'portrait';
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
  }, [forceLayoutMode]);
  return layoutInfo;
}
//# sourceMappingURL=useResponsiveLayout.js.map
