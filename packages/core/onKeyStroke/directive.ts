import type { OnKeyStrokeOptions } from '@vueuse/core'
import type { Fn } from '@vueuse/shared'
import type { ObjectDirective } from 'vue'
import { onKeyStroke } from '@vueuse/core'

type BindingValueFunction = (event: KeyboardEvent) => void

type BindingValueArray = [BindingValueFunction, OnKeyStrokeOptions]
type StopHandle = Fn | { stop: Fn, cancel: Fn, trigger: (event: Event) => void }

const stopKeyStrokeMap = new WeakMap<HTMLElement, StopHandle>()

export const vOnKeyStroke: ObjectDirective<
  HTMLElement,
  BindingValueFunction | BindingValueArray
> = {
  mounted(el, binding) {
    const keys = binding.arg?.split(',') ?? true
    let stop: StopHandle
    if (typeof binding.value === 'function') {
      stop = onKeyStroke(keys, binding.value, {
        target: el,
      })
    }
    else {
      const [handler, options] = binding.value
      stop = onKeyStroke(keys, handler, {
        target: el,
        ...options,
      })
    }
    stopKeyStrokeMap.set(el, stop)
  },
  unmounted(el) {
    const stop = stopKeyStrokeMap.get(el)
    if (stop && typeof stop === 'function') {
      stop()
    }
    else {
      stop?.stop()
    }
    stopKeyStrokeMap.delete(el)
  },
}
