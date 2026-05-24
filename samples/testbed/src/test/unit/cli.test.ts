import { runTestbedCli } from '../../cli';

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

describe('runTestbedCli (B-1 scaffold)', () => {
  test('prints a registry summary and exits with code 0 when scenarios are registered', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed'], streams);
    expect(code).toBe(0);
    // B-3: one scenario is registered; the banner now reports a count.
    expect(streams.stdout.output.join('')).toMatch(/scenario\(s\) registered/i);
    expect(streams.stderr.output).toHaveLength(0);
  });

  test('prints the empty-registry banner when the injected scenario list is empty', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed'], streams, { scenarios: [] });
    expect(code).toBe(0);
    expect(streams.stdout.output.join('')).toMatch(/no scenarios registered yet/i);
  });

  test('ignores its --scenario flag at B-1 (signature reserved for B-3 dispatch)', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed', '--scenario', 'whatever'], streams);
    expect(code).toBe(0);
    // B-3: scenarios are now registered; the --scenario flag is still not dispatched
    expect(streams.stdout.output.join('')).toMatch(/scenario\(s\) registered/i);
  });

  test('prints the --help banner when invoked with --help', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed', '--help'], streams);
    expect(code).toBe(0);
    expect(streams.stdout.output.join('')).toMatch(/B-1 scaffold/);
    expect(streams.stdout.output.join('')).toMatch(/--scenario/);
  });

  test('prints the --help banner when invoked with -h', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed', '-h'], streams);
    expect(code).toBe(0);
    expect(streams.stdout.output.join('')).toMatch(/B-1 scaffold/);
  });

  test('reports the registered scenario count when scenarios are injected', async () => {
    const streams = makeStreams();
    const code = await runTestbedCli(['node', 'testbed'], streams, {
      scenarios: [
        {
          id: 'demo',
          title: 'Demo',
          description: 'd',
          category: 'general',
          tags: []
        }
      ]
    });
    expect(code).toBe(0);
    expect(streams.stdout.output.join('')).toMatch(/1 scenario\(s\) registered/);
  });
});
