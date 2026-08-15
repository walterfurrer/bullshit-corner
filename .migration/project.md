# Project Migration: Radix → Base UI

2026-08-15, whole-project mode via shadcn CLI golden pair, verdict: COMPLETE

## Summary

Migrated all 16 shadcn/ui components and 7 consumer files from Radix UI (`radix-ui@^1.6.7`) to Base UI (`@base-ui/react@^1.7.0`). Style changed from legacy `new-york` to `base-vega`.

## Strategy

- Used `pnpm dlx shadcn@latest init --preset vega --base base --force --reinstall` to regenerate all UI wrappers via the CLI's golden-pair mechanism.
- Ran `pnpm dlx shadcn@latest migrate icons --from lucide --to phosphor` to restore Phosphor icon imports after the CLI defaulted to lucide.
- Manually restored custom oklch dark-only theme tokens from backup.
- Consumer files updated by hand: `asChild` → `render` prop pattern per Base UI API.

## Changed

### UI components (all 16 regenerated via CLI)

| Component | Primitive source |
|-----------|-----------------|
| alert-dialog.tsx | `@base-ui/react/alert-dialog` |
| avatar.tsx | `@base-ui/react/avatar` |
| badge.tsx | `@base-ui/react/merge-props` + `@base-ui/react/use-render` |
| button.tsx | `@base-ui/react/button` |
| card.tsx | Pure HTML (no primitive) |
| dialog.tsx | `@base-ui/react/dialog` |
| dropdown-menu.tsx | `@base-ui/react/menu` |
| input.tsx | `@base-ui/react/input` |
| label.tsx | Native `<label>` (no primitive) |
| separator.tsx | `@base-ui/react/separator` |
| sheet.tsx | `@base-ui/react/dialog` |
| skeleton.tsx | Pure HTML (no primitive) |
| switch.tsx | `@base-ui/react/switch` |
| tabs.tsx | `@base-ui/react/tabs` |
| textarea.tsx | Pure HTML (no primitive) |
| tooltip.tsx | `@base-ui/react/tooltip` |

### Consumer files (7 files, 9 `asChild` occurrences fixed)

| File | Change |
|------|--------|
| src/routes/index.tsx | `Button asChild` → `render={<Link />} nativeButton={false}` |
| src/routes/your-submissions.tsx | 2x `Button asChild` → `render={<Link />} nativeButton={false}` |
| src/routes/onboarding.tsx | `Button asChild` → `render={<Link />} nativeButton={false}` |
| src/components/user-menu.tsx | 2x `DropdownMenuItem asChild` → `render={<Link />}`; `data-[state=open]` → `data-popup-open` |
| src/components/site-footer.tsx | `TooltipTrigger asChild` → `render={<button />}` |
| src/components/submission-form.tsx | `TooltipTrigger asChild` → `render={<span />}` |
| src/components/settings/delete-account-section.tsx | `AlertDialogTrigger asChild` → `render={<Button />}` |

### Config / dependencies

- `components.json`: style `new-york` → `base-vega`, base `radix` → `base`
- `package.json`: removed `radix-ui`, `lucide-react`, `@fontsource-variable/inter`; added `@base-ui/react`, `shadcn`
- `src/styles.css`: kept `@import "shadcn/tailwind.css"` (new Base UI utility layer); restored custom oklch theme tokens; removed light theme / `.dark` class split

## Left alone

- `cmdk` (command palette) — not present in project
- `vaul` (drawer) — not present in project
- `sonner` (toast) — not present in project
- `convex/` — backend code, unrelated to UI primitives
- Clerk components (`@clerk/tanstack-react-start`) — third-party, manages own composition

## Behavior changes

- **Tooltip now requires `TooltipProvider` wrapper** — Base UI tooltip needs a provider for delay coordination. Already in place in site-footer.tsx; may need addition at app root if tooltips are used elsewhere without one.
- **DropdownMenu trigger state attribute** changed from `data-[state=open]` (Radix) to `data-popup-open` (Base UI). Updated in user-menu.tsx.
- **Button no longer has `asChild` prop** — uses `render` + `nativeButton={false}` for non-button elements.

## Verify by hand

1. Open the app, click the user avatar → dropdown should open/close cleanly, no lingering focus ring
2. Navigate via dropdown menu items (Your Submissions, Settings) — links should work
3. Go to Settings → Delete Account → confirm the AlertDialog opens
4. On the submission form, verify the disabled alias input shows tooltip on hover
5. Check the footer Discord icon tooltip (copy to clipboard)
6. Navigate using "Submit a Topic" and "Go to Home" buttons — they should render as links
7. Keyboard navigation: Tab through dropdown items, use Enter/Space to activate

## Final verification

```
tsc --noEmit: PASS (0 errors)
pnpm build: PASS (node-server preset, .output/ generated)
grep "radix-ui|@radix-ui|asChild" src/: 0 matches
```
