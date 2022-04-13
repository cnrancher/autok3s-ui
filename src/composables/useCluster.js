import { fetchById } from '@/api/cluster.js'
import { reactive, toRefs, watchEffect } from 'vue'
import { stringify } from '@/utils/error.js'

export default function useCluster(clusterId) {
  const state = reactive({
    cluster: null,
    error: '',
    loading: false
  })
  const fetchCluster = async () => {
    state.loading = true
    state.error = ''
    try {
      const data = await fetchById(clusterId.value)
      state.cluster = data
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  watchEffect(() => {
    if (clusterId.value) {
      fetchCluster()
    }
  })
  return {
    ...toRefs(state),
    fetchCluster
  }
}
