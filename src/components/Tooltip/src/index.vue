<template>
  <div class="inline-flex items-center" ref="trigger" @mouseenter="showTooltip" @focus="showTooltip" @mouseleave="hideTooltip" @blur="hideTooltip">
    <slot></slot>
    <teleport to="body" :disabled="!appendToBody">
       <div ref="popover"
        class="k-tooltip bg-gray-200 text-gray-800 rounded p-8px absolute max-w-80vw z-$tooltip-z-index"
        :class="[show ? 'block':'hidden']"
        @mouseenter="showTooltip" @focus="showTooltip"
        @mouseleave="hideTooltip" @blur="hideTooltip"
        v-if="!lazy || show">
         <slot name="popover"></slot>
         <div class="k-tooltip__arrow" data-popper-arrow></div>
      </div>
    </teleport>
  </div>
</template>
<script>
export default {
  name: 'KTooltip',
}
</script>
<script setup>
import {defineComponent, nextTick, onBeforeUnmount, ref, watch, defineProps} from 'vue'
import usePopper from '@/composables/usePopper.js'

const props = defineProps({
  option: {
    type: Object,
    default() {
      return {
        placement: 'top',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ],
      }
    }
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  appendToBody: {
    type: Boolean,
    default: false
  },
  lazy: {
    type: Boolean,
    default: true
  },
  delay: {
    type: Number,
    default: 500
  }
})

const trigger = ref(null)
const popover = ref(null)
const show = ref(false)
let timer = null
const {create, remove, update} = usePopper(trigger, popover, props.option)

const removeTimer = () => {
  if (timer) {
    window.clearTimeout(timer)
    timer = null
  }
}
const createTooltip = () => {
  create()
  update()
}

watch(show, () => {
  if (show.value) {
    nextTick(() => {
      createTooltip()
    })
    return
  }
  remove()
})
const showTooltip = () => {
  removeTimer()
  show.value = true
}
const hideTooltip = () => {
  removeTimer()
  if (props.delay <= 0) {
    show.value = false
  } else {
    timer = setTimeout(() => {
      show.value = false
    }, props.delay)
  }
}
</script>
<style>
.k-tooltip__arrow,
.k-tooltip__arrow::before {
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
}

.k-tooltip__arrow {
  visibility: hidden;
}

.k-tooltip__arrow::before {
  visibility: visible;
  content: '';
  transform: rotate(45deg);
}
.k-tooltip[data-popper-placement^='top'] > .k-tooltip__arrow {
  bottom: -4px;
}

.k-tooltip[data-popper-placement^='bottom'] > .k-tooltip__arrow {
  top: -4px;
}

.k-tooltip[data-popper-placement^='left'] > .k-tooltip__arrow {
  right: -4px;
}

.k-tooltip[data-popper-placement^='right'] > .k-tooltip__arrow {
  left: -4px;
}
</style>