import { fetchList } from '@/api/provider'
import {onMounted, reactive, toRefs} from 'vue'
import {stringify} from '@/utils/error.js'

export default function useProviders () {
  const state = reactive({
    providers: [],
    error: '',
    loading: false,
  })
  const enCollator = new Intl.Collator('en')
  const fetchProviders = async () => {
    state.loading = true
    state.error = ''
    try {
      const {data} = await fetchList()
      state.providers = data.sort((a, b) => enCollator.compare(a.id, b.id))
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  fetchProviders()

  return {
    ...toRefs(state),
    fetchProviders,
  }
}
