/**
 * Manual scenario registry. To add a scenario:
 *   1. Create `samples/testbed/src/scenarios/<id>.tsx` (or `.ts` for CLI-only).
 *   2. Import it here and append to the `scenarios` array below.
 *
 * The registry is a `readonly` array — explicit beats clever (per the brief: "dependencies
 * already mandate changes for most consumers, so one more registration is not a barrier").
 *
 * @packageDocumentation
 */

import type { IScenario } from '../shell';
import { localClassifierSafetyScenario } from './localClassifierSafety';

/**
 * All scenarios surfaced by the testbed shell (web sidebar + CLI list).
 * @public
 */
export const scenarios: readonly IScenario[] = [localClassifierSafetyScenario];
