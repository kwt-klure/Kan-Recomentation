import { DEFAULT_MATERIAL_CONSTRAINTS, REMODEL_KNOWLEDGE_BASE } from './knowledge'
import type {
  CapabilityTag,
  MaterialConstraintState,
  PayoffClass,
  RareMaterialType,
  RecommendationBucket,
  RecommendationCandidate,
  RecommendationResult,
  RemodelKnowledgeEntry,
  RosterShip,
  UtilityTag,
} from './types'

const BUCKET_ORDER: RecommendationBucket[] = [
  'ready_now',
  'near_term',
  'worth_investing',
  'blocked',
]

const SHORTLIST_SIZE = 10

const BUCKET_SOFT_CAP: Record<RecommendationBucket, number> = {
  ready_now: 3,
  near_term: 3,
  worth_investing: 3,
  blocked: 1,
}

const PAYOFF_WEIGHT: Record<PayoffClass, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

const MATERIAL_LABELS: Record<RareMaterialType, string> = {
  blueprint: '改裝設計圖',
  catapult: '試製甲板カタパルト',
  action_report: '戰鬥詳報',
  other_rare: '其他稀有素材',
}

const bucketGroup = (candidates: RecommendationCandidate[]) =>
  Object.fromEntries(
    BUCKET_ORDER.map((bucket) => [
      bucket,
      candidates.filter((candidate) => candidate.bucket === bucket),
    ]),
  ) as Record<RecommendationBucket, RecommendationCandidate[]>

const findKnowledgeForShip = (
  ship: RosterShip,
  knowledgeBase: RemodelKnowledgeEntry[],
) =>
  knowledgeBase.find((entry) => entry.currentAliases.includes(ship.currentFormName)) ?? null

const capabilityWeight = (capabilityTags: CapabilityTag[]) => capabilityTags.length

const utilityWeight = (utilityTags: UtilityTag[]) => utilityTags.length

const resolveBlockers = (
  entry: RemodelKnowledgeEntry,
  constraints: MaterialConstraintState,
) => {
  const blockers: string[] = []

  if (entry.rareMaterials.includes('blueprint') && !constraints.acceptBlueprintCost) {
    blockers.push(MATERIAL_LABELS.blueprint)
  }

  if (
    entry.rareMaterials.includes('catapult') &&
    !constraints.acceptCatapultCost
  ) {
    blockers.push(MATERIAL_LABELS.catapult)
  }

  if (
    entry.rareMaterials.includes('action_report') &&
    !constraints.acceptActionReportCost
  ) {
    blockers.push(MATERIAL_LABELS.action_report)
  }

  if (
    entry.rareMaterials.includes('other_rare') &&
    !constraints.acceptOtherRareMaterials
  ) {
    blockers.push(
      ...(entry.otherRareMaterialLabels?.length
        ? entry.otherRareMaterialLabels
        : [MATERIAL_LABELS.other_rare]),
    )
  }

  return blockers
}

const getBucket = (
  levelGap: number,
  blockers: string[],
): RecommendationBucket => {
  if (blockers.length > 0) {
    return 'blocked'
  }
  if (levelGap <= 0) {
    return 'ready_now'
  }
  if (levelGap <= 8) {
    return 'near_term'
  }
  return 'worth_investing'
}

const buildPrimaryReason = (
  entry: RemodelKnowledgeEntry,
  levelGap: number,
  blockers: string[],
) => {
  if (blockers.length > 0) {
    return `${entry.primaryReason} 但目前被 ${blockers.join('、')} 的限制擋住。`
  }

  if (levelGap <= 0) {
    return `${entry.primaryReason} 現在就能著手。`
  }

  return `${entry.primaryReason} 還差 ${levelGap} 級。`
}

