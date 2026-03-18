import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { RecommendationResults } from '../recommendation/view'
import type { RecommendationResult } from '../recommendation/types'

const RESULT_FIXTURE: RecommendationResult = {
  summary: {
    totalShips: 3,
    coveredShips: 3,
    uncoveredShips: 0,
    shortlistedShips: 3,
  },
  allCandidates: [],
  shortlist: [],
  buckets: {
    ready_now: [
      {
        knowledgeId: 'taigei-to-ryuuhou',
        shipInstanceId: 1,
        shipName: '大鯨',
        shipType: '潜水母艦',
        currentLevel: 29,
        targetName: '龍鳳',
        targetLevel: 25,
        levelGap: 0,
        blockerStatus: 'none',
        blockerLabels: [],
        blockerSummary: '無',
        primaryReason: '大鯨轉龍鳳是很便宜的艦種轉換，現在就能著手。',
        bucket: 'ready_now',
        payoffClass: 'high',
        curatedPriority: 88,
        capabilityTags: ['carrier_conversion'],
        utilityTags: ['fleet_flexibility'],
      },
    ],
    near_term: [],
    worth_investing: [
      {
        knowledgeId: 'fubuki-kai-ni',
        shipInstanceId: 2,
        shipName: '吹雪改',
        shipType: '駆逐艦',
        currentLevel: 37,
        targetName: '吹雪改二',
        targetLevel: 70,
        levelGap: 33,
        blockerStatus: 'none',
        blockerLabels: [],
        blockerSummary: '無',
        primaryReason: '吹雪改二是早期就值得投資的萬用防空驅逐。 還差 33 級。',
        bucket: 'worth_investing',
        payoffClass: 'high',
        curatedPriority: 90,
        capabilityTags: ['aaci'],
        utilityTags: ['fleet_anti_air', 'quest'],
      },
    ],
    blocked: [
      {
        knowledgeId: 'ise-kai-ni',
        shipInstanceId: 3,
        shipName: '伊勢改',
        shipType: '戦艦',
        currentLevel: 87,
        targetName: '伊勢改二',
        targetLevel: 88,
        levelGap: 1,
        blockerStatus: 'blocked',
        blockerLabels: ['改裝設計圖', '試製甲板カタパルト'],
        blockerSummary: '改裝設計圖、試製甲板カタパルト',
        primaryReason: '伊勢改二把戰艦與航空支援整合在同一艘船上，但目前被 改裝設計圖、試製甲板カタパルト 的限制擋住。',
        bucket: 'blocked',
        payoffClass: 'high',
        curatedPriority: 97,
        capabilityTags: ['aviation_battleship'],
        utilityTags: ['quest', 'fleet_flexibility'],
      },
    ],
  },
}

describe('recommendation results view', () => {
  it('renders grouped buckets and explainable recommendation cards', () => {
    const html = renderToStaticMarkup(
      React.createElement(RecommendationResults, {
        fileName: 'kancolle_kan_26-03-18.csv',
        importError: null,
        result: RESULT_FIXTURE,
        warnings: [],
      }),
    )

    expect(html).toContain('Import complete')
    expect(html).toContain('Ready Now')
    expect(html).toContain('Worth Investing')
    expect(html).toContain('Blocked')
    expect(html).toContain('大鯨轉龍鳳是很便宜的艦種轉換')
    expect(html).toContain('總艦數 3')
  })

  it('renders import failures as a dedicated callout', () => {
    const html = renderToStaticMarkup(
      React.createElement(RecommendationResults, {
        fileName: null,
        importError: 'CSV schema mismatch.',
        result: null,
        warnings: [],
      }),
    )

    expect(html).toContain('Import failed')
    expect(html).toContain('CSV schema mismatch.')
  })
})
