<template>
  <a
    v-if="explorer?.links?.explorer"
    class="py-3px inline-flex items-center btn btn-xs role-tertiary"
    target="_blank"
    :href="`${explorer?.links?.explorer}`"
  >
    <tooltip>
      <img class="logo" :src="explorerLogo" />
      <template #popover>Go to kube-explorer page</template>
    </tooltip>
  </a>
</template>
<script setup>
import { computed } from 'vue'
import Tooltip from '@/components/Tooltip'
import useExplorerStore from '@/store/useExplorerStore.js'
import explorerLogo from '@/styles/images/brand/explorer-logo.svg'

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
<style scoped>
.logo {
  object-fit: contain;
  height: 18px;
}
</style>
