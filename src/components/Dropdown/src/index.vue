<template>
  <div
    ref="toggleRef"
    class="inline-block relative"
    :class="{ 'cursor-not-allowed': disabled }"
    @[trigger]="toggleDropDown"
  >
    <slot></slot>
    <teleport to="body" :disabled="!appendToBody">
      <div
        v-if="!lazy || show"
        ref="contentRef"
        class="absolute z-$popper-z-index border-solid border-1 border-gray-500/20 rounded bg-white shadow min-w-160px max-h-50vh overflow-y-auto"
        :class="{ block: show, hidden: !show }"
        :style="floatingStyles"
      >
        <slot name="content"></slot>
      </div>
    </teleport>
  </div>
</template>
<script>
export default {
  name: 'KDropdown'
}
</script>
<script setup>
import { onClickOutside } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { offset, flip, shift, useFloating, autoUpdate, size } from '@floating-ui/vue'

const props = defineProps({
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
    default: false
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
  },
  offset: {
    type: [Object, Boolean],
    default() {
      return {
        mainAxis: 8,
        crossAxis: -9
      }
    }
  },
  minWidth: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['visible-change'])

const toggleRef = ref(null)
const contentRef = ref(null)
const show = ref(false)

const middleware = computed(() => {
  const minWidth = props.minWidth
  const m = [
    flip(),
    shift(),
    size({
      apply({ rects }) {
        Object.assign(contentRef.value.style, {
          minWidth: minWidth ? `${props.minWidth}px` : `${rects.reference.width + 18}px`
        })
      }
    })
  ]
  if (props.offset && props.offset !== true) {
    m.splice(0, 0, offset({ ...props.offset }))
  }
  return m
})

const { floatingStyles } = useFloating(toggleRef, contentRef, {
  ...props.option,
  whileElementsMounted: autoUpdate,
  middleware
})

const toggleDropDown = () => {
  if (props.disabled) {
    return
  }
  show.value = !show.value
}
onClickOutside(
  toggleRef,
  () => {
    show.value = false
  },
  { event: 'click' }
)
watch(show, () => {
  emit('visible-change', show.value)
})
defineExpose({ contentRef })
</script>
