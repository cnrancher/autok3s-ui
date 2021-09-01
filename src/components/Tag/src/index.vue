<template>
  <span class="bg-transparent inline-block px-10px rounded-20px border"
    :class="classes"
    :style="{ backgroundColor: color }">
    <slot></slot>
  </span>
</template>
<script>
import { computed, defineComponent } from 'vue'
export default defineComponent({
  name: 'KTag',
  props: {
    size: {
      type: String,
      default: 'mini'
    },
    color: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info'
    }
  },
  setup(props) {
    const classes = computed(() => {
      const {type, size} = props
      return [
        `k-tag--${type}`,
        size ? `k-tag--${size}`:''
      ]
    })
    return {
      classes
    }
  }
})
</script>
<style>
.k-tag--success {
  @apply border-emerald-500 text-emerald-500;
}
.k-tag--info {
  @apply border-light-blue-500 text-light-blue-500;
}
.k-tag--warning {
  @apply border-amber-500 text-amber-500;
}
.k-tag--error {
  @apply border-red-500 text-red-500;
}
</style>