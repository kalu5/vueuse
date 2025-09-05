import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { vElementSize } from './directive'

const App = defineComponent({
  props: {
    onResize: {
      type: Function,
      required: true,
    },
    options: {
      type: Array,
      required: false,
    },
  },

  template: `<template>
  <div v-if="options" v-element-size="[onResize,options]">Hello world!</div>
  <div v-else v-element-size="onResize">Hello world!</div>
  </template>
  `,
})

describe('vElementSize', () => {
  let onResize = vi.fn()
  let wrapper: VueWrapper<any>

  describe('given no options', () => {
    beforeEach(() => {
      onResize = vi.fn()
      wrapper = mount(App, {
        props: {
          onResize,
        },
        global: {
          directives: {
            ElementSize: vElementSize,
          },
        },
      })
    })

    it('should be defined', () => {
      expect(wrapper).toBeDefined()
    })
  })

  describe('given options', () => {
    beforeEach(() => {
      onResize = vi.fn()
      const options = [{ width: 100, height: 100 }, { box: 'content-box' }]

      wrapper = mount(App, {
        props: {
          onResize,
          options,
        },
        global: {
          directives: {
            ElementSize: vElementSize,
          },
        },
      })
    })

    it('should be defined', () => {
      expect(wrapper).toBeDefined()
    })
  })

  describe('cleaning directives when components are unmounted', () => {
    let originalResizeObserver: any
    let resizeObserverCallback: Function | null = null
    let mockResizeObserver: any

    beforeEach(() => {
      // Save original ResizeObserver
      originalResizeObserver = globalThis.ResizeObserver

      // Create a better mock that captures the callback
      resizeObserverCallback = null
      mockResizeObserver = vi.fn().mockImplementation((callback: Function) => {
        resizeObserverCallback = callback
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        }
      })

      globalThis.ResizeObserver = mockResizeObserver

      onResize = vi.fn()

      wrapper = mount(App, {
        props: {
          onResize,
        },
        global: {
          directives: {
            ElementSize: vElementSize,
          },
        },
      })
    })

    afterEach(() => {
      // Restore original ResizeObserver
      globalThis.ResizeObserver = originalResizeObserver
    })

    it('should clean up the directives', async () => {
      await nextTick()
      const element = wrapper.element.querySelector('div')

      if (element && resizeObserverCallback) {
        // Trigger resize to verify the callback works before unmount
        resizeObserverCallback([{
          target: element,
          contentRect: {
            width: 200,
            height: 100,
          },
        }])

        await nextTick()

        // Verify the onResize callback was called
        expect(onResize).toBeCalledTimes(1)

        // Clear the mock and unmount the component
        onResize.mockClear()
        wrapper.unmount()
        await nextTick()

        // Try to trigger resize after unmount
        resizeObserverCallback([{
          target: element,
          contentRect: {
            width: 300,
            height: 100,
          },
        }])

        await nextTick()

        // Expect no new calls to onResize after unmount
        expect(onResize).toBeCalledTimes(0)
      }
    })
  })
})
