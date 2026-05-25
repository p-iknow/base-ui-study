import type { StateAttributesMapping } from '../internals/getStateAttributesProps'
import { SwitchRootDataAttributes } from './root/SwitchRootDataAttributes'
import type { SwitchRootState } from './root/SwitchRoot'

export const stateAttributesMapping: StateAttributesMapping<SwitchRootState> = {
  checked(value): Record<string, string> {
    if (value) {
      return {
        [SwitchRootDataAttributes.checked]: '',
      }
    }

    return {
      [SwitchRootDataAttributes.unchecked]: '',
    }
  },
}
