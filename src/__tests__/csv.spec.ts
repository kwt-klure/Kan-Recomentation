import {
  importRosterFromCsvText,
  InventoryCsvParseError,
  parseInventoryExportCsv,
} from '../recommendation/csv'

describe('inventory export csv parser', () => {
  it('handles BOM, quoted cells, NA values, and row adaptation', () => {
    const csv = [
      '\uFEFF艦 ID,艦名,艦種,等級,後續改造,鎖定,入渠',
      '"1001","吹雪改","駆逐艦","37","吹雪改二","1","false"',
      '"1002","阿武隈","軽巡洋艦","12","阿武隈改","0","true"',
      '"oops","NA","駆逐艦","10","NA","0","false"',
    ].join('\n')

    const result = importRosterFromCsvText(csv)

    expect(result.headers).toContain('艦名')
    expect(result.rosterShips).toHaveLength(2)
    expect(result.warnings).toHaveLength(1)
    expect(result.rosterShips[0]).toEqual({
      instanceId: 1001,
      currentFormName: '吹雪改',
      shipType: '駆逐艦',
      level: 37,
      nextRemodelHint: '吹雪改二',
      locked: true,
      inDock: false,
    })
    expect(result.rosterShips[1]?.nextRemodelHint).toBe('阿武隈改')
    expect(result.rosterShips[1]?.inDock).toBe(true)
  })

  it('throws a clear schema error when required headers are missing', () => {
    const csv = '艦 ID,艦名,艦種,等級\n"1","吹雪改","駆逐艦","37"'

    expect(() => parseInventoryExportCsv(csv)).toThrow(InventoryCsvParseError)
    expect(() => parseInventoryExportCsv(csv)).toThrow(/Missing headers/)
  })
})
