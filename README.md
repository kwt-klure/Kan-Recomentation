# Kan-Recomentation

`Kan-Recomentation` is a Poi plugin that helps answer a practical account question:

> Which ships in this roster are worth leveling next, and why?

This MVP reads a ship CSV exported from `KC Inventory Export`, evaluates your current roster against a curated remodel knowledge base, and returns a short recommendation list that is more useful than "closest remodel level only".

The recommendation data is now built from a fixed snapshot pipeline:

- external-style remodel facts are prepared as normalized source files
- local editorial rules stay inspectable in-repo
- build-time merge produces a deterministic snapshot consumed by the plugin
- plugin runtime does not fetch wiki or web data directly

## What It Helps With

The plugin highlights:

- cheap short-term remodel wins
- high-value long-term investments
- targets blocked by your current material preference settings

Each recommendation card includes:

- ship name
- current level
- target remodel
- target level
- level gap
- blocker status
- one-sentence primary reason
- recommendation bucket

Current buckets:

- `ready_now`
- `near_term`
- `worth_investing`
- `blocked`

## Current MVP Flow

1. Export a ship CSV from `KC Inventory Export`
2. Open `Kan-Recomentation` inside Poi
3. Import the CSV
4. Toggle whether you accept:
   - blueprint cost
   - catapult cost
   - action report cost
   - other rare material cost
5. Read the grouped recommendation cards

## MVP Boundaries

This plugin is intentionally narrow.

It does:

- parse a real inventory export CSV
- evaluate ships as individual roster instances
- use deterministic recommendation logic
- separate covered vs uncovered ships in the roster summary

It does not:

- read Poi store directly as its primary MVP input
- solve full long-term remodel order optimization
- parse free-text preferences
- use an LLM
- cover every ship with full handcrafted utility detail yet

## Knowledge Strategy

The current MVP parses the full CSV roster, but only recommends ships that are covered by the curated remodel knowledge base.

That tradeoff is intentional:

- parser coverage should be broad
- recommendation quality should stay inspectable
- missing coverage should fail quietly into "uncovered", not into bad heuristic spam

## Knowledge Snapshot Workflow

Knowledge updates are split into source layers:

- factual remodel data lives under `data/recommendation/sources`
- editorial scoring and reason text live in a separate source layer
- `npm run knowledge:build` merges those inputs into `src/recommendation/generated/knowledgeSnapshot.ts`
- `npm run knowledge:check` verifies the committed snapshot is in sync

This keeps future wiki/web updates on the build side instead of in the Poi runtime path.

## Development

```bash
npm install
npm run knowledge:build
npm run typeCheck
npm test -- --runInBand
```

## Local Packaging

```bash
npm pack --pack-destination dist --cache "$TMPDIR/kan-recomentation-pack-cache"
```
