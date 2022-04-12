<template>
  <div>
    <base-grouped-table
      :caption="caption"
      :show-header="showHeader"
      :data="allTableData"
      :group-by="groupBy"
      :group-status="groupStatus"
      @order-change="onOrderChange"
      @selection-change="onSelectionChange"
      >
      <template #default>
        <slot></slot>
      </template>
      <template v-if="$slots.group" #group="p">
        <slot name="group" v-bind="p">
        </slot>
      </template>
      <template v-for="n in errorSlotNames" #[n]="p">
        <template v-if="$slots[n]">
          <slot :name="n" v-bind="p"></slot>
        </template>
      </template>
    </base-grouped-table>
    <pagination v-if="showPagination" v-model:current-page="currentPage" :total="total" :page-size="pageSize"></pagination>
  </div>
</template>
<script>
export default {
  name: 'KGroupedTable', 
}
</script>
<script setup>
import BaseGroupedTable from './BaseGroupedTable.vue'
import Pagination from '@/components/Pagination'
import useDataOrder from '@/composables/useDataOrder.js'
import usePagination from '@/composables/usePagination.js'
import useDataGroup from '@/composables/useDataGroup.js'

import { toRefs, computed, watch } from 'vue'

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
  showPagination: {
    type: Boolean,
    default: true
  },
})

const emit = defineEmits(['selection-change'])
const {data} = toRefs(props)
const groupStatus = computed(() => {
  return data.value.reduce((t, c) => {
    t[c.group] = Object.entries(c).filter(([k]) => k !== 'children').reduce((s, [k, v]) => {
      s[k] = v

      return s
    },{})

    return t
  }, {
    loading: {
      state: 'loading',
    },
    noData: {
      state: 'noData'
    },
    noResults: {
      state: 'noResults'
    }
  })
})
const loadedGroups = computed(() => {
  return data.value.filter((g) => g.state === 'loaded' && !g.error)
})

const loadedData = computed(() => {
  return loadedGroups.value.reduce((t, c) => {
    t.push(...c.children)

    return t
  }, [])
})

const errorGroups = computed(() => {
  return data.value.filter((g) => g.state === 'error' && g.error)
})

const {fields, orders, dataOrder} = useDataOrder(loadedData)

const errorSlotNames = ['loading', 'loaded', 'noResults', 'noData', 'error']

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

const { groupField, dataGroup } = useDataGroup(tableData)
watch(() => props.groupBy ,(groupBy) => {
  groupField.value = groupBy
}, {
  immediate: true
})

const allTableData = computed(() => {
  if (['noData', 'noResults', 'loading'].includes(data.value[0]?.group)) {

    return data.value
  }

  return [...dataGroup.value, ...errorGroups.value]
})
</script>

<style>
.k-table__group-label {
  @apply text-gray-400 capitalize;
}
</style>