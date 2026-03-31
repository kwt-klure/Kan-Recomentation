import { setMaterialConstraintValue } from '../recommendation/constraints'
import { DEFAULT_MATERIAL_CONSTRAINTS } from '../recommendation/knowledge'

describe('material constraint updates', () => {
  it('uses the explicit checked value so repeated change events stay stable', () => {
    const once = setMaterialConstraintValue(
      DEFAULT_MATERIAL_CONSTRAINTS,
      'acceptBlueprintCost',
      true,
    )
    const twice = setMaterialConstraintValue(
      once,
      'acceptBlueprintCost',
      true,
    )

    expect(once.acceptBlueprintCost).toBe(true)
    expect(twice.acceptBlueprintCost).toBe(true)
  })
})
