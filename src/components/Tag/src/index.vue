<template>
  <span class="k-tag"
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
.k-tag {
  background: transparent;
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  border: 1px solid transparent;
}
.k-tag--success {
  border-color: var(--success);
  color: var(--success);
}
.k-tag--info {
  border-color: var(--info);
  color: var(--info);
}
.k-tag--warning {
  border-color: var(--warning);
  color: var(--warning);
}
.k-tag--error {
  border-color: var(--error);
  color: var(--error);
}
</style>