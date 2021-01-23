<template>
  <dropdown>
    <button class="btn-sm role-multi-action"><k-icon type="ellipsis" direction="down" color="var(--link-text)"></k-icon></button>
    <template #content>
      <div v-if="actions.length === 0"> No Actions </div>
      <dropdown-menu v-else>
          <dropdown-menu-item v-for="a in actions" :key="a.command" @click="handleCommand(a.command)">
            <k-icon :type="a.icon" color="var(--dropdown-text)"></k-icon>{{a.label}}
          </dropdown-menu-item>
        </dropdown-menu>
    </template>
  </dropdown>
</template>
<script>
import { cloneDeep } from '@/utils'
import {Dropdown, DropdownMenu, DropdownMenuItem} from '@/components/Dropdown'
import KIcon from '@/components/Icon'

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
  components: {
    Dropdown,
    DropdownMenu,
    DropdownMenuItem,
    KIcon,
  }
}
</script>
<style>

</style>