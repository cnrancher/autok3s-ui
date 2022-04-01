<template>
  <a class="py-5px inline-flex items-center btn btn-xs role-tertiary" v-if="explorer?.links?.explorer" target="_blank" :href="`${explorer?.links?.explorer}`">
    <tooltip >
      Explorer
      <template #popover>Go to kube-explorer page</template>
    </tooltip>
  </a>
</template>
<script>
import { defineComponent, computed, inject } from 'vue'
import Tooltip from '@/components/Tooltip'
import useExplorerStore from '@/store/useExplorerStore.js'

export default defineComponent({
  name: 'ExplorerLink',
  props: {
    clusterId: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const explorerStore = useExplorerStore()

    const error = computed(() => explorerStore.error)
    const loading = computed(() => explorerStore.loading)
    const explorer = computed(() => {
      return explorerStore.data.find((e) => e.id === props.clusterId)
    })

    return {
      error,
      loading,
      explorer,
    }
  },
  components: {
    Tooltip,
  }
})
</script>
