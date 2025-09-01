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

import { Config } from '@fgv/ts-res';
import { TsResSystem } from './tsResIntegration';

/**
 * Type guard to determine if an object is a TsResSystem.
 * A TsResSystem has qualifierTypes and resourceManager properties.
 */
export function isTsResSystem(obj: unknown): obj is TsResSystem {
  return obj != null && typeof obj === 'object' && 'qualifierTypes' in obj && 'resourceManager' in obj;
}

/**
 * Type guard to determine if an object is a SystemConfiguration.
 * A SystemConfiguration is an object that is not a TsResSystem.
 */
export function isSystemConfiguration(obj: unknown): obj is Config.Model.ISystemConfiguration {
  return obj != null && typeof obj === 'object' && !isTsResSystem(obj);
}

/**
 * Helper to extract a SystemConfiguration from a union type parameter.
 * Returns the configuration if the input is a SystemConfiguration, undefined otherwise.
 */
export function extractSystemConfiguration(
  systemConfigOrSystem: Config.Model.ISystemConfiguration | TsResSystem | undefined
): Config.Model.ISystemConfiguration | undefined {
  return systemConfigOrSystem && isSystemConfiguration(systemConfigOrSystem)
    ? systemConfigOrSystem
    : undefined;
}
