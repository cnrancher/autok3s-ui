<template>
  <k-dropdown>
    <button class="btn-sm actions role-multi-action"><k-icon type="ellipsis" direction="down"></k-icon></button>
    <template #content>
      <div v-if="actions.length === 0">No Actions</div>
      <k-dropdown-menu v-else class="min-w-150px">
        <k-dropdown-menu-item v-for="a in actions" :key="a.command" @click="handleCommand(a.command)">
          <!-- <k-icon :type="a.icon" color="var(--dropdown-text)"></k-icon> -->
          {{ a.label }}
        </k-dropdown-menu-item>
      </k-dropdown-menu>
    </template>
  </k-dropdown>
</template>
<script>
import { computed, defineComponent } from 'vue'
import { cloneDeep } from '@/utils'
export default defineComponent({
  props: {
    credential: {
      type: Object,
      required: true
    }
  },
  emits: ['exec-command'],
  setup(props, { emit }) {
    const actions = computed(() => {
      return [
        {
          label: 'Edit',
          icon: 'editor',
          command: 'edit'
        },
        {
          label: 'Delete',
          icon: 'ashbin',
          command: 'delete'
        }
      ]
    })
    const handleCommand = (command) => {
      emit('exec-command', { command, data: [cloneDeep(props.credential)] })
    }
    return {
      actions,
      handleCommand
    }
  }
})
</script>
