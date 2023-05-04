<template>
  <div class="cluster-bulk-action">
    <k-button :disabled="deleteDisabled" class="role-primary" @click="handleBulkDelete">Delete</k-button>
  </div>
</template>
<script setup>
import { cloneDeep } from '@/utils'
import { computed } from 'vue'

const props = defineProps({
  clusters: {
    type: Array,
    required: true
  }
})
const emit = defineEmits(['exec-command'])

const deleteDisabled = computed(() => {
  return props.clusters.length === 0
})
const handleBulkDelete = () => {
  emit('exec-command', { command: 'delete', data: cloneDeep(props.clusters) })
}
</script>
