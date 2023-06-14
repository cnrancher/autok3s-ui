<template>
  <div class="cluster-bulk-action">
    <k-button :disabled="deleteDisabled" class="role-primary" @click="handleBulkDelete">Delete</k-button>
  </div>
</template>
<script>
import { cloneDeep } from '@/utils'
import { computed } from 'vue'
export default {
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  emits: ['exec-command'],
  setup(props, { emit }) {
    const deleteDisabled = computed(() => {
      return props.data.length === 0
    })
    const handleBulkDelete = () => {
      emit('exec-command', { command: 'delete', data: cloneDeep(props.data) })
    }
    return {
      deleteDisabled,
      handleBulkDelete
    }
  }
}
</script>
