import { fetchList } from '@/api/package.js'
import { onMounted } from 'vue'
import { reactive, toRefs } from 'vue'
import { stringify } from '@/utils/error.js'

export default function usePackages() {
  const state = reactive({
    packages: [],
    error: '',
    loading: false
  })
  const fetchPackages = async () => {
    state.loading = true
    state.error = ''
    try {
      const { data } = await fetchList()
      state.packages = data
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  onMounted(() => {
    fetchPackages()
  })
  return {
    ...toRefs(state),
    fetchPackages
  }
}
