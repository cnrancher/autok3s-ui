import { fetchList } from '@/api/credential'
import { onMounted } from 'vue'
import { reactive, toRefs } from 'vue'
import { stringify } from '@/utils/error.js'

export default function useCredentials(provider) {
  const state = reactive({
    credentials: [],
    error: '',
    loading: false
  })
  const refetch = async () => {
    state.loading = true
    state.error = ''
    try {
      const { data } = await fetchList()
      state.credentials = data.filter((d) => d.provider === provider)
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  onMounted(() => {
    refetch()
  })
  return {
    ...toRefs(state),
    refetch
  }
}
