<template>
  <k-tag :type="type" class="capitalize text-sm">
    {{ status }}
  </k-tag>
</template>
<script setup>
import { computed } from 'vue'

const states = {
  running: { color: 'success' },
  ready: { color: 'success' },
  failed: { color: 'error' },
  unknown: { color: 'error' },
  active: { color: 'success' },
  removed: { color: 'warning' },
  removing: { color: 'warning' },
  updating: { color: 'warning' }
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
