---
name: phosphor-icons
description: Retrieve, search, export, and implement Phosphor Icons with the phosphor-icons CLI. Use when a user needs icon SVG/PNG assets, icon search help, framework implementation snippets, or consistent iconography choices.
---

# Phosphor Icons

Use this skill when working with Phosphor Icons in code, design systems, docs, or generated assets.

## CLI Workflow

Run the bundled `phosphor-icons` CLI (install the npm package or build from source):

```bash
phosphor-icons icon heart --weight bold --color "#ef4444" --size 32 --out heart.svg
phosphor-icons icon house user gear --format png --size 24 --dir ./icons
phosphor-icons search arrow --limit 5
phosphor-icons categories
phosphor-icons skill path
```

Commands:

- `icon <name...>` — export one or more icons as SVG or PNG
- `search <query>` — search icon names and bundled metadata
- `categories` — list bundled categories with examples
- `skill path` — print the bundled skill directory

Common flags for `icon`:

- `--weight, -w` — `thin`, `light`, `regular`, `bold`, `fill`, `duotone`
- `--color, -c` — hex, rgb, named colors, or `currentColor`
- `--size, -s` — pixel width and height
- `--format, -f` — `svg` or `png`
- `--out, -o` — output file (single icon)
- `--dir, -d` — output directory (batch)

## Selection Rules

- Icon names use kebab-case, for example `magnifying-glass`, `arrow-left`, `user-circle`.
- Default weight is `regular`.
- Use `light` or `regular` for normal UI.
- Use `bold` for small icons, selected states, or emphasis.
- Use `fill` for strong status icons and dense visual systems.
- Use `duotone` only when two-tone styling helps the visual language.
- Use `currentColor` for UI components so icons inherit text color.
- Export fixed assets with `--format png --size <px>` only when raster files are explicitly needed.

## Implementation Notes

- React package component names are PascalCase from kebab-case names, for example `magnifying-glass` becomes `MagnifyingGlass`.
- Inline SVG is best for one-off icons or when no framework package exists.
- Keep sizing consistent inside one surface: common sizes are 16, 20, 24, 32, 48.
- Batch export with `icon name1 name2 name3 --dir ./icons` for icon sets.

## Common Examples

```bash
phosphor-icons icon check --weight fill --color "#10b981" --size 24 --out check.svg
phosphor-icons icon warning --weight fill --color "#f59e0b" --size 24 --out warning.svg
phosphor-icons icon x --weight bold --color currentColor --size 20 --out close.svg
```

```tsx
import { MagnifyingGlass } from "@phosphor-icons/react";

export function SearchIcon() {
  return <MagnifyingGlass size={20} weight="regular" />;
}
```
