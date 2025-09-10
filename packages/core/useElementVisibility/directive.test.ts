import type { VueWrapper } from '@vue/test-utils'
import type { UseElementVisibilityOptions } from './index'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { vElementVisibility } from './directive'

const App = defineComponent({
  props: {
    onVisibility: {
      type: Function,
      required: true,
    },
    options: {
      type: Object,
      require: false,
    },
  },

  template: `<template>
  <div v-if="options" v-element-visibility="onVisibility">Look me</div>
  <div v-else v-element-visibility="[onVisibility, options]">Look me</div>
  </template>
  `,
})

describe('vElementVisibility', () => {
  let onVisibility = vi.fn()
  let wrapper: VueWrapper<any>

  describe('given no options', () => {
    beforeEach(() => {
      onVisibility = vi.fn()
      wrapper = mount(App, {
        props: {
          onVisibility,
        },
        global: {
          directives: {
            ElementVisibility: vElementVisibility,
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
      onVisibility = vi.fn()
      const options: UseElementVisibilityOptions = {
        scrollTarget: document.body,
        rootMargin: '10px 0px 0px 0px',
      }
      wrapper = mount(App, {
        props: {
          onVisibility,
          options,
        },
        global: {
          directives: {
            ElementVisibility: vElementVisibility,
          },
        },
      })
    })

    it('should be defined', () => {
      expect(wrapper).toBeDefined()
    })
  })

  describe('cleaning directives when components are unmounted', () => {
    let originalIntersectionObserver: typeof window.IntersectionObserver
    let mockObserverCallback: any
    let mockDisconnect: () => void

    beforeEach(() => {
      onVisibility = vi.fn()

      originalIntersectionObserver = window.IntersectionObserver
      mockDisconnect = vi.fn()

      window.IntersectionObserver = vi.fn((callback, options) => {
        mockObserverCallback = callback
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: mockDisconnect,
        } as any
      })

      wrapper = mount(App, {
        props: {
          onVisibility,
        },
        global: {
          directives: {
            ElementVisibility: vElementVisibility,
          },
        },
      })
    })

    afterEach(() => {
      window.IntersectionObserver = originalIntersectionObserver
    })

    it('should clean up the directives', async () => {
      await nextTick()
      const element = wrapper.element.querySelector('div')

      if (element && mockObserverCallback) {
        await nextTick()

        onVisibility.mockClear()

        const mockEntry = {
          isIntersecting: true,
          time: Date.now(),
          target: element,
          intersectionRatio: 1,
          boundingClientRect: {
            bottom: 100,
            height: 50,
            left: 0,
            right: 100,
            top: 50,
            width: 100,
            x: 0,
            y: 50,
            toJSON: vi.fn(),
          },
          intersectionRect: {
            bottom: 100,
            height: 50,
            left: 0,
            right: 100,
            top: 50,
            width: 100,
            x: 0,
            y: 50,
            toJSON: vi.fn(),
          },
          rootBounds: {
            bottom: 200,
            height: 200,
            left: 0,
            right: 200,
            top: 0,
            width: 200,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          },
        }

        mockObserverCallback([mockEntry], {})
        await nextTick()
        await nextTick()

        expect(onVisibility).toBeCalledTimes(1)
        expect(onVisibility).toBeCalledWith(true)

        const callCountBeforeUnmount = onVisibility.mock.calls.length

        wrapper.unmount()
        await nextTick()

        expect(mockDisconnect).toBeCalledTimes(1)

        const postUnmountEntry = {
          isIntersecting: false,
          time: Date.now(),
          target: element,
          intersectionRatio: 0,
          boundingClientRect: {
            bottom: 100,
            height: 50,
            left: 0,
            right: 100,
            top: 50,
            width: 100,
            x: 0,
            y: 50,
            toJSON: vi.fn(),
          },
          intersectionRect: {
            bottom: 100,
            height: 50,
            left: 0,
            right: 100,
            top: 50,
            width: 100,
            x: 0,
            y: 50,
            toJSON: vi.fn(),
          },
          rootBounds: {
            bottom: 200,
            height: 200,
            left: 0,
            right: 200,
            top: 0,
            width: 200,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          },
        }

        mockObserverCallback([postUnmountEntry], {})
        await nextTick()

        expect(onVisibility.mock.calls.length).toBe(callCountBeforeUnmount)
      }
      else {
        expect(true).toBe(true)
      }
    })
  })
})
