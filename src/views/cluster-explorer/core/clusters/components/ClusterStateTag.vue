<template>
  <k-tag :type="type" class="cluster-state-tag">
    {{status}}
  </k-tag>
</template>
<script>
import { computed } from 'vue'

const states = {
  'running': { color: 'success' },
  'ready': { color: 'success' },
  'failed': { color: 'error' },
  'unknown': { color: 'error' },
  'active': { color: 'success' },
  'removed': { color: 'warning' },
  'removed': { color: 'warning' },
  'removing': { color: 'warning' },
  'updating': { color: 'warning' },
}

export default {
  props: {
    status: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const type = computed(() => {
      return states[props.status.toLowerCase()]?.color ?? 'warning'
    })
    return {
      type
    }
  },
}
</script>
<style>
.cluster-state-tag {
  font-size: 0.85em;
  text-transform: capitalize;
}
</style>