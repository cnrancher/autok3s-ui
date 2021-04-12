<script>
import {defineComponent, inject, h, toRef, onBeforeUnmount, reactive, watch} from 'vue'
import useIdGenrator from '@/composables/useIdGenerator.js'

const {next: nextId, reset: resetId } = useIdGenrator()
const getFieldValue = (obj, field) => {
  return field.split('.')
    .reduce((o, i) => o?.[i], obj) ?? ''
}

const defaultRenderRowCell = (props) => h('span', {}, `${getFieldValue(props.row, props.column?.field)}`)
const defaultRenderHeaderCell = (props) => {
  return h('div', { }, [
    `${props.column?.label}`,
  ])
}

export default defineComponent({
  name: 'TableColumn',
  props: {
    label: {
      type: String,
      default: ''
    },
    field: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    order: {
      type: String,
      default: ''
    },
    sortable: {
      type: Boolean,
      default: false
    },
    width: {
      type: [String, Number],
      default: ''
    }
  },
  setup(props,context) {
    const columnStore = inject('columnStore')
    if (!columnStore) {
      console.warn('columnStore not provide')
      return
    }
    const fields = ['label', 'field', 'type', 'order', 'sortable', 'width']
    const column = reactive(fields.reduce((t, c) => {
      t[c] = props[c]
      return t
    }, {
      id: nextId(),
      renderRowCell: context.slots.default ?? defaultRenderRowCell,
      renderHeaderCell: context.slots.header ?? defaultRenderHeaderCell,
      }))
    columnStore.action.addColumn(column)

    onBeforeUnmount(() => {
      columnStore.action.removeColumn(column)
    })

    return () => h('div', fields.reduce((t, c) => {
      t[`data-${c ?? column.id}`] = column[c] ?? column.id
      return t
    }, { id: column.id }))
  },
})
</script>
<style>
.k-table-header {
  display: flex;
  align-items: center;
}

</style>

