import {ref, computed} from 'vue'
import {orderBy} from 'lodash-es'

export default function useDataOrder(data) {
  const fields = ref([])
  const orders = ref([])

  const dataOrder = computed(() => {
    if (fields.value.length === 0 || orders.value.length === 0) {
      return data.value
    }
    return orderBy(data.value, fields.value, orders.value)
  })
  return {
    fields,
    orders,
    dataOrder,
  }
}