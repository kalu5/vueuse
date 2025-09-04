import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { vElementBounding } from './directive'

const App = defineComponent({
  props: {
    onBounding: {
      type: Function,
      required: true,
    },
    options: {
      type: Object,
      required: false,
    },
  },

  template: `<template>
  <div v-if="options" v-element-bounding="[onBounding,options]">Hello world!</div>
  <div v-else v-element-bounding="onBounding">Hello world!</div>
  </template>
  `,
})

describe('vElementBounding', () => {
  let onBounding = vi.fn()
  let wrapper: VueWrapper<any>

  describe('given no options', () => {
    beforeEach(() => {
      onBounding = vi.fn()
      wrapper = mount(App, {
        props: {
          onBounding,
        },
        global: {
          directives: {
            ElementBounding: vElementBounding,
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
      onBounding = vi.fn()
      const options = {
        reset: true,
        windowResize: true,
        windowScroll: true,
        immediate: true,
        updateTiming: 'sync',
      }

      wrapper = mount(App, {
        props: {
          onBounding,
          options,
        },
        global: {
          directives: {
            ElementBounding: vElementBounding,
          },
        },
      })
    })

    it('should be defined', () => {
      expect(wrapper).toBeDefined()
    })
  })

  describe('cleaning directives when components are unmounted', () => {
    onBounding = vi.fn()
    beforeEach(() => {
      onBounding = vi.fn()
      wrapper = mount(App, {
        props: {
          onBounding,
        },
        global: {
          directives: {
            ElementBounding: vElementBounding,
          },
        },
      })
    })

    // Mock ResizeObserver
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    const mockGetBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 50,
      top: 0,
      right: 100,
      bottom: 50,
      left: 0,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }))

    it('should be defined', () => {
      expect(wrapper).toBeDefined()
    })

    it('should call callback when element width change', async () => {
      await nextTick()
      HTMLElement.prototype.getBoundingClientRect = mockGetBoundingClientRect
      const element = wrapper.element.querySelector('div')
      if (element) {
        element.style.width = '200px'

        mockGetBoundingClientRect.mockReturnValue({
          width: 200,
          height: 50,
          top: 0,
          right: 200,
          bottom: 50,
          left: 0,
          x: 0,
          y: 0,
          toJSON: vi.fn(),
        })

        // Manually trigger resize event
        window.dispatchEvent(new Event('resize'))

        await nextTick()
        await nextTick()
      }

      expect(onBounding).toBeCalledTimes(1)

      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    })

    it('should not call callback after component is unmounted', async () => {
      await nextTick()

      HTMLElement.prototype.getBoundingClientRect = mockGetBoundingClientRect

      const element = wrapper.element.querySelector('div')
      if (element) {
        element.style.width = '200px'
        mockGetBoundingClientRect.mockReturnValue({
          width: 200,
          height: 50,
          top: 0,
          right: 200,
          bottom: 50,
          left: 0,
          x: 0,
          y: 0,
          toJSON: vi.fn(),
        })
        window.dispatchEvent(new Event('resize'))
        await nextTick()

        // Clean up before unmount
        onBounding.mockClear()

        // Unmount the component
        wrapper.unmount()
        await nextTick()

        if (element) {
          element.style.width = '300px'
          mockGetBoundingClientRect.mockReturnValue({
            width: 300,
            height: 50,
            top: 0,
            right: 300,
            bottom: 50,
            left: 0,
            x: 0,
            y: 0,
            toJSON: vi.fn(),
          })
          window.dispatchEvent(new Event('resize'))
          await nextTick()
          await nextTick()
        }

        expect(onBounding).toBeCalledTimes(0)
      }

      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    })
  })
})
