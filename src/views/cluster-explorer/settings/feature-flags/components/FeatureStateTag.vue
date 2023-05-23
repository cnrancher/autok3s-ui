<template>
  <k-tag :type="type" class="capitalize text-sm">
    {{ status }}
  </k-tag>
</template>
<script setup>
import { computed } from 'vue'

const states = {
  active: { color: 'success' },
  disabled: { color: 'disabled' }
}

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const type = computed(() => {
  return states[props.status?.toLowerCase()]?.color ?? 'warning'
})
</script>
