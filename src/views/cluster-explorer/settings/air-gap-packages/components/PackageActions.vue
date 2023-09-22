<template>
  <KDropdown :offset="false" :min-width="160">
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
  package: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['exec-command'])

const actions = computed(() => {
  const actions = [
    {
      label: 'Delete',
      icon: 'ashbin',
      command: 'delete'
    },
    {
      label: 'Edit',
      icon: 'editor',
      command: 'edit'
    }
  ]

  if (props.package?.links?.export && props.package.state === 'Active') {
    actions.push({
      label: 'Export',
      icon: 'editor',
      command: 'export'
    })
  }

  if (props.package?.actions?.cancel && props.package.state === 'Downloading') {
    actions.push({
      label: 'Cancel',
      icon: 'editor',
      command: 'cancelDownload'
    })
  }

  if (props.package?.actions?.download && props.package.state === 'OutOfSync') {
    actions.push({
      label: 'Download',
      icon: 'download',
      command: 'download'
    })
  }

  return actions
})
const handleCommand = (command) => {
  emit('exec-command', { command, data: [cloneDeep(props.package)] })
}
</script>
