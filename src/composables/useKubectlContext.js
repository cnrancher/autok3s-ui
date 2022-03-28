import { fetchContextList } from '@/api/cluster.js';
import { toRefs, reactive } from 'vue';
import {stringify} from '@/utils/error.js'

export default function useKubectlContext() {
  const state = reactive({
    contexts: [],
    error: '',
    loading: true,
  })
  const enCollator = new Intl.Collator('en')
  const fetchContexts = async () => {
    state.loading = true
    state.error = ''
    try {
      const { data } = await fetchContextList()
      state.contexts = data.sort((a, b) => enCollator.compare(a.id, b.id))
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }

  return {
    ...toRefs(state),
    fetchContexts,
  }
}