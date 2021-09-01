<script>
import {computed, h, toRef, defineComponent, inject} from 'vue'
export default defineComponent({
  name: 'KTableBody',
  props: {
    // columns: {
    //   type: Array,
    //   required: true,
    // },
    group: {
      type: String,
      default: ''
    },
    groupBy: {
      type: String,
      default: ''
    },
    data: {
      type: Array,
      required: true
    },
    groupSlot: {
      type: Function,
    }
  },
  emits: ['rowClick', 'cellClick', 'select'],
  setup(props, context) {
    const dataStore = inject('dataStore')
    const columnStore = inject('columnStore')
    const tableEmit = inject('tableEmit')
    const data = toRef(props, 'data')
    const group = toRef(props, 'group')
    const groupBy = toRef(props, 'groupBy')
    const groupSlot = toRef(props, 'groupSlot')
    const columns = columnStore.state.columns
    const selection = dataStore.state.selection
    const {removeSelection, addSelection } = dataStore.action

    const hasSelection = computed(() => {
      return columns.some((c) => c.type === 'selection')
    })
    const hasGroup = computed(() => {
      return !!groupBy.value
    })
    const onRowClick = (row, event) => {
      tableEmit('row-click', row, event)
    }
    const onCellClick = (row, col, event) => {
      if (col.type !== 'action' && hasSelection.value) {
        if (selection.has(row.id)) {
          removeSelection(row.id)
        } else {
          addSelection(row.id)
          tableEmit('select', row)
        }
      }
      tableEmit('cell-click', row, col, event)
    }
    
    const renderCell= (rowData, col) => {
      if (col.type === 'selection') {
        return h('div',
          {
            class: 'k-table__selection',
          },
          [
            h('input', 
              {
                type: 'checkbox',
                onChange(e){
                  if (e.target.checked) {
                    addSelection(rowData.id)
                  } else {
                    removeSelection(rowData.id)
                  }
                },
                checked: selection.has(rowData.id)
              }
            ),
          ]
        )
      }
      return h('div',
        {
          class: 'k-table-cell'
        },
        col.renderRowCell({row: rowData, column: col})
      )
    }
    const renderRow = (rowData, cols) => {
      return h('tr',
        {
          key: `row_${rowData.id}`,
          onClick: (event) => onRowClick(rowData, event),
          class: selection.has(rowData.id) ? 'k-table__row-selected':''
        },
        cols.map((c) => h('td',
          {
            key: `row_${rowData.id}_col_${c.id}_field_${c.field}`,
            onClick: (event) => onCellClick(rowData, c, event),
            class: c.field === 'action' || c.type === 'action' ? 'k-table__action' : ''
          },
          [ renderCell(rowData, c) ]
        ))
      )
    }
    const renderGroupRow = (group, cols) => {
      const groupColumn = cols.find((c) => c.field === groupBy.value)
      return h('tr',
        {
          key: `row-group_${group}`,
          class: 'k-table__row-group'
        },
        [
          h('td',
            {
              colspan: cols.length - 1
            },
            h('div',
              {
                class: 'k-table__group-tab'
              },
              groupSlot.value({groupColumn, group})
            )
          )
        ]
      )
    }
    const renderRows = (data, cols) => {
      if (hasGroup.value) {
        return [
          renderGroupRow(group.value, cols),
          ...data.map((d) => renderRow(d, cols.filter((c) => c.field !== groupBy.value)))
        ]
      }
      return data.map((d) => renderRow(d, cols))
    }
    const tbodyClass = computed(() => {
      if(hasGroup.value) {
        return ['k-table__body k-table__group']
      }
      return ['k-table__body']
    })
    return () => h(
      'tbody',
      {
        class: tbodyClass.value
      },
      renderRows(data.value, columns)
    )
  }
})
</script>
<style>
.k-table__body {
  & > tr {
    @apply border-b border-gray-300 bg-white;
  }
  & > tr.k-table__row-selected {
    @apply bg-gray-200;
  }
  & > tr:last-of-type {
    @apply border-b-0;
  }
  & > tr:not(.k-table__row-selected,.k-table__row-group):hover {
    @apply bg-gray-200;
  }
  & td {
    @apply py-8px px-5px;
  }
  & > tr.k-table__row-group {
    background-color: initial;
    border-bottom: 0;
    & > td:first-of-type {
      @apply p-0;
    }
  }
 
  & .k-table__group-tab {
    @apply h-40px leading-40px py-0 px-10px rounded-t bg-white relative inline-block min-w-72px z-0;
    &::after {
      @apply h-40px w-70px rounded-t-5px bg-white absolute;
      content: "";
      right: -15px;
      top: 0;
      transform: skewX(40deg);
      z-index: -1;
    }
  }
}
.k-table__selection {
  @apply flex items-center justify-center;
}

.k-table__group::before {
  @apply block h-20px bg-transparent;
  content: "";
}

</style>

