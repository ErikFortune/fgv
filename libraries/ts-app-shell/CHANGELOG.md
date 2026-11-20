# Change Log - @fgv/ts-app-shell

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: React UI primitives for application shells, styled with Tailwind — add the package to your Tailwind `content` paths and import `@fgv/ts-app-shell/theme.css` (see the README).
- Layout: top bar, compact sidebar with filter rows and flyout selectors, master-detail column cascade, modal and confirm dialogs, drop zone and responsive helpers.
- Messages: toasts and a collapsible log panel filtered by `@fgv/ts-utils` log level, with `MessagesLogger` / `useLogReporter` bridging an `ILogger` into the panel.
- A keyboard-shortcut registry (`KeyboardShortcutRegistry`, `useKeyboardShortcuts`), plus a default light/dark theme of CSS-variable tokens with a Tailwind preset.

