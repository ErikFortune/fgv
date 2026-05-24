/**
 * Unit tests for the testbed CLI (`runTestbedCli`).
 *
 * Uses injected streams and scenario stubs to drive every branch of the CLI
 * without touching the real scenario registry, the file system, or any model.
 *
 * @packageDocumentation
 */

import '@fgv/ts-utils-jest';
import { fail, succeed } from '@fgv/ts-utils';

import { runTestbedCli } from '../../cli';
import type { IScenario, IScenarioContext } from '../../shell';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStreams(): {
  stdout: { write: jest.Mock<unknown, [string]>; output: string[] };
  stderr: { write: jest.Mock<unknown, [string]>; output: string[] };
} {
  const stdoutOutput: string[] = [];
  const stderrOutput: string[] = [];
  return {
    stdout: {
      output: stdoutOutput,
      write: jest.fn((chunk: string) => {
        stdoutOutput.push(chunk);
        return true;
      })
    },
    stderr: {
      output: stderrOutput,
      write: jest.fn((chunk: string) => {
        stderrOutput.push(chunk);
        return true;
      })
    }
  };
}

/**
 * Build a minimal scenario with a CLI impl whose `run` returns the supplied `Result`.
 */
function makeCliScenario(id: string, title: string, runResult: 'succeed' | 'fail' = 'succeed'): IScenario {
  return {
    id,
    title,
    description: `${title} description`,
    category: 'general',
    tags: ['test'],
    cli: {
      run: async (context: IScenarioContext) => {
        context.logger.info(`running ${id}`);
        if (runResult === 'fail') {
          return fail(`${id} run failed`);
        }
        return succeed(`${id} summary`);
      }
    }
  };
}

/** A scenario with only a web impl (no CLI impl). */
const WEB_ONLY_SCENARIO: IScenario = {
  id: 'web-only',
  title: 'Web Only',
  description: 'desc',
  category: 'general',
  tags: ['test'],
  web: {
    component: () => null as unknown as React.ReactElement
  }
};

// We need React type for the web-only scenario component type above.
import type React from 'react';

// ---------------------------------------------------------------------------
// --help / -h
// ---------------------------------------------------------------------------

describe('runTestbedCli --help', () => {
  test('prints usage and exits 0 with --help', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed', '--help'], streams);
    expect(code).toBe(0);
    const out = streams.stdout.output.join('');
    expect(out).toMatch(/--scenario/);
    expect(out).toMatch(/--help/);
    expect(streams.stderr.output).toHaveLength(0);
  });

  test('prints usage and exits 0 with -h', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed', '-h'], streams);
    expect(code).toBe(0);
    expect(streams.stdout.output.join('')).toMatch(/--scenario/);
  });

  test('help includes the scenario list', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed', '--help'], streams, {
      scenarios: [makeCliScenario('my-scenario', 'My Scenario')]
    });
    expect(code).toBe(0);
    expect(streams.stdout.output.join('')).toContain('my-scenario');
  });

  test('help with empty registry shows the empty scenario placeholder', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed', '--help'], streams, { scenarios: [] });
    expect(code).toBe(0);
    expect(streams.stdout.output.join('')).toMatch(/no scenarios registered/i);
  });
});

// ---------------------------------------------------------------------------
// Bare invocation (no --scenario flag)
// ---------------------------------------------------------------------------

describe('runTestbedCli (bare invocation)', () => {
  test('lists available scenarios and exits 0 when registry is populated', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed'], streams, {
      scenarios: [makeCliScenario('demo', 'Demo'), makeCliScenario('demo2', 'Demo 2')]
    });
    expect(code).toBe(0);
    const out = streams.stdout.output.join('');
    expect(out).toMatch(/2 scenario\(s\) available/i);
    expect(out).toContain('demo');
    expect(out).toContain('demo2');
    expect(out).toMatch(/--scenario/);
  });

  test('prints empty-registry message and exits 0 when no scenarios registered', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed'], streams, { scenarios: [] });
    expect(code).toBe(0);
    expect(streams.stdout.output.join('')).toMatch(/no scenarios registered yet/i);
  });

  test('bare invocation with real registry has scenarios', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed'], streams);
    expect(code).toBe(0);
    // Real registry has at least the two B-3/B-4a scenarios
    expect(streams.stdout.output.join('')).toMatch(/scenario\(s\) available/i);
  });
});

// ---------------------------------------------------------------------------
// --scenario <id> dispatch
// ---------------------------------------------------------------------------

