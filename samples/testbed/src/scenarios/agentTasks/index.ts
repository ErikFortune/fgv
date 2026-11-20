/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * `agentTasks` scenario (CLI-only): the credential-free `@fgv/ts-agent-tasks` journey.
 *
 * The journey lives in the testable {@link runAgentTasksJourney} core; this file only runs it and
 * prints its report. No credentials, network, downloads, model weights, sleeps or wall-clock
 * ordering: the clock and IDs are injected, the FileTree is in memory, the external executors
 * advance only when the journey moves them, and the one outbound request is captured in-process.
 *
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import type { ICliScenarioImpl, IScenario, IScenarioContext } from '../../shell';
import { IJourneyReport, formatReport } from './report';
import { runAgentTasksJourney } from './journey';

/** Runs the journey and renders its report; any failed check fails the run. */
export async function runAgentTasksScenario(
  context: IScenarioContext,
  journey: () => Promise<Result<IJourneyReport>> = () => runAgentTasksJourney()
): Promise<Result<string>> {
  return (await journey()).onSuccess((report) => {
    const lines: string[] = formatReport(report);
    for (const line of lines) {
      context.logger.info(line);
    }
    const summary: string = lines[lines.length - 1];
    return report.passed ? succeed(summary) : fail(summary);
  });
}

const cliImpl: ICliScenarioImpl = {
  run: (context: IScenarioContext) => runAgentTasksScenario(context)
};

/**
 * The agent-tasks proving ground.
 * @public
 */
export const agentTasksScenario: IScenario = {
  id: 'agent-tasks',
  title: 'Agent tasks: the credential-free journey',
  description:
    'Drives @fgv/ts-agent-tasks end to end through its exports — tracked and external work, subscriptions and ' +
    'exact receipts, typed command tools, reassignment, due queries, cascade stops, recovery and a checked ' +
    'final prompt — with an injected clock, an in-memory store and a simulated executor. No credentials.',
  category: 'general',
  tags: ['ts-agent-tasks', 'agents', 'tasks', 'credential-free'],
  cli: cliImpl
};
