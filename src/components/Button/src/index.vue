<template>
  <button :disabled="btnDisabled" class="btn">
    <k-icon v-if="loading" type="loading"></k-icon>
    <slot></slot>
  </button>
</template>
<script>
export default {
  name: 'KButton',
}
</script>
<script setup>
import { computed } from 'vue'
import KIcon from '@/components/Icon'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  }
})

const btnDisabled = computed(() => {
  return props.disabled || props.loading
})

</script>
