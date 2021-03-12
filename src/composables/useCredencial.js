import { fetchById } from '@/api/credential.js';
import {reactive, toRefs, watchEffect} from 'vue'
import {stringify} from '@/utils/error.js'

export default function useCluster (credentialId) {
  const state = reactive({
    credential: null,
    error: '',
    loading: false,
  })
  const fetchCredential = async () => {
    state.loading = true
    state.error = ''
    try {
      const data = await fetchById(credentialId.value)
      state.credential = data
    } catch (err) {
      state.error = stringify(err)
    }
    state.loading = false
  }
  watchEffect(() => {
    if (credentialId.value) {
      fetchCredential()
    }
  })
  return {
    ...toRefs(state),
    fetchCredential,
  }
}
