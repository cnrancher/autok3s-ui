<template>
  <a
    v-if="explorer?.links?.explorer"
    class="py-5px inline-flex items-center btn btn-xs role-tertiary"
    target="_blank"
    :href="`${explorer?.links?.explorer}`"
  >
    <tooltip>
      Explorer
      <template #popover>Go to kube-explorer page</template>
    </tooltip>
  </a>
</template>
<script setup>
import { computed } from 'vue'
import Tooltip from '@/components/Tooltip'
import useExplorerStore from '@/store/useExplorerStore.js'

const props = defineProps({
  clusterId: {
    type: String,
    default: ''
  }
})

const explorerStore = useExplorerStore()

// const error = computed(() => explorerStore.error)
// const loading = computed(() => explorerStore.loading)
const explorer = computed(() => {
  return explorerStore.data.find((e) => e.id === props.clusterId)
})
</script>
