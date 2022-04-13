import { fetchById } from '@/api/template.js'
import { reactive, toRefs, watchEffect } from 'vue'
import { stringify } from '@/utils/error.js'

export default function useCluster(templateId) {
  const state = reactive({
    template: null,
    error: '',
    loading: false
  })
  const fetchTemplate = async () => {
    state.loading = true
    state.error = ''
    try {
      const data = await fetchById(templateId.value)
      state.template = data
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  watchEffect(() => {
    if (templateId.value) {
      fetchTemplate()
    }
  })
  return {
    ...toRefs(state),
    fetchTemplate
  }
}
