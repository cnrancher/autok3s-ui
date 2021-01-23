import { fetchNodes } from '@/api/cluster.js';
import {reactive, toRefs, watchEffect} from 'vue'
import {stringify} from '@/utils/error.js'

export default function useNodes (clusterId) {
  const state = reactive({
    clusterNodes: { nodes: [] },
    error: '',
    loading: false,
  })
  const fetchClusterNodes = async () => {
    state.loading = true
    state.error = ''
    try {
      const data = await fetchNodes(clusterId.value)
      state.clusterNodes = data
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  watchEffect(() => {
    if (clusterId.value) {
      fetchClusterNodes()
    }
  })
  return {
    ...toRefs(state),
    fetchClusterNodes,
  }
}
