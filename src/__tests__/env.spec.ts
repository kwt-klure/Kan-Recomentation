describe('poi env', () => {
  const originalPoiVersion = (globalThis as typeof globalThis & { POI_VERSION?: unknown }).POI_VERSION

  beforeEach(() => {
    delete (globalThis as typeof globalThis & { POI_VERSION?: unknown }).POI_VERSION
    jest.resetModules()
  })

  afterAll(() => {
    if (originalPoiVersion === undefined) {
      delete (globalThis as typeof globalThis & { POI_VERSION?: unknown }).POI_VERSION
      return
    }

    ;(globalThis as typeof globalThis & { POI_VERSION?: unknown }).POI_VERSION = originalPoiVersion
  })

  it('exposes the package name and detects the local fallback environment', () => {
    const envModule = require('../poi/env') as typeof import('../poi/env')

    expect(envModule.PACKAGE_NAME).toBe('poi-plugin-kan-recomentation')
    expect(envModule.IN_POI).toBe(false)
  })
})
