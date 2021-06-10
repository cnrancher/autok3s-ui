<template>
  <k-dropdown>
    <button class="btn-sm actions role-multi-action"><k-icon type="ellipsis" direction="down"></k-icon></button>
    <template #content>
      <div v-if="actions.length === 0"> No Actions </div>
      <k-dropdown-menu v-else>
          <k-dropdown-menu-item v-for="a in actions" :key="a.command" @click="handleCommand(a.command)">
            <!-- <k-icon :type="a.icon" color="var(--k-dropdown-text)"></k-icon> -->
            {{a.label}}
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
    cluster: {
      type: Object,
      required: true
    }
  },
  emits: ['exec-command'],
  setup(props, {emit}) {
    const actions = computed(() => {
      if (props.cluster.status?.toLowerCase() === 'running') {
        return [
          {
            label: 'Join Node',
            icon: 'editor',
            command: 'joinNode',
          },
          {
            label: 'Clone',
            icon: 'clone',
            command: 'clone',
          },
          {
            label: 'Save As Template',
            icon: 'clone',
            command: 'saveAsTemplate',
          },
          {
            label: 'Delete',
            icon: 'ashbin',
            command: 'delete'
          },
          {
            label: 'View Logs',
            icon: 'log',
            command: 'viewLog'
          },
          {
            label: 'Generate CLI Command',
            icon: 'terminal',
            command: 'generateCliCommand'
          }
        ]
      }
      if (['upgrading', 'creating'].includes(props.cluster.status?.toLowerCase())) {
        return [
          {
            label: 'Clone',
            icon: 'clone',
            command: 'clone',
          },
          {
            label: 'Save As Template',
            icon: 'clone',
            command: 'saveAsTemplate',
          },
          {
            label: 'Delete',
            icon: 'ashbin',
            command: 'delete'
          },
          {
            label: 'View Logs',
            icon: 'log',
            command: 'viewLog'
          },
          {
            label: 'Generate CLI Command',
            icon: 'terminal',
            command: 'generateCliCommand'
          }
        ]
      }
      return [
        {
          label: 'Clone',
          icon: 'clone',
          command: 'clone',
        },
        {
          label: 'Save As Template',
          icon: 'clone',
          command: 'saveAsTemplate',
        },
        {
          label: 'Delete',
          icon: 'ashbin',
          command: 'delete'
        },
        {
          label: 'Back To Edit',
          icon: 'editor',
          command: 'edit',
        },
        {
          label: 'View Logs',
          icon: 'log',
          command: 'viewLog'
        },
        {
          label: 'Generate CLI Command',
          icon: 'terminal',
          command: 'generateCliCommand'
        }
      ]
    })
    const handleCommand = (command) => {
      emit('exec-command', {command, data: [cloneDeep(props.cluster)]})
    }

    return {
      actions,
      handleCommand,
    }
  },
}
</script>
<style>

</style>