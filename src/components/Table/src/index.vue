<template>
  <div>
    <base-table
      :caption="caption"
      :showHeader="showHeader"
      :data="tableData"
      :groupBy="groupBy"
      :state="state"
      @order-change="onOrderChange"
      @selection-change="onSelectionChange"
      >
      <template #default>
        <slot></slot>
      </template>
      <template #group="props" v-if="$slots.group">
        <slot name="group" v-bind="props">
        </slot>
      </template>
      <template #state-error v-if="$slots.error">
        <slot name="error">
        </slot>
      </template>
    </base-table>
    <pagination v-if="showPagination" :total="total" v-model:current-page="currentPage" :page-size="pageSize"></pagination>
  </div>
</template>
<script>
export default {
  name: 'KTable',
}
</script>
<script setup>
import BaseTable from './BaseTable.vue'
import Pagination from '@/components/Pagination'
import useDataOrder from '@/composables/useDataOrder.js'
import usePagination from '@/composables/usePagination.js'

import { toRefs, computed } from 'vue'

const props = defineProps({
  caption: {
    type: String,
    default: '',
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  data: {
    type: Array,
    required: true
  },
  groupBy: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: 'loaded' // loading, loaded, noResults, noData
  },
  showPagination: {
    type: Boolean,
    default: true
  },
})

const emit = defineEmits(['selection-change'])

const {data} = toRefs(props)
const {fields, orders, dataOrder} = useDataOrder(data)
const onOrderChange = (column, order) => {
  if (props.groupBy) {
    fields.value = [props.groupBy, column.field]
    orders.value = [order, order]
    return
  }
  fields.value = [column.field]
  orders.value = [order]
}
const onSelectionChange = (rows) => {
  emit('selection-change', rows)
}

const {pageData, currentPage, total, pageSize } = usePagination(dataOrder)

const tableData = computed(() => {
  if (props.showPagination) {
    return pageData.value
  }
  return dataOrder.value
})
</script>
<style>
.k-table__group-label {
  @apply text-gray-400 capitalize;
}
</style>