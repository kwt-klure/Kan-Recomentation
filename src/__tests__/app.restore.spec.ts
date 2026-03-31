import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

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
}

describe('app restore banner', () => {
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

  it('renders the restored session notice when a last import exists', () => {
    const sessionModule = require('../recommendation/session') as typeof import('../recommendation/session')

    sessionModule.saveLastImportSession(
      sessionModule.createPersistedImportSession({
        fileName: 'restored.csv',
        rosterShips: [
          {
            instanceId: 7,
            currentFormName: '大鯨',
            shipType: '潜水母艦',
            level: 29,
            nextRemodelHint: '龍鳳',
            locked: true,
            inDock: false,
          },
        ],
        warnings: [],
        constraints: {
          acceptBlueprintCost: false,
          acceptCatapultCost: false,
          acceptActionReportCost: false,
          acceptOtherRareMaterials: false,
        },
        savedAt: '2026-03-31T12:00:00.000Z',
      }),
    )

    const { AppMain } = require('../App') as typeof import('../App')
    const html = renderToStaticMarkup(React.createElement(AppMain))

    expect(html).toContain('已恢復上次匯入')
    expect(html).toContain('restored.csv')
    expect(html).toContain('清除上次匯入資料')
  })
})
