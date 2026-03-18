const loadStoreModule = () => {
  jest.resetModules()
  return require('../poi/store') as typeof import('../poi/store')
}

describe('poi store helpers', () => {
  it('returns null when no store has been provided', () => {
    const { getStoreValue } = loadStoreModule()

    expect(getStoreValue(['info', 'ships'])).toBeNull()
  })

  it('supports imported fallback state and nested lookups', () => {
    const { importPoiState, getStoreValue } = loadStoreModule()

    importPoiState({
      ui: { activeMainTab: 'roster' },
      plugins: [],
      info: {
        ships: {
          '1': {
            api_ship_id: 1,
            api_lv: 99,
          },
        },
      },
    })

    expect(getStoreValue(['ui', 'activeMainTab'])).toBe('roster')
    expect(getStoreValue(['info', 'ships', '1', 'api_ship_id'])).toBe(1)
    expect(getStoreValue(['info', 'ships', '1', 'api_lv'])).toBe(99)
  })

  it('creates a fallback store with a default ui shape', async () => {
    const { getPoiStore } = loadStoreModule()

    const store = await getPoiStore()

    expect(store.getState().ui.activeMainTab).toBe('')
  })
})
