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
<script>
import { cloneDeep } from '@/utils'

import { computed } from 'vue'
export default {
  props: {
    sshKey: {
      type: Object,
      required: true
    }
  },
  emits: ['exec-command'],
  setup(props, { emit }) {
    const actions = computed(() => {
      const actions = [
        {
          label: 'Delete',
          icon: 'ashbin',
          command: 'delete'
        },
        // {
        //   label: 'View',
        //   icon: 'editor',
        //   command: 'edit'
        // }
      ]

      if (props.sshKey?.actions?.export) {
        actions.push({
          label: 'Export',
          icon: 'editor',
          command: 'export'
        })
      }

      return actions
    })
    const handleCommand = (command) => {
      emit('exec-command', { command, data: [cloneDeep(props.sshKey)] })
    }
    return {
      actions,
      handleCommand
    }
  }
}
</script>
