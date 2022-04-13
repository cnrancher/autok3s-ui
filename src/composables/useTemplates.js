import { fetchList } from '@/api/template.js'
import { onMounted } from 'vue'
import { reactive, toRefs } from 'vue'
import { stringify } from '@/utils/error.js'

export default function useCredentials() {
  const state = reactive({
    templates: [],
    error: '',
    loading: false
  })
  const fetchTemplates = async () => {
    state.loading = true
    state.error = ''
    try {
      const { data } = await fetchList()
      state.templates = data
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  onMounted(() => {
    fetchTemplates()
  })
  return {
    ...toRefs(state),
    fetchTemplates
  }
}
