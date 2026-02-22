// Copyright (c) 2026 Erik Fortune

import { Command } from 'commander';
import {
  addCommonFilterOptions,
  addDataSourceOptions,
  addOutputFormatOption,
  createEntityCommand
} from '../../../../commands/shared/commandBuilder';

describe('addDataSourceOptions', () => {
  let cmd: Command;

  beforeEach(() => {
    cmd = new Command();
  });

  test('adds --library option that is repeatable', () => {
    addDataSourceOptions(cmd);
    cmd.parse(['--library', 'path1', '--library', 'path2'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.library).toEqual(['path1', 'path2']);
  });

  test('adds --no-builtin option', () => {
    addDataSourceOptions(cmd);
    cmd.parse(['--no-builtin'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.builtin).toBe(false);
  });

  test('adds --key option', () => {
    addDataSourceOptions(cmd);
    cmd.parse(['--key', 'mykey'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.key).toBe('mykey');
  });

  test('adds --secret-name option', () => {
    addDataSourceOptions(cmd);
    cmd.parse(['--secret-name', 'mysecret'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.secretName).toBe('mysecret');
  });

  test('adds --secrets-file option', () => {
    addDataSourceOptions(cmd);
    cmd.parse(['--secrets-file', '/path/to/secrets.json'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.secretsFile).toBe('/path/to/secrets.json');
  });
});

describe('addOutputFormatOption', () => {
  let cmd: Command;

  beforeEach(() => {
    cmd = new Command();
  });

  test('adds --format option with default human', () => {
    addOutputFormatOption(cmd);
    cmd.parse([], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.format).toBe('human');
  });

  test('accepts json format', () => {
    addOutputFormatOption(cmd);
    cmd.parse(['--format', 'json'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.format).toBe('json');
  });

  test('accepts format via -f alias', () => {
    addOutputFormatOption(cmd);
    cmd.parse(['-f', 'json'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.format).toBe('json');
  });
});

describe('addCommonFilterOptions', () => {
  let cmd: Command;

  beforeEach(() => {
    cmd = new Command();
  });

  test('adds --tag option that is repeatable', () => {
    addCommonFilterOptions(cmd);
    cmd.parse(['--tag', 'tag1', '--tag', 'tag2'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.tag).toEqual(['tag1', 'tag2']);
  });

  test('adds --collection option', () => {
    addCommonFilterOptions(cmd);
    cmd.parse(['--collection', 'my-collection'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.collection).toBe('my-collection');
  });

  test('adds --name option', () => {
    addCommonFilterOptions(cmd);
    cmd.parse(['--name', 'my-name'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.name).toBe('my-name');
  });
});

describe('createEntityCommand', () => {
  test('creates command with list and show subcommands', () => {
    const listFactory = (): Command => new Command('list').description('List all ingredients');
    const showFactory = (): Command =>
      new Command('show').description('Show details for a specific ingredient');

    const cmd = createEntityCommand('ingredient', 'Manage ingredients', listFactory, showFactory);

    expect(cmd.name()).toBe('ingredient');
    expect(cmd.description()).toBe('Manage ingredients');

    const subcommands = cmd.commands;
    expect(subcommands).toHaveLength(2);

    const listCmd = subcommands.find((c) => c.name() === 'list');
    expect(listCmd).toBeDefined();
    expect(listCmd?.description()).toBe('List all ingredients');

    const showCmd = subcommands.find((c) => c.name() === 'show');
    expect(showCmd).toBeDefined();
    expect(showCmd?.description()).toBe('Show details for a specific ingredient');
  });

  test('parent command has data source and format options', () => {
    const listFactory = (): Command => new Command('list').action(() => {});
    const showFactory = (): Command => new Command('show').action(() => {});

    const cmd = createEntityCommand('ingredient', 'Manage ingredients', listFactory, showFactory);

    cmd.exitOverride();
    cmd.configureOutput({ writeOut: () => {}, writeErr: () => {} });

    cmd.parse(['list', '--library', 'path1', '--format', 'json'], { from: 'user' });

    const opts = cmd.opts();
    expect(opts.library).toEqual(['path1']);
    expect(opts.format).toBe('json');
  });

  test('list subcommand has filter options', () => {
    const listFactory = (): Command => {
      const cmd = new Command('list');
      addCommonFilterOptions(cmd);
      cmd.action(() => {});
      return cmd;
    };
    const showFactory = (): Command => new Command('show').action(() => {});

    const cmd = createEntityCommand('ingredient', 'Manage ingredients', listFactory, showFactory);

    const listCmd = cmd.commands.find((c) => c.name() === 'list');
    expect(listCmd).toBeDefined();

    listCmd?.exitOverride();
    listCmd?.configureOutput({ writeOut: () => {}, writeErr: () => {} });
    listCmd?.parse(['--tag', 'tag1', '--collection', 'col1', '--name', 'name1'], { from: 'user' });

    const opts = listCmd?.opts();
    expect(opts?.tag).toEqual(['tag1']);
    expect(opts?.collection).toBe('col1');
    expect(opts?.name).toBe('name1');
  });

  test('show subcommand requires id argument', () => {
    const listFactory = (): Command => new Command('list');
    const showFactory = (): Command => new Command('show').argument('<id>', 'The entity ID');

    const cmd = createEntityCommand('ingredient', 'Manage ingredients', listFactory, showFactory);

    const showCmd = cmd.commands.find((c) => c.name() === 'show');
    expect(showCmd).toBeDefined();

    const args = showCmd?.registeredArguments;
    expect(args).toHaveLength(1);
    expect(args?.[0].name()).toBe('id');
    expect(args?.[0].required).toBe(true);
  });
});
