/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * The journey's structured report: every claim a step makes is a check with the value it
 * **observed** through the public API, beside the value the design says it should be.
 *
 * @remarks
 * The printed output is rendered from these checks, never written by hand, so no line can claim
 * more than a check observed. The scenario's tests assert the observed values themselves.
 *
 * @packageDocumentation
 */

import { Converters as JsonConverters, JsonValue } from '@fgv/ts-json-base';
import { Hash, Result, captureResult, succeed } from '@fgv/ts-utils';

/** One claim: what was observed, and what the design says it should be. */
export interface IJourneyCheck {
  readonly name: string;
  readonly observed: JsonValue;
  readonly expected: JsonValue;
  readonly passed: boolean;
}

/** One step (or branch) of the journey. */
export interface IJourneyStep {
  /** `'1'` … `'9'`, or a branch such as `'7-cancel'`. */
  readonly step: string;
  readonly title: string;
  readonly checks: ReadonlyArray<IJourneyCheck>;
}

/** The whole journey. */
export interface IJourneyReport {
  readonly steps: ReadonlyArray<IJourneyStep>;
  /** Every check of every step passed. */
  readonly passed: boolean;
}

const normalizer: Hash.Crc32Normalizer = new Hash.Crc32Normalizer();

/**
 * Exact structural equality of two JSON values, independent of key order: their RFC 8785 canonical
 * forms compared as strings — not their hashes, so no collision can pass a wrong answer.
 */
function sameValue(a: JsonValue, b: JsonValue): boolean {
  const left = normalizer.canonicalize(a);
  const right = normalizer.canonicalize(b);
  return left.isSuccess() && right.isSuccess() && left.value === right.value;
}

/** What a value with no JSON form is recorded as. A check involving one never passes. */
const notJson: string = '<not JSON>';

/**
 * A value as JSON — what the report can hold and print. Library values (readonly arrays,
 * interface-typed records) are JSON at runtime. `undefined` becomes `null`, and a property whose
 * value is `undefined` is dropped, exactly as `JSON.stringify` does; a value with no JSON form
 * (a function, a non-finite number) is recorded as {@link notJson}.
 */
function toJson(value: unknown): JsonValue {
  // Not `orDefault`: a successful `null` is a value here, and `orDefault` would replace it.
  const json: Result<JsonValue> = captureResult(
    () => JSON.parse(JSON.stringify(value ?? null)) as unknown
  ).onSuccess((parsed) => (parsed === null ? succeed(null) : JsonConverters.jsonValue.convert(parsed)));
  return json.isSuccess() ? json.value : notJson;
}

/** Collects one step's checks. */
export class StepRecorder {
  public readonly step: string;
  public readonly title: string;
  private readonly _checks: IJourneyCheck[] = [];

  public constructor(step: string, title: string) {
    this.step = step;
    this.title = title;
  }

  /** Records what was observed against what the design says it should be. */
  public check(name: string, observed: unknown, expected: unknown): void {
    const o: JsonValue = toJson(observed);
    const e: JsonValue = toJson(expected);
    const passed: boolean = o !== notJson && e !== notJson && sameValue(o, e);
    this._checks.push({ name, observed: o, expected: e, passed });
  }

  public finish(): IJourneyStep {
    return { step: this.step, title: this.title, checks: [...this._checks] };
  }
}

/** Assembles a report from finished steps. */
export function journeyReport(steps: ReadonlyArray<IJourneyStep>): IJourneyReport {
  return { steps, passed: steps.every((s) => s.checks.every((c) => c.passed)) };
}

/** Renders a report as readable lines, one per check. */
export function formatReport(report: IJourneyReport): string[] {
  const lines: string[] = [];
  for (const step of report.steps) {
    lines.push(`Step ${step.step}: ${step.title}`);
    for (const check of step.checks) {
      const mark: string = check.passed ? 'ok  ' : 'FAIL';
      const detail: string = check.passed
        ? JSON.stringify(check.observed)
        : `observed ${JSON.stringify(check.observed)}, expected ${JSON.stringify(check.expected)}`;
      lines.push(`  [${mark}] ${check.name}: ${detail}`);
    }
  }
  const failed: number = report.steps.reduce((n, s) => n + s.checks.filter((c) => !c.passed).length, 0);
  const total: number = report.steps.reduce((n, s) => n + s.checks.length, 0);
  lines.push(`agent-tasks journey: ${total - failed} of ${total} checks as designed`);
  return lines;
}
