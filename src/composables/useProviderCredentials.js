import { fetchList } from '@/api/credential'
import { unref, isRef, watch } from 'vue'
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
      const p = unref(provider)
      state.credentials = data.filter((d) => d.provider === p)
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  if (isRef(provider)) {
    watch(provider, () => refetch(), { immediate: true })
  } else {
    refetch()
  }
  return {
    ...toRefs(state),
    refetch
  }
}
