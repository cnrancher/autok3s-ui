<template>
  <k-dropdown :offset="null" :min-width="160">
    <button class="btn btn-xs role-tertiary"><k-icon type="ellipsis" direction="down"></k-icon></button>
    <template #content>
      <div v-if="actions.length === 0">No Actions</div>
      <k-dropdown-menu v-else>
        <k-dropdown-menu-item v-for="a in actions" :key="a.command" @click="handleCommand(a.command)">
          <!-- <k-icon :type="a.icon" color="var(--k-dropdown-text)"></k-icon> -->
          {{ a.label }}
        </k-dropdown-menu-item>
      </k-dropdown-menu>
    </template>
  </k-dropdown>
</template>
<script setup>
import { cloneDeep } from '@/utils'
import useExplorerStore from '@/store/useExplorerStore.js'
import { computed } from 'vue'

const props = defineProps({
  cluster: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['exec-command'])

const explorerStore = useExplorerStore()
const actions = computed(() => {
  const status = props.cluster.status?.toLowerCase()

  if (status === 'running') {
    const actions = [
      {
        label: 'Join Node',
        icon: 'editor',
        command: 'joinNode'
      },
      {
        label: 'Clone',
        icon: 'clone',
        command: 'clone'
      },
      {
        label: 'Save As Template',
        icon: 'clone',
        command: 'saveAsTemplate'
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

    const explorer = explorerStore.clusterExplorerMap[props.cluster.id]
    if (explorer?.links?.explorer) {
      actions.push({
        label: 'Disabe Explorer',
        icon: 'terminal',
        command: 'disableExplorer'
      })
    } else {
      actions.push({
        label: 'Enable Explorer',
        icon: 'terminal',
        command: 'enableExplorer'
      })
    }

    actions.push({
      label: 'Download KubeConfig',
      icon: 'terminal',
      command: 'downloadKubeConfig'
    })

    if (props.cluster.actions.upgrade && props.cluster.provider !== 'k3d') {
      actions.splice(1, 0, {
        label: 'Upgrade',
        icon: 'terminal',
        command: 'upgrade'
      })
    }

    return actions
  }
  if (['upgrading', 'creating'].includes(status)) {
    return [
      {
        label: 'Clone',
        icon: 'clone',
        command: 'clone'
      },
      {
        label: 'Save As Template',
        icon: 'clone',
        command: 'saveAsTemplate'
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

  if (['removing'].includes(status)) {
    return []
  }

  return [
    {
      label: 'Clone',
      icon: 'clone',
      command: 'clone'
    },
    {
      label: 'Save As Template',
      icon: 'clone',
      command: 'saveAsTemplate'
    },
    {
      label: 'Delete',
      icon: 'ashbin',
      command: 'delete'
    },
    {
      label: 'Back To Edit',
      icon: 'editor',
      command: 'edit'
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
  emit('exec-command', { command, data: [cloneDeep(props.cluster)] })
}
</script>
