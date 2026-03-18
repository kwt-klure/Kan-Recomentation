import type {
  InventoryExportRow,
  InventoryImportResult,
  RosterShip,
} from './types'
import { INVENTORY_EXPORT_REQUIRED_HEADERS } from './types'

export class InventoryCsvParseError extends Error {
  missingHeaders: string[]

  constructor(message: string, missingHeaders: string[] = []) {
    super(message)
    this.name = 'InventoryCsvParseError'
    this.missingHeaders = missingHeaders
  }
}

const stripBom = (value: string) => value.replace(/^\uFEFF/, '')

const normalizeCell = (value: string | undefined) => value?.trim() ?? ''

const toOptionalCell = (value: string | undefined) => {
  const normalized = normalizeCell(value)
  return normalized === '' || normalized.toUpperCase() === 'NA'
    ? null
    : normalized
}

const parseIntegerCell = (value: string | undefined) => {
  const normalized = normalizeCell(value)
  if (!normalized || normalized.toUpperCase() === 'NA') {
    return null
  }

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : null
}

const parseBooleanCell = (value: string | undefined) => {
  const normalized = normalizeCell(value).toLowerCase()
  return normalized === '1' || normalized === 'true'
}

export const parseCsvText = (text: string) => {
  const sanitized = stripBom(text)
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let index = 0; index < sanitized.length; index += 1) {
    const char = sanitized[index]

    if (char === '"') {
      const next = sanitized[index + 1]
      if (inQuotes && next === '"') {
        currentCell += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && sanitized[index + 1] === '\n') {
        index += 1
      }
      currentRow.push(currentCell)
      rows.push(currentRow)
      currentRow = []
      currentCell = ''
      continue
    }

    currentCell += char
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell)
    rows.push(currentRow)
  }

  return rows.filter(
    (row) => row.length > 1 || row.some((cell) => normalizeCell(cell) !== ''),
  )
}

export const parseInventoryExportCsv = (text: string) => {
  const rows = parseCsvText(text)

  if (rows.length === 0) {
    throw new InventoryCsvParseError('CSV is empty.')
  }

  const headers = rows[0]!.map((header, index) =>
    index === 0 ? stripBom(header).trim() : header.trim(),
  )
  const missingHeaders = INVENTORY_EXPORT_REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  )

  if (missingHeaders.length > 0) {
    throw new InventoryCsvParseError(
      `CSV schema mismatch. Missing headers: ${missingHeaders.join(', ')}`,
      [...missingHeaders],
    )
  }

  const rawRows: InventoryExportRow[] = rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
  )

  return {
    headers,
    rawRows,
  }
}

export const adaptInventoryRowsToRoster = (
  rows: InventoryExportRow[],
  headers: string[],
): InventoryImportResult => {
  const rosterShips: RosterShip[] = []
  const warnings: string[] = []

  rows.forEach((row, index) => {
    const instanceId = parseIntegerCell(row['艦 ID'])
    const currentFormName = toOptionalCell(row['艦名'])
    const shipType = toOptionalCell(row['艦種'])
    const level = parseIntegerCell(row['等級'])

    if (
      instanceId == null ||
      currentFormName == null ||
      shipType == null ||
      level == null
    ) {
      warnings.push(`已略過第 ${index + 2} 列，因為缺少必要欄位或數值格式不正確。`)
      return
    }

    rosterShips.push({
      instanceId,
      currentFormName,
      shipType,
      level,
      nextRemodelHint: toOptionalCell(row['後續改造']),
      locked: parseBooleanCell(row['鎖定']),
      inDock: parseBooleanCell(row['入渠']),
    })
  })

  return {
    headers,
    rawRows: rows,
    rosterShips,
    warnings,
  }
}

export const importRosterFromCsvText = (text: string) => {
  const { headers, rawRows } = parseInventoryExportCsv(text)
  return adaptInventoryRowsToRoster(rawRows, headers)
}
