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
exports.CageLookupManager = exports.SegmentBit = void 0;
/**
 * Segment bit positions for the 12-bit mask
 */
var SegmentBit;
(function (SegmentBit) {
  // Edges (bits 0-3)
  SegmentBit[(SegmentBit['EDGE_TOP'] = 1)] = 'EDGE_TOP';
  SegmentBit[(SegmentBit['EDGE_RIGHT'] = 2)] = 'EDGE_RIGHT';
  SegmentBit[(SegmentBit['EDGE_BOTTOM'] = 4)] = 'EDGE_BOTTOM';
  SegmentBit[(SegmentBit['EDGE_LEFT'] = 8)] = 'EDGE_LEFT';
  // Corner connectors (bits 4-7)
  SegmentBit[(SegmentBit['CORNER_TOP_RIGHT'] = 16)] = 'CORNER_TOP_RIGHT';
  SegmentBit[(SegmentBit['CORNER_BOTTOM_RIGHT'] = 32)] = 'CORNER_BOTTOM_RIGHT';
  SegmentBit[(SegmentBit['CORNER_BOTTOM_LEFT'] = 64)] = 'CORNER_BOTTOM_LEFT';
  SegmentBit[(SegmentBit['CORNER_TOP_LEFT'] = 128)] = 'CORNER_TOP_LEFT';
  // Internal segments (bits 8-11)
  SegmentBit[(SegmentBit['INTERNAL_TOP'] = 256)] = 'INTERNAL_TOP';
  SegmentBit[(SegmentBit['INTERNAL_RIGHT'] = 512)] = 'INTERNAL_RIGHT';
  SegmentBit[(SegmentBit['INTERNAL_BOTTOM'] = 1024)] = 'INTERNAL_BOTTOM';
  SegmentBit[(SegmentBit['INTERNAL_LEFT'] = 2048)] = 'INTERNAL_LEFT';
})(SegmentBit || (exports.SegmentBit = SegmentBit = {}));
/**
 * Two-stage lookup manager for cage border rendering
 * Stage 1: 8-neighbor pattern → segment pattern ID (256 → 47)
 * Stage 2: segment pattern ID → SVG path data (47 unique patterns)
 */
