import { execFileSync } from 'child_process'
import path from 'path'

import { KNOWLEDGE_SNAPSHOT } from '../recommendation/generated/knowledgeSnapshot'
import {
  KNOWLEDGE_SNAPSHOT_METADATA,
  REMODEL_KNOWLEDGE_BASE,
} from '../recommendation/knowledge'

describe('knowledge snapshot', () => {
  it('keeps the generated snapshot in sync with layered source files', () => {
    const repoRoot = path.resolve(__dirname, '..', '..')

    expect(() =>
      execFileSync('node', ['scripts/build-knowledge-snapshot.cjs', '--check'], {
        cwd: repoRoot,
        stdio: 'pipe',
      }),
    ).not.toThrow()
  })

  it('exposes source metadata and merged provenance at runtime', () => {
    expect(KNOWLEDGE_SNAPSHOT.metadata).toBe(KNOWLEDGE_SNAPSHOT_METADATA)
    expect(KNOWLEDGE_SNAPSHOT_METADATA.totalEntries).toBe(
      REMODEL_KNOWLEDGE_BASE.length,
    )
    expect(KNOWLEDGE_SNAPSHOT_METADATA.preferredUpstreams).toEqual([
      {
        id: 'japanese-primary',
        displayName: 'Japanese Primary Source',
        locale: 'ja-JP',
        priority: 1,
        role: 'primary',
        referenceNote:
          'Default authoritative upstream for remodel facts until a specific Japanese feed is locked in.',
      },
      {
        id: 'diablohu-zh-backup',
        displayName: 'Who Calls the Fleet',
        locale: 'zh-CN',
        priority: 2,
        role: 'fallback',
        homepage: 'https://fleet.diablohu.com',
        referenceNote:
          'First Chinese fallback when the Japanese upstream is missing, delayed, or incomplete.',
      },
    ])
    expect(KNOWLEDGE_SNAPSHOT_METADATA.sources.map((source) => source.id)).toEqual([
      'external-remodel-facts',
      'manual-fact-overrides',
      'editorial-remodel-rules',
    ])

    const haruna = REMODEL_KNOWLEDGE_BASE.find(
      (entry) => entry.id === 'haruna-kai-ni-otsu',
    )

    expect(haruna?.otherRareMaterialLabels).toEqual(['新型兵装資材'])
    expect(haruna?.sourceIds).toEqual([
      'editorial-remodel-rules',
      'external-remodel-facts',
      'manual-fact-overrides',
    ])
  })
})
