<template>
  <div ref="trigger" class="inline-flex items-center" @mouseenter="show" @focus="show" @mouseleave="hide" @blur="hide">
    <slot></slot>
    <teleport to="body" :disabled="!appendToBody">
      <div
        v-if="!lazy || open"
        ref="floating"
        class="k-tooltip bg-gray-200 text-gray-800 rounded p-8px absolute max-w-80vw z-$tooltip-z-index"
        :class="[open ? 'block' : 'hidden']"
        :style="floatingStyles"
        @mouseenter="show"
        @focus="show"
        @mouseleave="hide"
        @blur="hide"
      >
        <slot name="popover"></slot>
        <div ref="floatingArrow" :style="arrowStyle" class="k-tooltip__arrow"></div>
      </div>
    </teleport>
  </div>
</template>
<script>
export default {
  name: 'KTooltip'
}
</script>
<script setup>
import { ref, watch } from 'vue'
import { offset, flip, shift, useFloating, autoUpdate, arrow } from '@floating-ui/vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
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
const floating = ref(null)
const open = ref(false)
let timer = null

const floatingArrow = ref(null)
const arrowStyle = ref({})
const middleware = ref([offset(10), flip(), shift(), arrow({ element: floatingArrow })])
const { floatingStyles, middlewareData, placement } = useFloating(trigger, floating, {
  placement: 'top',
  whileElementsMounted: autoUpdate,
  middleware
})
const arrowSideMap = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right'
}
watch(
  () => middlewareData.value.arrow,
  ({ x, y }) => {
    const staticSide = arrowSideMap[placement.value.split('-')[0]]
    arrowStyle.value = {
      left: x ? `${x}px` : '',
      top: y ? `${y}px` : '',
      right: '',
      bottom: '',
      [staticSide]: '-4px'
    }
  }
)

const removeTimer = () => {
  if (timer) {
    window.clearTimeout(timer)
    timer = null
  }
}
const show = () => {
  removeTimer()
  open.value = true
}

const close = () => {
  open.value = false
}

const hide = () => {
  removeTimer()
  if (props.delay <= 0) {
    close()
  } else {
    timer = setTimeout(close, props.delay)
  }
}
// const eventHandlers = [
//   ['mouseenter', show],
//   ['mouseleave', hide],
//   ['focus', show],
//   ['blur', hide]
// ]
// onMounted(() => {
//   eventHandlers.forEach(([event, listener]) => {
//     trigger.value.addEventListener(event, listener)
//     floating.value.addEventListener(event, listener)
//   })
// })
// onBeforeUnmount(() => {
//   eventHandlers.forEach(([event, listener]) => {
//     trigger.value.removeEventListener(event, listener)
//     floating.value.removeEventListener(event, listener)
//   })
// })
</script>
<style>
.k-tooltip__arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
  transform: rotate(45deg);
}
.k-tooltip a {
  @apply text-light-blue-500;
}
</style>
