import type { OnLongPressOptions } from '@vueuse/core'
import type { Fn } from '@vueuse/shared'
import type { ObjectDirective } from 'vue'
import { onLongPress } from '@vueuse/core'

type BindingValueFunction = (evt: PointerEvent) => void

type BindingValueArray = [
  BindingValueFunction,
  OnLongPressOptions,
]

const stopLongPressMap = new WeakMap<HTMLElement, Fn>()

export const vOnLongPress: ObjectDirective<
  HTMLElement,
  BindingValueFunction | BindingValueArray
> = {
  mounted(el, binding) {
    let stop: Fn
    if (typeof binding.value === 'function')
      stop = onLongPress(el, binding.value, { modifiers: binding.modifiers })
    else
      stop = onLongPress(el, ...binding.value)
    stopLongPressMap.set(el, stop)
  },
  unmounted(el) {
    stopLongPressMap.get(el)?.()
    stopLongPressMap.delete(el)
  },
}

// alias
export { vOnLongPress as VOnLongPress }
