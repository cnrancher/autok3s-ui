<script>
import {defineComponent, h, inject, computed} from 'vue'
import FieldOrder from './FieldOrder.vue'

export default defineComponent({
  name: 'TableHeader',
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
  display: flex;
  align-items: center;
  justify-content: center;
}
.k-table__header {
  padding: 8px 5px;
  font-weight: 400;
  border: 0;
}
.k-table__header-cell {
  display: flex;
  height: 28px;
  align-items: center;
}
.k-table__header-row {
  background-color: var(--sortable-table-header-bg);
  border-bottom: 1px solid var(--sortable-table-top-divider);
  text-align: left;
}
</style>
