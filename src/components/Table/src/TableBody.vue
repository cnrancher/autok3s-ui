<script>
import {computed, h, toRef, defineComponent, inject} from 'vue'
export default defineComponent({
  name: 'TableBody',
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
    border-bottom: 1px solid var(--sortable-table-top-divider);
    background-color: var(--body-bg);
  }
  & > tr.k-table__row-selected {
    background-color: var(--sortable-table-selected-bg) ;
  }
  & > tr:last-of-type {
    border-bottom: 0;
  }
  & td {
    padding: 12px 5px;
    border: 0;
  }
  & > tr.k-table__row-group {
    background-color: initial;
    border-bottom: 0;
    & > td:first-of-type {
      border-left: 1px solid var(--sortable-table-accent-bg);
      padding: 0px;
    }
  }
 
  & .k-table__group-tab {
    height: 40px;
    line-height: 40px;
    padding: 0 10px;
    border-radius: 4px 4px 0 0;
    background-color: var(--body-bg);
    position: relative;
    display: inline-block;
    min-width: 72px;
    z-index: 0;
    &::after {
      height: 40px;
      width: 70px;
      border-radius: 5px 5px 0 0;
      background-color: var(--body-bg);
      content: "";
      position: absolute;
      right: -15px;
      top: 0;
      transform: skewX(40deg );
      z-index: -1;
    }
  }
}
.k-table__selection {
  display: flex;
  align-items: center;
  justify-content: center;
}

.k-table__group::before {
  content: "";
  display: block;
  height: 20px;
  background-color: transparent;
}

</style>

