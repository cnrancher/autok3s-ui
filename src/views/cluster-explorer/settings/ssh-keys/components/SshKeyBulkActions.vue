<template>
  <div>
    <k-button :disabled="deleteDisabled" class="role-primary" @click="handleBulkDelete">Delete</k-button>
  </div>
</template>
<script>
import { cloneDeep } from '@/utils'
import { computed } from 'vue'
export default {
  props: {
    packages: {
      type: Array,
      required: true
    }
  },
  emits: ['exec-command'],
  setup(props, { emit }) {
    const deleteDisabled = computed(() => {
      return props.packages.length === 0
    })
    const handleBulkDelete = () => {
      emit('exec-command', { command: 'delete', data: cloneDeep(props.packages) })
    }
    return {
      deleteDisabled,
      handleBulkDelete
    }
  }
}
</script>
