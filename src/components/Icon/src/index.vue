<template>
  <i class="k-icon" :class="cssClass" :style="cssStyle"></i>
</template>
<script>
export default {
  name: 'KIcon',
}
</script>
<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: -1,
  },
  direction: {
    type: String,
    default: ''
  },
})
const cssClass = computed(() => {
  const c = [
    `k-icon-${props.type}`,
  ]
  if (props.direction) {
    c.push(`k-rotate-${props.direction}`)
  }
  return c
})
const cssStyle = computed(() => {
  const s = {}
  if (props.color) {
    s['background-color'] = props.color
  }
  if (props.size > 0) {
    s['font-size'] = `${props.size}px`
  }
  return s
})
</script>