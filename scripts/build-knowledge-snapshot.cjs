const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const manifestPath = path.join(
  repoRoot,
  'data',
  'recommendation',
  'source-manifest.json',
)
const outputPath = path.join(
  repoRoot,
  'src',
  'recommendation',
  'generated',
  'knowledgeSnapshot.ts',
)

const FACT_REQUIRED_KEYS = [
  'currentAliases',
  'targetName',
  'targetLevel',
  'rareMaterials',
]

const FACT_ALLOWED_KEYS = new Set([
  'id',
  ...FACT_REQUIRED_KEYS,
  'otherRareMaterialLabels',
])

const EDITORIAL_REQUIRED_KEYS = [
  'capabilityTags',
  'utilityTags',
  'payoffClass',
  'curatedPriority',
  'primaryReason',
]

const EDITORIAL_ALLOWED_KEYS = new Set([
  'id',
  ...EDITORIAL_REQUIRED_KEYS,
])

const UPSTREAM_ROLE_VALUES = new Set(['primary', 'fallback'])

const fail = (message) => {
  throw new Error(message)
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const ensureArray = (value, label) => {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array.`)
  }

  return value
}

const isPresent = (value) => value != null

const validateEntryKeys = (entry, allowedKeys, label) => {
  for (const key of Object.keys(entry)) {
    if (!allowedKeys.has(key)) {
      fail(`${label} contains an unsupported key: ${key}.`)
    }
  }
}

const mergePatch = (current, patch) => {
  const next = { ...(current ?? {}) }

  for (const [key, value] of Object.entries(patch)) {
    if (key === 'id' || typeof value === 'undefined') {
      continue
    }

    next[key] = Array.isArray(value) ? [...value] : value
  }

  return next
}

const ensureRequiredKeys = (entry, requiredKeys, label) => {
  for (const key of requiredKeys) {
    if (!isPresent(entry[key])) {
      fail(`${label} is missing required field ${key}.`)
    }
  }
}

const buildSnapshotModule = (snapshot) => `import type { KnowledgeSnapshot } from '../types'

export const KNOWLEDGE_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)} as unknown as KnowledgeSnapshot
`

const manifest = readJson(manifestPath)

if (typeof manifest.schemaVersion !== 'number') {
  fail('source-manifest.json must declare a numeric schemaVersion.')
}

if (typeof manifest.snapshotVersion !== 'string' || manifest.snapshotVersion.length === 0) {
  fail('source-manifest.json must declare a snapshotVersion.')
}

const preferredUpstreams = ensureArray(
  manifest.preferredUpstreams,
  'source-manifest.json:preferredUpstreams',
)
const sources = ensureArray(manifest.sources, 'source-manifest.json:sources')
const factEntries = new Map()
const editorialEntries = new Map()
const provenance = new Map()
const upstreamSummaries = preferredUpstreams
  .map((upstream) => {
    if (typeof upstream.id !== 'string' || upstream.id.length === 0) {
      fail('Every preferred upstream must declare a non-empty id.')
    }

    if (typeof upstream.displayName !== 'string' || upstream.displayName.length === 0) {
      fail(`Preferred upstream ${upstream.id} must declare a displayName.`)
    }

    if (typeof upstream.locale !== 'string' || upstream.locale.length === 0) {
      fail(`Preferred upstream ${upstream.id} must declare a locale.`)
    }

    if (typeof upstream.priority !== 'number' || upstream.priority < 1) {
      fail(`Preferred upstream ${upstream.id} must declare a positive priority.`)
    }

    if (!UPSTREAM_ROLE_VALUES.has(upstream.role)) {
      fail(`Preferred upstream ${upstream.id} has an unsupported role: ${upstream.role}.`)
    }

    return {
      id: upstream.id,
      displayName: upstream.displayName,
      locale: upstream.locale,
      priority: upstream.priority,
      role: upstream.role,
      ...(upstream.homepage ? { homepage: upstream.homepage } : {}),
      ...(upstream.referenceNote ? { referenceNote: upstream.referenceNote } : {}),
    }
  })
  .sort((left, right) => left.priority - right.priority)
const sourceSummaries = []

for (const source of sources) {
  if (typeof source.id !== 'string' || source.id.length === 0) {
    fail('Every source must declare a non-empty id.')
  }

  if (source.kind !== 'facts' && source.kind !== 'editorial') {
    fail(`Source ${source.id} has an unsupported kind: ${source.kind}.`)
  }

  if (typeof source.displayName !== 'string' || source.displayName.length === 0) {
    fail(`Source ${source.id} must declare a displayName.`)
  }

  if (typeof source.updatedOn !== 'string' || source.updatedOn.length === 0) {
    fail(`Source ${source.id} must declare an updatedOn value.`)
  }

  if (typeof source.file !== 'string' || source.file.length === 0) {
    fail(`Source ${source.id} must declare a file path.`)
  }

  const sourcePath = path.resolve(path.dirname(manifestPath), source.file)
  const sourcePayload = readJson(sourcePath)
  const entries = ensureArray(sourcePayload.entries, `${source.id}:entries`)

  sourceSummaries.push({
    id: source.id,
    kind: source.kind,
    displayName: source.displayName,
    updatedOn: source.updatedOn,
    entryCount: entries.length,
    ...(source.referenceNote ? { referenceNote: source.referenceNote } : {}),
  })

  for (const entry of entries) {
    if (typeof entry.id !== 'string' || entry.id.length === 0) {
      fail(`Source ${source.id} contains an entry without a valid id.`)
    }

    const label = `${source.id}:${entry.id}`
    const targetMap = source.kind === 'facts' ? factEntries : editorialEntries
    const allowedKeys =
      source.kind === 'facts' ? FACT_ALLOWED_KEYS : EDITORIAL_ALLOWED_KEYS

    validateEntryKeys(entry, allowedKeys, label)
    targetMap.set(entry.id, mergePatch(targetMap.get(entry.id), entry))

    if (!provenance.has(entry.id)) {
      provenance.set(entry.id, new Set())
    }
    provenance.get(entry.id).add(source.id)
  }
}

const allIds = [...new Set([...factEntries.keys(), ...editorialEntries.keys()])]

const entries = allIds
  .map((id) => {
    const facts = factEntries.get(id)
    const editorial = editorialEntries.get(id)

    if (!facts) {
      fail(`Missing facts entry for ${id}.`)
    }

    if (!editorial) {
      fail(`Missing editorial entry for ${id}.`)
    }

    ensureRequiredKeys(facts, FACT_REQUIRED_KEYS, `facts:${id}`)
    ensureRequiredKeys(editorial, EDITORIAL_REQUIRED_KEYS, `editorial:${id}`)

    return {
      id,
      sourceIds: [...provenance.get(id)].sort(),
      currentAliases: [...facts.currentAliases],
      targetName: facts.targetName,
      targetLevel: facts.targetLevel,
      rareMaterials: [...facts.rareMaterials],
      ...(facts.otherRareMaterialLabels
        ? { otherRareMaterialLabels: [...facts.otherRareMaterialLabels] }
        : {}),
      capabilityTags: [...editorial.capabilityTags],
      utilityTags: [...editorial.utilityTags],
      payoffClass: editorial.payoffClass,
      curatedPriority: editorial.curatedPriority,
      primaryReason: editorial.primaryReason,
    }
  })
  .sort((left, right) => {
    if (left.curatedPriority !== right.curatedPriority) {
      return right.curatedPriority - left.curatedPriority
    }

    return left.id.localeCompare(right.id, 'en')
  })

const snapshot = {
  metadata: {
    schemaVersion: manifest.schemaVersion,
    snapshotVersion: manifest.snapshotVersion,
    preferredUpstreams: upstreamSummaries,
    sources: sourceSummaries,
    totalEntries: entries.length,
  },
  entries,
}

const nextContents = buildSnapshotModule(snapshot)
const shouldPrint = process.argv.includes('--stdout')
const shouldCheck = process.argv.includes('--check')
const currentContents = fs.existsSync(outputPath)
  ? fs.readFileSync(outputPath, 'utf8')
  : null

if (shouldPrint) {
  process.stdout.write(nextContents)
}

if (shouldCheck) {
  if (currentContents !== nextContents) {
    fail(
      'knowledge snapshot is out of date. Run `npm run knowledge:build` to refresh it.',
    )
  }
} else if (currentContents !== nextContents) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, nextContents)
}
