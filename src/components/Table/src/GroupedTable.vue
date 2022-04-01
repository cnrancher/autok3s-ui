<template>
  <div>
    <base-grouped-table
      :caption="caption"
      :showHeader="showHeader"
      :data="pageData"
      :groupBy="groupBy"
      :group-status="groupStatus"
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
      <template v-for="n in errorSlotNames" #[n]="props">
        <template v-if="$slots[n]">
          <slot :name="n" v-bind="props"></slot>
        </template>
      </template>
    </base-grouped-table>
    <pagination v-if="showPagination" :total="total" v-model:current-change="currentPage"></pagination>
  </div>
</template>
<script>
import BaseGroupedTable from './BaseGroupedTable.vue'
import Pagination from '@/components/Pagination'
import useDataOrder from '@/composables/useDataOrder.js'
import usePagination from '@/composables/usePagination.js'
import useDataGroup from '@/composables/useDataGroup.js'

import { toRefs, defineComponent, computed, watchEffect} from 'vue'

export default defineComponent({
  name: 'KGroupedTable',
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
    showPagination: {
      type: Boolean,
      default: true
    },
  },
  emits: ['selection-change'],
  setup(props, {emit}) {
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
    const {pageData, currentPage, total, pageCount } = usePagination(dataOrder)
    
    const tableData = computed(() => {
      if (props.showPagination) {
        return pageData.value
      }
      return dataOrder.value
    })

    const { groupField, dataGroup } = useDataGroup(tableData)
    watchEffect(() => {
      groupField.value = props.groupBy
    })
   
   const allTableData = computed(() => {
     if (['noData', 'noResults'].includes(data.value[0]?.group)) {
       return data.value
     }

     return [...dataGroup.value, ...errorGroups.value]
   })

    return {
      pageData: allTableData,
      currentPage,
      total,
      pageCount,
      groupStatus,
      onOrderChange,
      onSelectionChange,
      errorSlotNames,
    }
  },
  components: {
    BaseGroupedTable,
    Pagination,
  }
})
</script>
<style>
.k-table__group-label {
  @apply text-gray-400 capitalize;
}
</style>