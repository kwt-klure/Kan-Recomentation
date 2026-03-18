export const INVENTORY_EXPORT_REQUIRED_HEADERS = [
  '艦 ID',
  '艦名',
  '艦種',
  '等級',
  '後續改造',
] as const

export type InventoryExportRequiredHeader =
  (typeof INVENTORY_EXPORT_REQUIRED_HEADERS)[number]

export type InventoryExportRow = Record<string, string>

export type RosterShip = {
  instanceId: number
  currentFormName: string
  shipType: string
  level: number
  nextRemodelHint: string | null
  locked: boolean
  inDock: boolean
}

export type RareMaterialType =
  | 'blueprint'
  | 'catapult'
  | 'action_report'
  | 'other_rare'

export type CapabilityTag =
  | 'aaci'
  | 'oasw'
  | 'landing_craft'
  | 'opening_torpedo'
  | 'carrier_conversion'
  | 'ship_type_conversion'
  | 'aviation_battleship'
  | 'combat_power'

export type UtilityTag =
  | 'fleet_anti_air'
  | 'fleet_anti_submarine'
  | 'transport'
  | 'expedition'
  | 'quest'
  | 'fleet_flexibility'

export type PayoffClass = 'high' | 'medium' | 'low'

export type RemodelKnowledgeEntry = {
  id: string
  currentAliases: string[]
  targetName: string
  targetLevel: number
  rareMaterials: RareMaterialType[]
  otherRareMaterialLabels?: string[]
  capabilityTags: CapabilityTag[]
  utilityTags: UtilityTag[]
  payoffClass: PayoffClass
  curatedPriority: number
  primaryReason: string
}

export type MaterialConstraintState = {
  acceptBlueprintCost: boolean
  acceptCatapultCost: boolean
  acceptActionReportCost: boolean
  acceptOtherRareMaterials: boolean
}

export type RecommendationBucket =
  | 'ready_now'
  | 'near_term'
  | 'worth_investing'
  | 'blocked'

export type RecommendationCandidate = {
  knowledgeId: string
  shipInstanceId: number
  shipName: string
  shipType: string
  currentLevel: number
  targetName: string
  targetLevel: number
  levelGap: number
  blockerStatus: 'none' | 'blocked'
  blockerLabels: string[]
  blockerSummary: string
  primaryReason: string
  bucket: RecommendationBucket
  payoffClass: PayoffClass
  curatedPriority: number
  capabilityTags: CapabilityTag[]
  utilityTags: UtilityTag[]
}

export type RecommendationSummary = {
  totalShips: number
  coveredShips: number
  uncoveredShips: number
  shortlistedShips: number
}

export type RecommendationResult = {
  summary: RecommendationSummary
  allCandidates: RecommendationCandidate[]
  shortlist: RecommendationCandidate[]
  buckets: Record<RecommendationBucket, RecommendationCandidate[]>
}

export type InventoryImportResult = {
  headers: string[]
  rawRows: InventoryExportRow[]
  rosterShips: RosterShip[]
  warnings: string[]
}
