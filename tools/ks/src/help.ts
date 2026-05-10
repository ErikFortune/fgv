import { Command } from 'commander';

import { fail, Result, succeed } from '@fgv/ts-utils';

export type HelpTopic = 'overview' | 'commands' | 'password' | 'template';

const AVAILABLE_HELP_TOPICS: readonly HelpTopic[] = ['overview', 'commands', 'password', 'template'];

const HELP_OVERVIEW: string = `ks manages ts-extras keystore files.

Start here:
  ks help overview
  ks help commands
  ks help password
  ks help template

Default keystore:
  ~/.fgv-ks

Common commands:
  ks init
  ks put <name>
  ks get <name>
  ks list
  ks remove <name>
  ks export
  ks session`;

const HELP_COMMANDS: string = `ks commands

  ks init            Create a new keystore
  ks password        Change the keystore password
  ks put <name>      Store a secret in the keystore
  ks get <name>      Read a secret from the keystore
  ks list            List stored secrets
  ks remove <name>   Remove a stored secret
  ks export          Render a shell template from keystore secrets
  ks session         Emit a shell export statement for the password
  ks help [topic]    Show self-contained help on a specific topic`;

const HELP_PASSWORD: string = `ks password sources

Passwords may be supplied with:
  --password-file <path>
  --password-stdin
  --password-env <name>
  FGV_KS_PASSWORD
  KS_PASSWORD

If no password source is provided, ks prompts interactively.
The session command can emit a shell export statement:
  ks session --var FGV_KS_PASSWORD`;

const HELP_TEMPLATE: string = `ks export template format

Templates use simple Mustache-style variables such as {{xai}}.
Only simple variables are supported; sections and other advanced Mustache features are rejected.

Options:
  --template-file <path>    Read the shell template from a file
  --template-string <text>  Use an inline shell template string
  --persist-missing         Save prompted secrets back to the keystore
  --clipboard               Copy the rendered output to the clipboard

Missing secrets referenced by the template are prompted interactively.
Rendered values are shell-quoted before output.

Example:
  ks export --template-file ./keystore.template.sh
  ks export --template-string 'export XAI_API_KEY={{xai}}'`;

const HELP_TEXTS: Readonly<Record<HelpTopic, string>> = {
  commands: HELP_COMMANDS,
  overview: HELP_OVERVIEW,
  password: HELP_PASSWORD,
  template: HELP_TEMPLATE
};

function normalizeHelpTopic(topic: string): string {
  return topic.trim().toLowerCase();
}

function formatAvailableTopics(): string {
  return AVAILABLE_HELP_TOPICS.join(', ');
}

export function getHelpText(topic: string | undefined = undefined, program?: Command): Result<string> {
  if (topic === undefined || topic.trim().length === 0) {
    return succeed(HELP_TEXTS.overview);
  }

  const normalized = normalizeHelpTopic(topic);

  if (program !== undefined) {
    const command = program.commands.find((candidate: Command) => candidate.name() === normalized);
    if (command !== undefined && command.name() !== 'help') {
      return succeed(command.helpInformation());
    }
  }

  switch (normalized) {
    case 'help':
    case 'overview':
      return succeed(HELP_TEXTS.overview);
    case 'commands':
    case 'command':
      return succeed(HELP_TEXTS.commands);
    case 'password':
    case 'passwords':
      return succeed(HELP_TEXTS.password);
    case 'template':
      return succeed(HELP_TEXTS.template);
    default:
      return fail(`Unknown help topic '${topic}'. Available topics: ${formatAvailableTopics()}`);
  }
}
