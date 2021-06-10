<template>
  <div>
    <base-table
      :caption="caption"
      :showHeader="showHeader"
      :data="pageData"
      :groupBy="groupBy"
      :state="state"
      @order-change="onOrderChange"
      @selection-change="onSelectionChange"
      >
      <template #default>
        <slot></slot>
      </template>
      <template #group="props" v-if="slots.group">
        <slot name="group" v-bind="props">
          <span class="k-table__group-label">{{props.groupColumn.label}}: </span><span>{{props.group}}</span>
        </slot>
      </template>
      <template #state-error v-if="slots.error">
        <slot name="error">
        </slot>
      </template>
    </base-table>
    <pagination v-if="showPagination" :total="total" v-model:current-change="currentPage"></pagination>
  </div>
</template>
<script>
import BaseTable from './BaseTable.vue'
import Pagination from '@/components/Pagination'
import useDataOrder from '@/composables/useDataOrder.js'
import usePagination from '@/composables/usePagination.js'

import { toRefs, defineComponent} from 'vue'

export default defineComponent({
  name: 'KTable',
  props: {
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
  },
  emits: ['selection-change'],
  setup(props, {emit, slots}) {
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
    if (props.showPagination) {
      const {pageData, currentPage, total, pageCount } = usePagination(dataOrder)
      return {
        pageData,
        currentPage,
        total,
        pageCount,
        onOrderChange,
        onSelectionChange,
        slots,
      }
    }

    return {
      pageData: dataOrder,
      onOrderChange,
      onSelectionChange,
      slots,
    }
  },
  components: {
    BaseTable,
    Pagination,
  }
})
</script>
<style>
.k-table__group-label {
  color: var(--sortable-table-group-label);
}
</style>