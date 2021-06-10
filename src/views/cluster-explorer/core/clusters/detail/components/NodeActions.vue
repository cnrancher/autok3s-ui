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
    node: {
      type: Object,
      required: true
    },
    cluster: {
      type: Object,
      required: true,
    },
  },
  emits: ['exec-command'],
  setup(props, {emit}) {
    const actions = computed(() => {
      if (props.node['instance-status']?.toLowerCase() === 'running') {
        return [
          {
            label: 'Execute Shell',
            icon: 'terminal',
            command: 'exec-shell',
          },
        ]
      }
      return []
    })
    const handleCommand = (command) => {
      emit('exec-command', {command, node: cloneDeep(props.node), cluster: cloneDeep(props.cluster)})
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