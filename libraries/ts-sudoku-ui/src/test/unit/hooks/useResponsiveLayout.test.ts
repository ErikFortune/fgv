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

import { renderHook, act, waitFor } from '@testing-library/react';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';

// Mock window properties
const mockWindowDimensions = (width: number, height: number): void => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
};

// Mock touch support
const mockTouchSupport = (isTouch: boolean): void => {
  if (isTouch) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: jest.fn()
    });

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5
    });
  } else {
    delete (window as unknown as { ontouchstart?: unknown }).ontouchstart;

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0
    });
  }
};

describe('useResponsiveLayout', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    window.removeEventListener('resize', jest.fn());
    window.removeEventListener('orientationchange', jest.fn());
  });

  test('should detect mobile device in portrait mode', () => {
    mockWindowDimensions(400, 800);
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.orientation).toBe('portrait');
    expect(result.current.screenWidth).toBe(400);
    expect(result.current.screenHeight).toBe(800);
    expect(result.current.isTouchDevice).toBe(true);
    expect(result.current.isSmallScreen).toBe(true);
    expect(result.current.keypadLayoutMode).toBe('side-by-side');
  });

  test('should detect mobile device in landscape mode', () => {
    mockWindowDimensions(700, 400); // Smaller width to ensure mobile detection
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.orientation).toBe('landscape');
    expect(result.current.keypadLayoutMode).toBe('overlay'); // Height < 600
  });

  test('should detect tablet device', () => {
    mockWindowDimensions(900, 1200);
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.deviceType).toBe('tablet');
    expect(result.current.orientation).toBe('portrait');
    expect(result.current.keypadLayoutMode).toBe('side-by-side');
  });

  test('should detect desktop device without touch', () => {
    mockWindowDimensions(1200, 900);
    mockTouchSupport(false);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.deviceType).toBe('desktop');
    expect(result.current.orientation).toBe('landscape');
    expect(result.current.isTouchDevice).toBe(false);
    expect(result.current.keypadLayoutMode).toBe('hidden');
  });

  test('should detect desktop device with touch (hybrid)', () => {
    mockWindowDimensions(1200, 900);
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.deviceType).toBe('desktop');
    expect(result.current.isTouchDevice).toBe(true);
    expect(result.current.keypadLayoutMode).toBe('overlay');
  });

  test('should determine space for dual keypads correctly', () => {
    // Wide enough for dual keypads
    mockWindowDimensions(500, 800);
    mockTouchSupport(true);

    const { result: result1 } = renderHook(() => useResponsiveLayout());
    expect(result1.current.hasSpaceForDualKeypads).toBe(true);

    // Not wide enough but landscape orientation (width > height) with enough height
    mockWindowDimensions(800, 700); // Landscape with sufficient height
    mockTouchSupport(true);

    const { result: result2 } = renderHook(() => useResponsiveLayout());
    expect(result2.current.hasSpaceForDualKeypads).toBe(true);

    // Not enough space - narrow and insufficient height
    mockWindowDimensions(300, 500);
    mockTouchSupport(true);

    const { result: result3 } = renderHook(() => useResponsiveLayout());
    expect(result3.current.hasSpaceForDualKeypads).toBe(false);
  });

  test('should update on window resize', () => {
    mockWindowDimensions(400, 800);
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.orientation).toBe('portrait');

    // Simulate resize to landscape (but keep width mobile)
    act(() => {
      mockWindowDimensions(700, 400); // Still mobile width
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.orientation).toBe('landscape');
  });

  test('should update on orientation change', async () => {
    jest.useFakeTimers();
    mockWindowDimensions(400, 800);
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.orientation).toBe('portrait');

    act(() => {
      mockWindowDimensions(800, 400);
      window.dispatchEvent(new Event('orientationchange'));
      jest.advanceTimersByTime(100); // Match the hook's setTimeout delay
    });

    await waitFor(
      () => {
        expect(result.current.orientation).toBe('landscape');
      },
      { timeout: 1000 }
    );

    jest.useRealTimers();
  });

  test('should determine correct keypad layout modes', () => {
    // Mobile portrait with enough width
    mockWindowDimensions(400, 800);
    mockTouchSupport(true);
    const { result: mobile } = renderHook(() => useResponsiveLayout());
    expect(mobile.current.keypadLayoutMode).toBe('side-by-side');

    // Mobile portrait with insufficient width
    mockWindowDimensions(300, 800);
    mockTouchSupport(true);
    const { result: mobileNarrow } = renderHook(() => useResponsiveLayout());
    expect(mobileNarrow.current.keypadLayoutMode).toBe('stacked');

    // Tablet portrait
    mockWindowDimensions(900, 1200);
    mockTouchSupport(true);
    const { result: tablet } = renderHook(() => useResponsiveLayout());
    expect(tablet.current.keypadLayoutMode).toBe('side-by-side');

    // Tablet landscape
    mockWindowDimensions(1200, 900);
    mockTouchSupport(true);
    const { result: tabletLandscape } = renderHook(() => useResponsiveLayout());
    expect(tabletLandscape.current.keypadLayoutMode).toBe('overlay'); // Desktop size with touch
  });

  test('should respect forceLayoutMode parameter', () => {
    mockWindowDimensions(400, 800);
    mockTouchSupport(true);

    // Normal mode would be 'side-by-side' for mobile portrait
    const { result: normal } = renderHook(() => useResponsiveLayout());
    expect(normal.current.keypadLayoutMode).toBe('side-by-side');

    // Force overlay mode
    const { result: forced } = renderHook(() => useResponsiveLayout('overlay'));
    expect(forced.current.keypadLayoutMode).toBe('overlay');

    // Device type and other properties should still be detected normally
    expect(forced.current.deviceType).toBe('mobile');
    expect(forced.current.orientation).toBe('portrait');
  });

  test('should not update when forceLayoutMode is set', () => {
    mockWindowDimensions(400, 800);
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout('stacked'));

    expect(result.current.keypadLayoutMode).toBe('stacked');

    // Simulate resize - should NOT update when forced
    act(() => {
      mockWindowDimensions(1200, 900);
      window.dispatchEvent(new Event('resize'));
    });

    // Layout mode should remain forced, but dimensions should still be from initial state
    expect(result.current.keypadLayoutMode).toBe('stacked');
    expect(result.current.screenWidth).toBe(400); // Still the initial width
  });

  test('should detect tablet in landscape mode', () => {
    mockWindowDimensions(1200, 900); // Landscape tablet size
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    // At 1200x900 with touch, this is desktop size (> 1024) so it becomes 'desktop' with 'overlay'
    // To get a true tablet, we need width between 768 and 1024
    expect(result.current.deviceType).toBe('desktop');
    expect(result.current.keypadLayoutMode).toBe('overlay');
  });

  test('should detect tablet landscape with correct dimensions', () => {
    mockWindowDimensions(1000, 800); // Tablet width (768-1024) in landscape
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.deviceType).toBe('tablet');
    expect(result.current.orientation).toBe('landscape');
    expect(result.current.keypadLayoutMode).toBe('stacked');
  });

  test('should detect mobile landscape with sufficient height', () => {
    mockWindowDimensions(700, 650); // Mobile width, landscape, height >= 600
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.orientation).toBe('landscape');
    expect(result.current.keypadLayoutMode).toBe('stacked'); // Height >= 600
  });

  test('should detect no space for dual keypads in narrow portrait', () => {
    // Width < 480 and portrait (width < height)
    // This tests that both OR conditions are false: width < 480 AND not landscape
    mockWindowDimensions(400, 500);
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.hasSpaceForDualKeypads).toBe(false); // width < 480 && portrait
    expect(result.current.orientation).toBe('portrait');
    expect(result.current.screenWidth).toBe(400);
    expect(result.current.screenHeight).toBe(500);
  });

  test('should detect no space in narrow landscape with insufficient height', () => {
    // Width < 480, landscape, but height < 600
    // This tests: width < 480 AND (landscape but height < 600)
    mockWindowDimensions(470, 400);
    mockTouchSupport(true);

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.hasSpaceForDualKeypads).toBe(false);
    expect(result.current.orientation).toBe('landscape');
    expect(result.current.screenWidth).toBe(470);
    expect(result.current.screenHeight).toBe(400);
  });
});
