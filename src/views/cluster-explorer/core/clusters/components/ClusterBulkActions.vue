<template>
  <div class="cluster-bulk-action">
    <k-button
      :disabled="deleteDisabled"
      class="role-primary"
      @click="handleBulkDelete">
      Delete
    </k-button>
  </div>
</template>
<script>
import { cloneDeep } from '@/utils'
import { computed } from 'vue'
export default {
  props: {
    clusters: {
      type: Array,
      required: true
    }
  },
  emits: ['exec-command'],
  setup(props, {emit}) {
    const deleteDisabled = computed(() => {
      return props.clusters.length === 0
    })
    const handleBulkDelete = () => {
      emit('exec-command', {command: 'delete', data: cloneDeep(props.clusters)})
    }
    return {
      deleteDisabled,
      handleBulkDelete
    }
  },
}
</script>