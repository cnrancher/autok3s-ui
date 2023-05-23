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
import useProviderClusterStores from '@/store/useProviderClusterStores.js'

const props = defineProps({
  feature: {
    type: Object,
    required: true
  }
})
const providerClusterStores = useProviderClusterStores()

const hasRunningCluster = computed(() => {
  return Object.values(providerClusterStores).filter(({ data }) => data.find((c) => c.status === 'Running')).length > 0
})

const emit = defineEmits(['exec-command'])

const actions = computed(() => {
  if (hasRunningCluster.value) {
    if (props.feature.value === 'true') {
      return [
        {
          label: 'Deactivate',
          icon: 'editor',
          command: 'deactivate'
        }
      ]
    } else {
      return [
        {
          label: 'Active',
          icon: 'editor',
          command: 'active'
        }
      ]
    }
  }

  if (props.feature.value === 'true') {
    return [
      {
        label: 'Deactivate',
        icon: 'editor',
        command: 'deactivate'
      }
    ]
  }
  return []
})
const handleCommand = (command) => {
  emit('exec-command', { command, data: [cloneDeep(props.feature)] })
}
</script>