class CageLookupManager {
  constructor() {
    // Stage 1: Neighbor pattern (8-bit) to segment pattern ID mapping
    this._neighborToSegmentLookup = new Array(256);
    // Stage 2: Segment pattern ID to SVG path data mapping
    this._segmentPatterns = [];
    // Reverse lookup for debugging: segment mask to pattern ID
    this._segmentMaskToId = new Map();
    this._generateLookupTables();
  }
  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!CageLookupManager._instance) {
      CageLookupManager._instance = new CageLookupManager();
    }
    return CageLookupManager._instance;
  }
  /**
   * Convert neighbor analysis to 8-bit pattern
   */
  neighborsToPattern(neighbors) {
    // should be bitwise or but that makes eslint cranky
    return (
      (neighbors.north ? 1 : 0) +
      (neighbors.northEast ? 2 : 0) +
      (neighbors.east ? 4 : 0) +
      (neighbors.southEast ? 8 : 0) +
      (neighbors.south ? 16 : 0) +
      (neighbors.southWest ? 32 : 0) +
      (neighbors.west ? 64 : 0) +
      (neighbors.northWest ? 128 : 0)
    );
  }
  /**
   * Get SVG path data for a given neighbor pattern
   */
  getPatternSVG(neighborPattern) {
    if (neighborPattern < 0 || neighborPattern >= 256) {
      throw new Error(`Invalid neighbor pattern: ${neighborPattern}`);
    }
    const segmentPatternId = this._neighborToSegmentLookup[neighborPattern];
    return this._segmentPatterns[segmentPatternId];
  }
  /**
   * Get segment pattern ID for debugging
   */
  getSegmentPatternId(neighborPattern) {
    return this._neighborToSegmentLookup[neighborPattern];
  }
  /**
   * Get total number of unique segment patterns
   */
  get uniquePatternCount() {
    return this._segmentPatterns.length;
  }
  /**
   * Generate both lookup tables
   */
  _generateLookupTables() {
    // First pass: generate all unique segment masks and assign IDs
    const uniqueSegmentMasks = new Set();
    for (let neighborPattern = 0; neighborPattern < 256; neighborPattern++) {
      const segmentMask = this._calculateSegmentMask(neighborPattern);
      uniqueSegmentMasks.add(segmentMask);
    }
    // Convert to sorted array for consistent ordering
    const sortedSegmentMasks = Array.from(uniqueSegmentMasks).sort((a, b) => a - b);
    // Generate SVG patterns for each unique segment mask
    for (let i = 0; i < sortedSegmentMasks.length; i++) {
      const segmentMask = sortedSegmentMasks[i];
      this._segmentMaskToId.set(segmentMask, i);
      this._segmentPatterns[i] = this._generateSVGPattern(segmentMask);
    }
    // Second pass: populate neighbor-to-segment lookup
    for (let neighborPattern = 0; neighborPattern < 256; neighborPattern++) {
      const segmentMask = this._calculateSegmentMask(neighborPattern);
      const segmentPatternId = this._segmentMaskToId.get(segmentMask);
      this._neighborToSegmentLookup[neighborPattern] = segmentPatternId;
    }
  }
  /**
   * Calculate segment mask from 8-bit neighbor pattern
   */
  _calculateSegmentMask(neighborPattern) {
    // Extract individual neighbor bits
    // eslint-disable-next-line no-bitwise
    const n = Boolean(neighborPattern & 1); // North
    // eslint-disable-next-line no-bitwise
    const ne = Boolean(neighborPattern & 2); // NorthEast
    // eslint-disable-next-line no-bitwise
    const e = Boolean(neighborPattern & 4); // East
    // eslint-disable-next-line no-bitwise
    const se = Boolean(neighborPattern & 8); // SouthEast
    // eslint-disable-next-line no-bitwise
    const s = Boolean(neighborPattern & 16); // South
    // eslint-disable-next-line no-bitwise
    const sw = Boolean(neighborPattern & 32); // SouthWest
    // eslint-disable-next-line no-bitwise
    const w = Boolean(neighborPattern & 64); // West
    // eslint-disable-next-line no-bitwise
    const nw = Boolean(neighborPattern & 128); // NorthWest
    let segmentMask = 0;
    // Edges: Draw when corresponding cardinal neighbor is NOT present
    // eslint-disable-next-line no-bitwise
    if (!n) segmentMask |= SegmentBit.EDGE_TOP;
    // eslint-disable-next-line no-bitwise
    if (!e) segmentMask |= SegmentBit.EDGE_RIGHT;
    // eslint-disable-next-line no-bitwise
    if (!s) segmentMask |= SegmentBit.EDGE_BOTTOM;
    // eslint-disable-next-line no-bitwise
    if (!w) segmentMask |= SegmentBit.EDGE_LEFT;
    // Internal segments: Draw when corresponding cardinal neighbor IS present
    // eslint-disable-next-line no-bitwise
    if (n) segmentMask |= SegmentBit.INTERNAL_TOP;
    // eslint-disable-next-line no-bitwise
    if (e) segmentMask |= SegmentBit.INTERNAL_RIGHT;
    // eslint-disable-next-line no-bitwise
    if (s) segmentMask |= SegmentBit.INTERNAL_BOTTOM;
    // eslint-disable-next-line no-bitwise
    if (w) segmentMask |= SegmentBit.INTERNAL_LEFT;
    // Corner connectors: Draw when diagonal is missing but both adjacent cardinals are present
    // eslint-disable-next-line no-bitwise
    if (!ne && n && e) segmentMask |= SegmentBit.CORNER_TOP_RIGHT;
    // eslint-disable-next-line no-bitwise
    if (!se && s && e) segmentMask |= SegmentBit.CORNER_BOTTOM_RIGHT;
    // eslint-disable-next-line no-bitwise
    if (!sw && s && w) segmentMask |= SegmentBit.CORNER_BOTTOM_LEFT;
    // eslint-disable-next-line no-bitwise
    if (!nw && n && w) segmentMask |= SegmentBit.CORNER_TOP_LEFT;
    return segmentMask;
  }
  /**
   * Generate SVG path data for a segment mask
   */
  _generateSVGPattern(segmentMask) {
    const paths = [];
    const inset = 0.1; // Standard inset for cage boundaries
    const edgeExtension = 0.0; // Extend to cell edge for connections
    // Determine which segments have internal connections (need to extend to edge)
    // eslint-disable-next-line no-bitwise
    const hasInternalTop = Boolean(segmentMask & SegmentBit.INTERNAL_TOP);
    // eslint-disable-next-line no-bitwise
    const hasInternalRight = Boolean(segmentMask & SegmentBit.INTERNAL_RIGHT);
    // eslint-disable-next-line no-bitwise
    const hasInternalBottom = Boolean(segmentMask & SegmentBit.INTERNAL_BOTTOM);
    // eslint-disable-next-line no-bitwise
    const hasInternalLeft = Boolean(segmentMask & SegmentBit.INTERNAL_LEFT);
    // Edge segments - draw main segment with standard inset, then extensions to edge where needed
    // eslint-disable-next-line no-bitwise
    if (segmentMask & SegmentBit.EDGE_TOP) {
      // Main horizontal segment
      paths.push(`M${inset},${inset} L${1 - inset},${inset}`);
      // Extensions to cell edges where there are internal connections
      if (hasInternalLeft) {
        paths.push(`M${edgeExtension},${inset} L${inset},${inset}`);
      }
      if (hasInternalRight) {
        paths.push(`M${1 - inset},${inset} L${1 - edgeExtension},${inset}`);
      }
    }
    // eslint-disable-next-line no-bitwise
    if (segmentMask & SegmentBit.EDGE_RIGHT) {
      // Main vertical segment
      paths.push(`M${1 - inset},${inset} L${1 - inset},${1 - inset}`);
      // Extensions to cell edges where there are internal connections
      if (hasInternalTop) {
        paths.push(`M${1 - inset},${edgeExtension} L${1 - inset},${inset}`);
      }
      if (hasInternalBottom) {
        paths.push(`M${1 - inset},${1 - inset} L${1 - inset},${1 - edgeExtension}`);
      }
    }
    // eslint-disable-next-line no-bitwise
    if (segmentMask & SegmentBit.EDGE_BOTTOM) {
      // Main horizontal segment
      paths.push(`M${1 - inset},${1 - inset} L${inset},${1 - inset}`);
      // Extensions to cell edges where there are internal connections
      if (hasInternalRight) {
        paths.push(`M${1 - edgeExtension},${1 - inset} L${1 - inset},${1 - inset}`);
      }
      if (hasInternalLeft) {
        paths.push(`M${inset},${1 - inset} L${edgeExtension},${1 - inset}`);
      }
    }
    // eslint-disable-next-line no-bitwise
    if (segmentMask & SegmentBit.EDGE_LEFT) {
      // Main vertical segment
      paths.push(`M${inset},${1 - inset} L${inset},${inset}`);
      // Extensions to cell edges where there are internal connections
      if (hasInternalBottom) {
        paths.push(`M${inset},${1 - edgeExtension} L${inset},${1 - inset}`);
      }
      if (hasInternalTop) {
        paths.push(`M${inset},${inset} L${inset},${edgeExtension}`);
      }
    }
    // Corner connectors - extend outward from cage corners
    const cornerRadius = 0.08;
    // eslint-disable-next-line no-bitwise
    if (segmentMask & SegmentBit.CORNER_TOP_RIGHT) {
      // Extend outward from top-right corner
      paths.push(
        `M${1 - inset},${inset} L${1 - inset + cornerRadius},${inset} M${1 - inset},${inset} L${1 - inset},${
          inset - cornerRadius
        }`
      );
    }
    // eslint-disable-next-line no-bitwise
    if (segmentMask & SegmentBit.CORNER_BOTTOM_RIGHT) {
      // Extend outward from bottom-right corner
      paths.push(
        `M${1 - inset},${1 - inset} L${1 - inset + cornerRadius},${1 - inset} M${1 - inset},${1 - inset} L${
          1 - inset
        },${1 - inset + cornerRadius}`
      );
    }
    // eslint-disable-next-line no-bitwise
    if (segmentMask & SegmentBit.CORNER_BOTTOM_LEFT) {
      // Extend outward from bottom-left corner
      paths.push(
        `M${inset},${1 - inset} L${inset - cornerRadius},${1 - inset} M${inset},${1 - inset} L${inset},${
          1 - inset + cornerRadius
        }`
      );
    }
    // eslint-disable-next-line no-bitwise
    if (segmentMask & SegmentBit.CORNER_TOP_LEFT) {
      // Extend outward from top-left corner
      paths.push(
        `M${inset},${inset} L${inset - cornerRadius},${inset} M${inset},${inset} L${inset},${
          inset - cornerRadius
        }`
      );
    }
    return paths.join(' ');
  }
}
exports.CageLookupManager = CageLookupManager;
//# sourceMappingURL=CageLookupManager.js.map
