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
export default defineComponent({
  name: 'ExplorerLink',
  props: {
    clusterId: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const explorerStore = inject('explorerStore')

    const error = computed(() => explorerStore.state.error)
    const loading = computed(() => explorerStore.state.loading)
    const explorer = computed(() => {
      return explorerStore.state.explorers.find((e) => e.id === props.clusterId)
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
