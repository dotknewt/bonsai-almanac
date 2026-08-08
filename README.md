# Bonsai Almanac

An Obsidian community plugin that ports [dotknewt/bonsai](https://github.com/dotknewt/bonsai)'s
"on the bench" care-window tracking into your vault. Species care schedules
live as plain Markdown notes — frontmatter plus one `## Heading` per care
task — so you can read and edit them like any other note, including in
Obsidian itself.

## What it does

- Reads species notes from a folder you choose (**Settings → Bonsai
  Almanac → Species folder**).
- Shows an **Almanac** view (ribbon icon or the **Open almanac** command):
  - **On the bench** — every upcoming care window across your species,
    grouped into *Open now*, *Coming up* and *Completed*.
  - A per-species **care plan** with check-offs, persisted in the plugin's
    data file (not written back to your notes).
- Automatically refreshes when species notes are created, edited, renamed,
  or deleted.

## Species note format

Each species is one Markdown note. Frontmatter carries the species'
identity; each `## Heading` is a care task.

```md
---
id: juniper-juniperus-procumbens
order: 1
name: Juniper
botanicalName: Juniperus procumbens
---

Optional free-text notes on sourcing/provenance for the care data below.

## Spring health check
- id: j1
- category: other
- start: 04-20
- end: 05-10

Junipers wake late, and a dead one can hold normal foliage colour for weeks
after the roots have died...
```

- **Frontmatter:** `id` (stable — completion check-offs key on it), `order`
  (display order), `name`, `botanicalName`.
- **Task sections:** `title` is the heading text, followed by `- key: value`
  metadata lines (`id`, `category`, `start`/`end` as `MM-DD`), then a blank
  line and the task's free-text description.
- `category` is one of `repot`, `feed`, `prune`, `wire`, `propagate`, `seed`,
  `pest`, or anything else (treated as `other`).
- `end` may be omitted — it defaults to the category's typical span (~3
  weeks for repotting, ~1 month for pruning, ~2 months for wiring, ~3 months
  for feeding/pest watch), same as the original bonsai app.

See `examples/species/` for two ready-to-copy sample notes (Juniper, Japanese
Maple) — drop them into your configured species folder to try the plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v18 (`node --version`).
- `npm i` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault
  `VaultFolder/.obsidian/plugins/bonsai-almanac/`.
- Reload Obsidian and enable **Bonsai Almanac** under **Settings →
  Community plugins**.
- Set your species folder in the plugin's settings tab, then add species
  notes (see the format above, or copy the examples in `examples/species/`).

## Improve code quality with eslint

- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code.
- This project already has eslint preconfigured, you can invoke a check by running `npm run lint`.
- Together with a custom eslint [plugin](https://github.com/obsidianmd/eslint-plugin) for Obsidian-specific code guidelines.
- A GitHub action is preconfigured to automatically lint every commit on all branches.

## Credits

Ported from the [dotknewt/bonsai](https://github.com/dotknewt/bonsai) PWA,
including its Markdown+frontmatter species format
([PR #29](https://github.com/dotknewt/bonsai/pull/29)).

## API Documentation

See https://docs.obsidian.md
