<template>
  <div ref="toggleRef" class="inline-block relative" :class="{'cursor-not-allowed': disabled}" v-on:[trigger]="toggleDropDown">
    <slot></slot>
    <teleport to="body" :disabled="!appendToBody">
      <div ref="contentRef" class="absolute z-$popper-z-index border rounded bg-white shadow min-w-160px" :class="{'block': show, 'hidden': !show}" v-if="!lazy || show">
        <slot name="content"></slot>
      </div>
    </teleport>
  </div>
</template>
<script>
import usePopper from '@/composables/usePopper.js'
import { onClickOutside } from '@vueuse/core'
import {ref, nextTick, watch, defineComponent} from 'vue'
export default defineComponent({
  name: 'KDropdown',
  props: {
    option: {
      type: Object,
      default() {
        return {
          placement: 'bottom-start'
        }
      }
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    appendToBody: {
      type: Boolean,
      default: true
    },
    trigger: {
      type: String,
      default: 'click'
    },
    lazy: {
      type: Boolean,
      default: true
    }
  },
  emits: ['visible-change'],
  setup(props, {emit}) {
    const toggleRef = ref(null)
    const contentRef = ref(null)
    const show = ref(false)
    const { create, remove, update } = usePopper(toggleRef, contentRef, props.option)
    const toggleDropDown = () => {
      if (props.disabled) {
        return
      }
      show.value = !show.value
    }
    const createPopper = () => {
      create()
      update()
    }
    onClickOutside(toggleRef, () => {
      show.value = false
    }, { event: 'click' })
    watch(show, () => {
      if (show.value) {
        nextTick(() => {
          createPopper()
        })
        emit('visible-change', true)
        return
      }
      remove()
      emit('visible-change', false)
    })

    return {
      toggleRef,
      contentRef,
      show,
      toggleDropDown,
    }
  }
})
</script>
