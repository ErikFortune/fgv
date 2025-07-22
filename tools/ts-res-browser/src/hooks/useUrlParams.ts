/*
 * Copyright (c) 2025 Erik Fortune
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

import { useEffect, useState } from 'react';
import { parseUrlParameters, IUrlConfigOptions } from '../utils/urlParams';

/**
 * Hook to parse and provide URL parameters for initial app configuration
 */
export function useUrlParams() {
  const [urlParams, setUrlParams] = useState<IUrlConfigOptions>({});
  const [hasUrlParams, setHasUrlParams] = useState(false);

  useEffect(() => {
    const params = parseUrlParameters();
    setUrlParams(params);

    // Check if any meaningful parameters were provided
    const hasParams = !!(
      params.input ||
      params.config ||
      params.contextFilter ||
      params.qualifierDefaults ||
      params.resourceTypes ||
      params.maxDistance !== undefined ||
      params.reduceQualifiers ||
      params.interactive
    );

    setHasUrlParams(hasParams);
  }, []);

  return {
    urlParams,
    hasUrlParams
  };
}
