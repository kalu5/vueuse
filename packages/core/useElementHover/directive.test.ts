import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { vElementHover } from './directive'

const App = defineComponent({
  props: {
    onHover: {
      type: Function,
      required: true,
    },
  },

  template: `<template>
  <div v-element-hover="onHover">Hover me</div>
  </template>
  `,
})

describe('vElementHover', () => {
  let onHover = vi.fn()
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    onHover = vi.fn()
    wrapper = mount(App, {
      props: {
        onHover,
      },
      global: {
        directives: {
          elementHover: vElementHover,
        },
      },
    })
  })

  it('should be defined', () => {
    expect(wrapper).toBeDefined()
  })

  describe('cleaning directives when components are unmounted', () => {
    beforeEach(() => {
      onHover = vi.fn()

      wrapper = mount(App, {
        props: {
          onHover,
        },
        global: {
          directives: {
            elementHover: vElementHover,
          },
        },
      })
    })

    it('should be defined', () => {
      expect(wrapper).toBeDefined()
    })

    it('should call callback when hover element', async () => {
      await nextTick()
      expect(onHover).toBeCalledTimes(0)
      // Mock mouse enter event
      const mockMouseEnterEvent = new MouseEvent('mouseenter', {
        clientX: 10,
        clientY: 10,
      })
      // Get the element and trigger mouse event
      const element = wrapper.element.querySelector('div')
      if (element) {
        // Trigger mouseenter event
        element.dispatchEvent(mockMouseEnterEvent)
        await nextTick()
      }
      // Should be called after mouseenter triggers state change
      expect(onHover).toBeCalledTimes(1)
    })

    it('should clean up the directives', async () => {
      wrapper.unmount()
      await nextTick()
      expect(onHover).toBeCalledTimes(0)
    })
  })
})
