import type { VueWrapper } from '@vue/test-utils'
import type { UseIntersectionObserverOptions } from './index'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { vIntersectionObserver } from './directive'

const App = defineComponent({
  props: {
    onIntersectionObserver: {
      type: Function,
      required: true,
    },
    options: {
      type: Object,
      required: false,
    },
  },

  template: `<template>
  <div v-if="options" v-intersection-observer="[onIntersectionObserver,options]">Hello world!</div>
  <div v-else v-intersection-observer="onIntersectionObserver">Hello world!</div>
  </template>
  `,
})

describe('vIntersectionObserver', () => {
  let onIntersectionObserver = vi.fn()
  let wrapper: VueWrapper<any>

  describe('given no options', () => {
    beforeEach(() => {
      onIntersectionObserver = vi.fn()
      wrapper = mount(App, {
        props: {
          onIntersectionObserver,
        },
        global: {
          directives: {
            'intersection-observer': vIntersectionObserver,
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
      onIntersectionObserver = vi.fn()
      const options: UseIntersectionObserverOptions = {
        rootMargin: '10px',
      }
      wrapper = mount(App, {
        props: {
          onIntersectionObserver,
          options,
        },
        global: {
          directives: {
            'intersection-observer': vIntersectionObserver,
          },
        },
      })
    })

    it('should be defined', () => {
      expect(wrapper).toBeDefined()
    })
  })

  describe('cleaning directives when components are unmounted', () => {
    let originalIntersectionObserver: typeof IntersectionObserver
    let intersectionObserverCallback: IntersectionObserverCallback | null = null

    beforeEach(() => {
      onIntersectionObserver = vi.fn()
      originalIntersectionObserver = globalThis.IntersectionObserver

      // Track if the observer has been disconnected
      let isDisconnected = false

      // Create a mock that properly simulates disconnection
      globalThis.IntersectionObserver = vi.fn().mockImplementation((callback) => {
        // Store the real callback reference
        const realCallback = callback

        // Create a wrapped callback that checks disconnection status
        const wrappedCallback: IntersectionObserverCallback = (...args) => {
          // Only call the real callback if not disconnected
          if (!isDisconnected) {
            realCallback(...args)
          }
        }

        // Store the wrapped callback for testing
        intersectionObserverCallback = wrappedCallback

        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn().mockImplementation(() => {
            // Mark as disconnected when disconnect is called
            isDisconnected = true
          }),
        }
      })

      wrapper = mount(App, {
        props: {
          onIntersectionObserver,
        },
        global: {
          directives: {
            'intersection-observer': vIntersectionObserver,
          },
        },
      })
    })

    afterEach(() => {
      // Restore the original IntersectionObserver
      globalThis.IntersectionObserver = originalIntersectionObserver
      intersectionObserverCallback = null
    })

    it('should clean up the directives', async () => {
      await nextTick()
      const element = wrapper.element.querySelector('div')
      if (element && intersectionObserverCallback) {
        const mockEntry: IntersectionObserverEntry = {
          boundingClientRect: { x: 0, y: 0, width: 100, height: 100, top: 0, right: 100, bottom: 100, left: 0, toJSON: vi.fn() },
          intersectionRatio: 1,
          intersectionRect: { x: 0, y: 0, width: 100, height: 100, top: 0, right: 100, bottom: 100, left: 0, toJSON: vi.fn() },
          isIntersecting: true,
          rootBounds: null,
          target: element,
          time: 0,
        }
        intersectionObserverCallback([mockEntry], {} as IntersectionObserver)
        await nextTick()

        // Verify the onIntersectionObserver callback was called
        expect(onIntersectionObserver).toBeCalledTimes(1)
      }

      // Clear the mock and unmount the component
      onIntersectionObserver.mockClear()
      wrapper.unmount()

      await nextTick()

      const newElement = document.createElement('div')
      const postUnmountEntry: IntersectionObserverEntry = {
        boundingClientRect: { x: 0, y: 0, width: 100, height: 100, top: 0, right: 100, bottom: 100, left: 0, toJSON: vi.fn() },
        intersectionRatio: 1,
        intersectionRect: { x: 0, y: 0, width: 100, height: 100, top: 0, right: 100, bottom: 100, left: 0, toJSON: vi.fn() },
        isIntersecting: true,
        rootBounds: null,
        target: newElement,
        time: 0,
      }

      intersectionObserverCallback?.([postUnmountEntry], {} as IntersectionObserver)
      await nextTick()

      // Expect no new calls to onIntersectionObserver after unmount
      expect(onIntersectionObserver).toBeCalledTimes(0)
    })
  })
})