describe('runTestbedCli --scenario', () => {
  test('runs the scenario and prints its summary on success', async () => {
    const streams = makeStreams();
    const scenario = makeCliScenario('my-id', 'My Scenario');
    const code = await runTestbedCli(['node', 'testbed', '--scenario', 'my-id'], streams, {
      scenarios: [scenario]
    });
    expect(code).toBe(0);
    expect(streams.stdout.output.join('')).toContain('my-id summary');
    expect(streams.stderr.output).toHaveLength(0);
  });

  test('exits 1 and writes to stderr when scenario run returns failure', async () => {
    const streams = makeStreams();
    const scenario = makeCliScenario('bad-id', 'Bad', 'fail');
    const code = await runTestbedCli(['node', 'testbed', '--scenario', 'bad-id'], streams, {
      scenarios: [scenario]
    });
    expect(code).toBe(1);
    expect(streams.stderr.output.join('')).toContain('bad-id run failed');
  });

  test('exits 1 when the scenario id is unknown and lists available scenarios', async () => {
    const streams = makeStreams();
    const scenario = makeCliScenario('known', 'Known');
    const code = await runTestbedCli(['node', 'testbed', '--scenario', 'unknown-id'], streams, {
      scenarios: [scenario]
    });
    expect(code).toBe(1);
    const err = streams.stderr.output.join('');
    expect(err).toContain('unknown-id');
    expect(err).toContain('known');
  });

  test('exits 1 when the scenario has no CLI impl (web-only)', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed', '--scenario', 'web-only'], streams, {
      scenarios: [WEB_ONLY_SCENARIO]
    });
    expect(code).toBe(1);
    expect(streams.stderr.output.join('')).toContain('web-only');
    expect(streams.stderr.output.join('')).toMatch(/no CLI implementation/i);
  });

  test('exits 1 when --scenario is given without an id argument', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed', '--scenario'], streams, {
      scenarios: [makeCliScenario('x', 'X')]
    });
    expect(code).toBe(1);
    expect(streams.stderr.output.join('')).toMatch(/requires an id/i);
  });

  test('exits 1 when --scenario is followed by another flag starting with - (no id)', async () => {
    const streams = makeStreams();
    // Use a flag that is NOT --help/-h so the help check doesn't intercept
    const code = await runTestbedCli(['node', 'testbed', '--scenario', '--unknown-flag'], streams, {
      scenarios: [makeCliScenario('x', 'X')]
    });
    expect(code).toBe(1);
    expect(streams.stderr.output.join('')).toMatch(/requires an id/i);
  });

  test('scenario context resolveSecret is callable (returns B-1 stub failure)', async () => {
    // This exercises the resolveSecret callback created inside buildCliContext.
    const streams = makeStreams();
    let capturedResolveResult: unknown;
    const scenario: IScenario = {
      id: 'resolve-secret-test',
      title: 'Resolve Secret Test',
      description: 'desc',
      category: 'general',
      tags: [],
      cli: {
        run: async (context: IScenarioContext) => {
          capturedResolveResult = await context.resolveSecret({
            id: 'test-key',
            envVarName: 'TEST_KEY_ENV',
            description: 'A test secret'
          });
          return succeed('done');
        }
      }
    };
    const code = await runTestbedCli(['node', 'testbed', '--scenario', 'resolve-secret-test'], streams, {
      scenarios: [scenario]
    });
    expect(code).toBe(0);
    // resolveSecret is a B-1 stub that always returns fail; just confirm it was called
    expect(capturedResolveResult).toBeDefined();
  });

  test('scenario list includes surface labels [cli] / [web, cli] etc.', async () => {
    const streams = makeStreams();
    /** A scenario with no web or cli impl (metadata-only; no surface label). */
    const noImplScenario: IScenario = {
      id: 'no-impl',
      title: 'No Impl',
      description: 'desc',
      category: 'general',
      tags: []
    };
    const scenarios: readonly IScenario[] = [
      makeCliScenario('cli-only', 'CLI Only'),
      WEB_ONLY_SCENARIO,
      { ...makeCliScenario('both', 'Both'), web: WEB_ONLY_SCENARIO.web },
      noImplScenario
    ];
    await runTestbedCli(['node', 'testbed'], streams, { scenarios });
    const out = streams.stdout.output.join('');
    expect(out).toContain('[cli]');
    expect(out).toContain('[web]');
    expect(out).toContain('[web, cli]');
    // no-impl scenario has no surface label brackets
    expect(out).toContain('no-impl');
  });
});
