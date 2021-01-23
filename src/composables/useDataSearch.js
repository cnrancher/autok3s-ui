import {ref, computed} from 'vue'

const getFieldValue = (obj, field) => {
  return field.split('.')
    .reduce((o, i) => o?.[i], obj)
}
export default function useDataSearch(data) {
  const searchQuery = ref('')
  const searchFields = ref([])
  const dataMatchingSearchQuery = computed(() => {
    if (!searchQuery.value || searchFields.value.length === 0) {
      return data.value
    }
    return data.value.filter(item => searchFields.value.some(f => `${getFieldValue(item, f)}`.includes(searchQuery.value)))
  })
  return {
    searchQuery,
    searchFields,
    dataMatchingSearchQuery
  }
}