const buildCandidate = (
  ship: RosterShip,
  entry: RemodelKnowledgeEntry,
  constraints: MaterialConstraintState,
): RecommendationCandidate => {
  const rawGap = entry.targetLevel - ship.level
  const levelGap = rawGap > 0 ? rawGap : 0
  const blockers = resolveBlockers(entry, constraints)
  const bucket = getBucket(levelGap, blockers)

  return {
    knowledgeId: entry.id,
    shipInstanceId: ship.instanceId,
    shipName: ship.currentFormName,
    shipType: ship.shipType,
    currentLevel: ship.level,
    targetName: entry.targetName,
    targetLevel: entry.targetLevel,
    levelGap,
    blockerStatus: blockers.length > 0 ? 'blocked' : 'none',
    blockerLabels: blockers,
    blockerSummary: blockers.length > 0 ? blockers.join('、') : '無',
    primaryReason: buildPrimaryReason(entry, levelGap, blockers),
    bucket,
    payoffClass: entry.payoffClass,
    curatedPriority: entry.curatedPriority,
    capabilityTags: [...entry.capabilityTags],
    utilityTags: [...entry.utilityTags],
  }
}

const compareCandidates = (
  left: RecommendationCandidate,
  right: RecommendationCandidate,
) => {
  if (left.curatedPriority !== right.curatedPriority) {
    return right.curatedPriority - left.curatedPriority
  }

  if (PAYOFF_WEIGHT[left.payoffClass] !== PAYOFF_WEIGHT[right.payoffClass]) {
    return PAYOFF_WEIGHT[right.payoffClass] - PAYOFF_WEIGHT[left.payoffClass]
  }

  if (left.levelGap !== right.levelGap) {
    return left.levelGap - right.levelGap
  }

  if (capabilityWeight(left.capabilityTags) !== capabilityWeight(right.capabilityTags)) {
    return capabilityWeight(right.capabilityTags) - capabilityWeight(left.capabilityTags)
  }

  if (utilityWeight(left.utilityTags) !== utilityWeight(right.utilityTags)) {
    return utilityWeight(right.utilityTags) - utilityWeight(left.utilityTags)
  }

  if (left.currentLevel !== right.currentLevel) {
    return right.currentLevel - left.currentLevel
  }

  if (left.shipName !== right.shipName) {
    return left.shipName.localeCompare(right.shipName, 'ja')
  }

  return left.shipInstanceId - right.shipInstanceId
}

const buildShortlist = (candidates: RecommendationCandidate[]) => {
  const grouped = bucketGroup([...candidates].sort(compareCandidates))
  const selected: RecommendationCandidate[] = []
  const overflow: RecommendationCandidate[] = []

  for (const bucket of BUCKET_ORDER) {
    const bucketCandidates = grouped[bucket]
    selected.push(...bucketCandidates.slice(0, BUCKET_SOFT_CAP[bucket]))
    overflow.push(...bucketCandidates.slice(BUCKET_SOFT_CAP[bucket]))
  }

  if (selected.length < SHORTLIST_SIZE) {
    selected.push(...overflow.slice(0, SHORTLIST_SIZE - selected.length))
  }

  return selected
    .slice(0, SHORTLIST_SIZE)
    .sort((left, right) => {
      if (left.bucket !== right.bucket) {
        return BUCKET_ORDER.indexOf(left.bucket) - BUCKET_ORDER.indexOf(right.bucket)
      }
      return compareCandidates(left, right)
    })
}

export const buildRecommendationResult = (
  rosterShips: RosterShip[],
  constraints: MaterialConstraintState = DEFAULT_MATERIAL_CONSTRAINTS,
  knowledgeBase: RemodelKnowledgeEntry[] = REMODEL_KNOWLEDGE_BASE,
): RecommendationResult => {
  const coveredCandidates = rosterShips
    .map((ship) => {
      const knowledge = findKnowledgeForShip(ship, knowledgeBase)
      return knowledge ? buildCandidate(ship, knowledge, constraints) : null
    })
    .filter((candidate): candidate is RecommendationCandidate => candidate != null)

  const shortlist = buildShortlist(coveredCandidates)

  return {
    summary: {
      totalShips: rosterShips.length,
      coveredShips: coveredCandidates.length,
      uncoveredShips: rosterShips.length - coveredCandidates.length,
      shortlistedShips: shortlist.length,
    },
    allCandidates: coveredCandidates.sort(compareCandidates),
    shortlist,
    buckets: bucketGroup(shortlist),
  }
}
