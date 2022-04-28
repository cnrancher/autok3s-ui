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
        class="absolute z-$popper-z-index border rounded bg-white shadow min-w-160px max-h-50vh overflow-y-auto"
        :class="{ block: show, hidden: !show }"
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
import usePopper from '@/composables/usePopper.js'
import { onClickOutside } from '@vueuse/core'
import { ref, nextTick, watch } from 'vue'

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
  }
})

const emit = defineEmits(['visible-change'])

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
onClickOutside(
  toggleRef,
  () => {
    show.value = false
  },
  { event: 'click' }
)
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
</script>
