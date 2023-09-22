<template>
  <k-dropdown :offset="false" :min-width="160">
    <button class="btn btn-xs role-tertiary"><k-icon type="ellipsis" :size="16" direction="down"></k-icon></button>
    <template #content>
      <div v-if="actions.length === 0">No Actions</div>
      <k-dropdown-menu v-else>
        <k-dropdown-menu-item v-for="a in actions" :key="a.command" @click="handleCommand(a.command)">
          <!-- <k-icon :type="a.icon" color="var(--dropdown-text)"></k-icon> -->
          {{ a.label }}
        </k-dropdown-menu-item>
      </k-dropdown-menu>
    </template>
  </k-dropdown>
</template>
<script>
import { cloneDeep } from '@/utils'

import { computed } from 'vue'
export default {
  props: {
    template: {
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
        {
          label: 'Create Cluster',
          icon: 'editor',
          command: 'createCluster'
        },
        {
          label: 'Clone',
          icon: 'clone',
          command: 'clone'
        },
        {
          label: 'Edit',
          icon: 'editor',
          command: 'edit'
        }
      ]
      if (props.template['status']) {
        actions.splice(1, 1)
      }
      if (props.template['is-default']) {
        actions.push({
          label: 'UnSet Default',
          icon: 'favorites',
          command: 'unsetDefault'
        })
      } else {
        actions.push({
          label: 'Set Default',
          icon: 'favorites-fill',
          command: 'setDefault'
        })
      }

      return actions
    })
    const handleCommand = (command) => {
      emit('exec-command', { command, data: [cloneDeep(props.template)] })
    }
    return {
      actions,
      handleCommand
    }
  }
}
</script>
