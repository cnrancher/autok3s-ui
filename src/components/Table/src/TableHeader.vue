<script>
import {defineComponent, h, inject, computed} from 'vue'
import FieldOrder from './FieldOrder.vue'

export default defineComponent({
  name: 'KTableHeader',
  props: {
    groupBy: {
      type: String,
      default: ''
    },
  },
  emits: ['order-change'],
  setup(props) {
    const dataStore = inject('dataStore')
    const columnStore = inject('columnStore')
    const columns = columnStore.state.columns
    const {checkAll, clearSelection} = dataStore.action
    const isAllSelected = computed(() => {
      return dataStore.getter.isAllSelected
    })
    const indeterminate = computed(() => {
      return !dataStore.getter.isAllSelected && dataStore.getter.selectionSize > 0
    })
    const onChange = (e) => {
      if (e.target.checked) {
        return checkAll()
      }
      return clearSelection()
    }
    const renderHeaderCell = (column) => {
      if (column.type === 'selection') {
        return h('div',
        {
          class: 'k-table__header-selection'
        },
        [
          h('input',
            {
              type: 'checkbox',
              onChange,
              checked: isAllSelected.value,
              indeterminate: indeterminate.value
            }
          )
        ])
      }
      
      return h('div',
        {
          class: 'k-table__header-cell'
        },
        [
          column.renderHeaderCell({ column }),
          column?.sortable ? h(FieldOrder, { column, order: column?.order ?? '' }) : ''
        ]
      )
    }
    return () => h('thead', {},
    [
      h('tr',
        {
          class: 'k-table__header-row'
        },
        columns
          .filter((c) => props.groupBy ? c.field !== props.groupBy : true )
          .map((column) => h('th', { class: 'k-table__header' }, [ renderHeaderCell(column) ]))
      )
    ])
  }
})
</script>
<style>
.k-table__header-selection {
  @apply flex items-center justify-center;
}
.k-table__header {
  @apply py-8px px-5px border-0 bg-blue-gray-100 font-normal;
}
.k-table__header-cell {
  @apply flex h-28px items-center;
}
.k-table__header-row {
  @apply bg-transparent border-b text-left;
}
</style>
