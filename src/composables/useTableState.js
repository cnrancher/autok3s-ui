import {computed} from 'vue'

export default function useTableState(loading, error, rawData, queryResult) {

  const state = computed(() => {
    if (loading.value) {
      return 'loading'
    }
    if (error.value) {
      return 'error'
    }
    if (queryResult?.value?.length === 0 && rawData.value.length !== 0) {
      return 'noResults'
    }
    if (rawData.value.length === 0) {
      return 'noData'
    }
    return 'loaded'
  })
  return {
    state,
  }
}