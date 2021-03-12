<template>
  <dropdown>
    <button class="btn-sm role-multi-action"><k-icon type="ellipsis" direction="down" color="var(--link-text)"></k-icon></button>
    <template #content>
      <div v-if="actions.length === 0"> No Actions </div>
      <dropdown-menu v-else class="credencial-actions__command">
          <dropdown-menu-item v-for="a in actions" :key="a.command" @click="handleCommand(a.command)">
            <!-- <k-icon :type="a.icon" color="var(--dropdown-text)"></k-icon> -->
            {{a.label}}
          </dropdown-menu-item>
        </dropdown-menu>
    </template>
  </dropdown>
</template>
<script>
import {computed, defineComponent} from 'vue'
import { cloneDeep } from '@/utils'
import {Dropdown, DropdownMenu, DropdownMenuItem} from '@/components/Dropdown'
import KIcon from '@/components/Icon'
export default defineComponent({
  props: {
    credential: {
      type: Object,
      required: true
    }
  },
  emits: ['exec-command'],
  setup(props, {emit}) {
    const actions = computed(() => {
      return [
        {
          label: 'Edit',
          icon: 'editor',
          command: 'edit',
        },
        {
          label: 'Delete',
          icon: 'ashbin',
          command: 'delete',
        },
      ]
    })
    const handleCommand = (command) => {
      emit('exec-command', {command, data: [cloneDeep(props.credential)]})
    }
    return {
      actions,
      handleCommand
    }
  },
  components: {
    Dropdown,
    DropdownMenu,
    DropdownMenuItem,
    KIcon,
  }
})
</script>
<style>
.credencial-actions__command {
  min-width: 150px;
}
</style>