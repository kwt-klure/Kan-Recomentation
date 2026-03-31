type GlobalWithLocalStorage = typeof globalThis & { localStorage?: Storage }

const originalLocalStorage = (globalThis as GlobalWithLocalStorage).localStorage

const installLocalStorageMock = () => {
  const store = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return store.size
    },
    clear: () => {
      store.clear()
    },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key)
    },
    setItem: (key, value) => {
      store.set(key, value)
    },
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  })

  return storage
}

describe('last import session helpers', () => {
  beforeEach(() => {
    installLocalStorageMock()
    jest.resetModules()
  })

  afterAll(() => {
    if (originalLocalStorage === undefined) {
      delete (globalThis as GlobalWithLocalStorage).localStorage
      return
    }

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    })
  })

  it('round-trips a persisted import session', () => {
    const sessionModule = require('../recommendation/session') as typeof import('../recommendation/session')

    const session = sessionModule.createPersistedImportSession({
      fileName: 'sample.csv',
      rosterShips: [
        {
          instanceId: 101,
          currentFormName: '阿武隈改',
          shipType: '軽巡洋艦',
          level: 72,
          nextRemodelHint: '阿武隈改二',
          locked: true,
          inDock: false,
        },
      ],
      warnings: ['sample warning'],
      constraints: {
        acceptBlueprintCost: true,
        acceptCatapultCost: false,
        acceptActionReportCost: false,
        acceptOtherRareMaterials: false,
      },
      savedAt: '2026-03-31T12:00:00.000Z',
    })

    sessionModule.saveLastImportSession(session)

    expect(sessionModule.loadLastImportSession()).toEqual(session)
  })

  it('clears broken payloads instead of restoring invalid session data', () => {
    const sessionModule = require('../recommendation/session') as typeof import('../recommendation/session')

    globalThis.localStorage.setItem(
      sessionModule.LAST_IMPORT_SESSION_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        fileName: 'broken.csv',
      }),
    )

    expect(sessionModule.loadLastImportSession()).toBeNull()
    expect(
      globalThis.localStorage.getItem(sessionModule.LAST_IMPORT_SESSION_STORAGE_KEY),
    ).toBeNull()
  })
})
