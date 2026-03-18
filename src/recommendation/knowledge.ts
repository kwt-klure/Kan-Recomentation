import { KNOWLEDGE_SNAPSHOT } from './generated/knowledgeSnapshot'
import type { MaterialConstraintState } from './types'

export const DEFAULT_MATERIAL_CONSTRAINTS: MaterialConstraintState = {
  acceptBlueprintCost: false,
  acceptCatapultCost: false,
  acceptActionReportCost: false,
  acceptOtherRareMaterials: false,
}

export const KNOWLEDGE_SNAPSHOT_METADATA = KNOWLEDGE_SNAPSHOT.metadata

export const REMODEL_KNOWLEDGE_BASE = KNOWLEDGE_SNAPSHOT.entries
