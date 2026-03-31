import type { MaterialConstraintState } from './types'

export const setMaterialConstraintValue = (
  current: MaterialConstraintState,
  key: keyof MaterialConstraintState,
  checked: boolean,
): MaterialConstraintState => ({
  ...current,
  [key]: checked,
})
