<template>
  <KDropdown>
    <button class="btn btn-xs role-tertiary"><k-icon type="ellipsis" :size="16" direction="down"></k-icon></button>
    <template #content>
      <div v-if="actions.length === 0">No Actions</div>
      <KDropdownMenu v-else>
        <KDropdownMenu-item v-for="a in actions" :key="a.command" @click="handleCommand(a.command)">
          {{ a.label }}
        </KDropdownMenu-item>
      </KDropdownMenu>
    </template>
  </KDropdown>
</template>
<script setup>
import { cloneDeep } from '@/utils'
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['exec-command'])

const actions = computed(() => {
  return [
    {
      label: 'Clone',
      icon: 'editor',
      command: 'clone'
    },
    {
      label: 'Edit',
      icon: 'editor',
      command: 'edit'
    },
    {
      label: 'Delete',
      icon: 'editor',
      command: 'delete'
    }
  ]
})
const handleCommand = (command) => {
  emit('exec-command', { command, data: [cloneDeep(props.value)] })
}
</script>
