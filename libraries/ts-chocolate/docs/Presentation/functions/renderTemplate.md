[Home](../../README.md) > [Presentation](../README.md) > renderTemplate

# Function: renderTemplate

Renders a `{{variable}}` template string by substituting values from `params`.
Variables that are missing or empty are left as `{{variable}}` in the output.

## Signature

```typescript
function renderTemplate(template: string, params: Record<string, string>): string
```
