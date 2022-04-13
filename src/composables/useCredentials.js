import { fetchList } from '@/api/credential'
import { onMounted } from 'vue'
import { reactive, toRefs } from 'vue'
import { stringify } from '@/utils/error.js'

export default function useCredentials() {
  const state = reactive({
    credentials: [],
    error: '',
    loading: false
  })
  const fetchCredentials = async () => {
    state.loading = true
    state.error = ''
    try {
      const { data } = await fetchList()
      state.credentials = data.filter((d) => Object.values(d.secrets).every((d) => d))
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  onMounted(() => {
    fetchCredentials()
  })
  return {
    ...toRefs(state),
    fetchCredentials
  }
}
