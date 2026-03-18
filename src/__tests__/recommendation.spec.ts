import { buildRecommendationResult } from '../recommendation/engine'
import { DEFAULT_MATERIAL_CONSTRAINTS } from '../recommendation/knowledge'
import type { MaterialConstraintState, RosterShip } from '../recommendation/types'

const makeShip = (
  overrides: Partial<RosterShip> & Pick<RosterShip, 'instanceId' | 'currentFormName'>,
): RosterShip => ({
  instanceId: overrides.instanceId,
  currentFormName: overrides.currentFormName,
  shipType: overrides.shipType ?? '駆逐艦',
  level: overrides.level ?? 1,
  nextRemodelHint: overrides.nextRemodelHint ?? null,
  locked: overrides.locked ?? true,
  inDock: overrides.inDock ?? false,
})

describe('recommendation engine', () => {
  it('evaluates duplicate ships as separate candidates', () => {
    const result = buildRecommendationResult([
      makeShip({ instanceId: 1, currentFormName: '阿武隈', shipType: '軽巡洋艦', level: 12 }),
      makeShip({ instanceId: 2, currentFormName: '阿武隈', shipType: '軽巡洋艦', level: 1 }),
    ])

    expect(
      result.allCandidates.filter((candidate) => candidate.targetName === '阿武隈改二'),
    ).toHaveLength(2)
  })

  it('uses the next meaningful target instead of the literal next remodel step', () => {
    const result = buildRecommendationResult([
      makeShip({ instanceId: 3, currentFormName: '千歳', shipType: '水上機母艦', level: 2, nextRemodelHint: '千歳改' }),
    ])

    expect(result.allCandidates[0]?.targetName).toBe('千歳航')
    expect(result.allCandidates[0]?.targetLevel).toBe(35)
  })

  it('applies material toggles to blocker status', () => {
    const ship = makeShip({
      instanceId: 4,
      currentFormName: '阿武隈改',
      shipType: '軽巡洋艦',
      level: 72,
    })
    const relaxedConstraints: MaterialConstraintState = {
      ...DEFAULT_MATERIAL_CONSTRAINTS,
      acceptBlueprintCost: true,
    }

    const blocked = buildRecommendationResult([ship], DEFAULT_MATERIAL_CONSTRAINTS)
    const unblocked = buildRecommendationResult([ship], relaxedConstraints)

    expect(blocked.allCandidates[0]?.bucket).toBe('blocked')
    expect(unblocked.allCandidates[0]?.bucket).toBe('near_term')
  })

  it('counts uncovered ships without putting them into the shortlist', () => {
    const result = buildRecommendationResult([
      makeShip({ instanceId: 5, currentFormName: '吹雪改', level: 37 }),
      makeShip({ instanceId: 6, currentFormName: '未覆蓋艦', level: 80 }),
    ])

    expect(result.summary.totalShips).toBe(2)
    expect(result.summary.coveredShips).toBe(1)
    expect(result.summary.uncoveredShips).toBe(1)
    expect(result.shortlist).toHaveLength(1)
  })

  it('groups shortlist results into stable buckets', () => {
    const result = buildRecommendationResult([
      makeShip({ instanceId: 7, currentFormName: '大鯨', shipType: '潜水母艦', level: 29 }),
      makeShip({ instanceId: 8, currentFormName: '大潮改', level: 63 }),
      makeShip({ instanceId: 9, currentFormName: '吹雪改', level: 37 }),
      makeShip({ instanceId: 10, currentFormName: '伊勢改', shipType: '戦艦', level: 87 }),
    ])

    expect(result.buckets.ready_now.map((candidate) => candidate.shipName)).toContain('大鯨')
    expect(result.buckets.near_term.map((candidate) => candidate.shipName)).toContain('大潮改')
    expect(result.buckets.worth_investing.map((candidate) => candidate.shipName)).toContain('吹雪改')
    expect(result.buckets.blocked.map((candidate) => candidate.shipName)).toContain('伊勢改')
  })
})
