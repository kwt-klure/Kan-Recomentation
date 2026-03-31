import type {
  MaterialConstraintState,
  PersistedImportSession,
  RosterShip,
} from './types'

export const LAST_IMPORT_SESSION_STORAGE_KEY =
  'poi-plugin-kan-recomentation:last-import-session'

const LAST_IMPORT_SESSION_SCHEMA_VERSION = 1 as const

const hasLocalStorage = () => {
  try {
    return typeof globalThis.localStorage !== 'undefined'
  } catch {
    return false
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isMaterialConstraintState = (
  value: unknown,
): value is MaterialConstraintState =>
  isRecord(value) &&
  typeof value.acceptBlueprintCost === 'boolean' &&
  typeof value.acceptCatapultCost === 'boolean' &&
  typeof value.acceptActionReportCost === 'boolean' &&
  typeof value.acceptOtherRareMaterials === 'boolean'

const isRosterShip = (value: unknown): value is RosterShip =>
  isRecord(value) &&
  typeof value.instanceId === 'number' &&
  typeof value.currentFormName === 'string' &&
  typeof value.shipType === 'string' &&
  typeof value.level === 'number' &&
  (typeof value.nextRemodelHint === 'string' || value.nextRemodelHint === null) &&
  typeof value.locked === 'boolean' &&
  typeof value.inDock === 'boolean'

const isPersistedImportSession = (
  value: unknown,
): value is PersistedImportSession =>
  isRecord(value) &&
  value.schemaVersion === LAST_IMPORT_SESSION_SCHEMA_VERSION &&
  typeof value.fileName === 'string' &&
  Array.isArray(value.rosterShips) &&
  value.rosterShips.every(isRosterShip) &&
  isStringArray(value.warnings) &&
  isMaterialConstraintState(value.constraints) &&
  typeof value.savedAt === 'string'

export const createPersistedImportSession = (input: {
  fileName: string
  rosterShips: RosterShip[]
  warnings: string[]
  constraints: MaterialConstraintState
  savedAt?: string
}): PersistedImportSession => ({
  schemaVersion: LAST_IMPORT_SESSION_SCHEMA_VERSION,
  fileName: input.fileName,
  rosterShips: [...input.rosterShips],
  warnings: [...input.warnings],
  constraints: { ...input.constraints },
  savedAt: input.savedAt ?? new Date().toISOString(),
})

export const saveLastImportSession = (session: PersistedImportSession) => {
  if (!hasLocalStorage()) {
    return
  }

  try {
    globalThis.localStorage.setItem(
      LAST_IMPORT_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    )
  } catch {
    // Ignore storage failures in fallback environments.
  }
}

export const clearLastImportSession = () => {
  if (!hasLocalStorage()) {
    return
  }

  try {
    globalThis.localStorage.removeItem(LAST_IMPORT_SESSION_STORAGE_KEY)
  } catch {
    // Ignore storage failures in fallback environments.
  }
}

export const loadLastImportSession = () => {
  if (!hasLocalStorage()) {
    return null
  }

  try {
    const rawValue = globalThis.localStorage.getItem(LAST_IMPORT_SESSION_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as unknown
    if (isPersistedImportSession(parsed)) {
      return parsed
    }
  } catch {
    // Fall through and clear the broken payload below.
  }

  clearLastImportSession()
  return null
}
