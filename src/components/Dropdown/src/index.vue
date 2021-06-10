<template>
  <div ref="toggleRef" class="k-dropdown" :class="{'k-dropdown--disabled': disabled}" v-on:[trigger]="toggleDropDown">
    <slot></slot>
    <teleport to="body" :disabled="!appendToBody">
      <div ref="contentRef" class="k-dropdown__content" :class="{'k-dropdown--active': show}" v-if="!lazy || show">
        <slot name="content"></slot>
      </div>
    </teleport>
  </div>
</template>
<script>
import usePopper from '@/composables/usePopper.js'
import useClickOutside from '@/composables/useClickOutside.js'
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
  setup(props) {
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
    useClickOutside(toggleRef, () => {
      show.value = false
    })
    watch(show, () => {
      if (show.value) {
        nextTick(() => {
          createPopper()
        })
        return
      }
      remove()
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
<style>
.k-dropdown {
  display: inline-block;
}
.k-dropdown__content {
  display: none;
  position: absolute;
  background-color: var(--dropdown-bg);
  z-index: var(--popper-z-index);
  border: 1px solid var(--dropdown-border);
  border-radius: var(--border-radius);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  box-shadow: 0 5px 20px var(--shadow);
  min-width: 160px;
}
.k-dropdown--active {
  display: block;
}
.k-dropdown--disabled {
  cursor: not-allowed;
}

</style>
