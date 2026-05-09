# @fgv/ks

Command-line tool for creating, managing, and exporting ts-extras keystores.

## Features

- Create a keystore at `~/.fgv-ks` by default
- Change the keystore password
- Add, list, read, and remove secrets without putting them on the command line
- Export secrets through a template rendered to a POSIX shell snippet
- Prompt interactively for missing secrets and optionally persist them
- Copy rendered output to the clipboard

## Usage

```bash
ks --help
```

### Self-contained help topics

```bash
ks help
ks help commands
ks help password
ks help template
```

### Initialize a keystore

```bash
ks init
```

### Put a secret from stdin or a file

```bash
printf '%s' "$XAI_API_KEY" | ks put xai --stdin
ks put xai --file ./xai.txt
```

### Export secrets into shell variables

```bash
eval "$(ks export --template-file ./keystore.template.sh)"
```

### Start a shell session with the keystore password

```bash
eval "$(ks session --var FGV_KS_PASSWORD)"
```

### Copy rendered output to the clipboard

```bash
ks export --template-string 'export XAI_API_KEY={{xai}}' --clipboard
```
