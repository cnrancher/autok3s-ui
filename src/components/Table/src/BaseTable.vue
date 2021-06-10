<template>
  <div>
    <div style="display: none;">
      <slot></slot>
    </div>
    <table class="k-table">
      <caption v-if="caption">{{caption}}</caption>
      <colgroup>
        <template v-for="c in columns" :key="c.id">
          <col :style="getColStyle(c)">
        </template>
      </colgroup>
      <table-header v-show="showHeader" :groupBy="groupBy"></table-header>
      <template v-if="state === 'loaded'">
        <table-body v-for="g in dataGroup" :key="g" :data="g.children" :group="g.group" :group-by="groupBy" :group-slot="groupSlot"></table-body>
      </template>
      <tbody v-else :class="currentStatusClass">
        <tr>
          <td :colspan="columns.length">
            <slot v-if="tableStatus[state]" :name="`state-${state}`">
              <div class="k-table__status">{{tableStatus[state]}}</div>
            </slot>
            <div v-else>State Value Error: ({{state}})，Allow State Value:{{Object.keys(tableStatus).join(', ')}}</div>
          </td>
        </tr>
      </tbody>
      <tfoot></tfoot>
    </table>
  </div>
</template>
<script>
import useDataGroup from '@/composables/useDataGroup.js'
import TableHeader from './TableHeader.vue'
import TableBody from './TableBody.vue'
import useColumnStore from './store/useColumnStore.js'
import useDataStore from './store/useDataStore.js'
import {computed, watchEffect, toRefs, defineComponent, toRef, provide, h} from 'vue'

const tableStatus = {loading: 'Loading', loaded: '', error: 'Load Data Failed', noResults: 'No Result', noData: 'There are no rows to show.'}
const defaultRenderGroup = (props) => [h('span', { class: 'k-table__group-by' }, `${props.groupColumn?.field}: `), h('span', {}, `${props.group}`)]
export default defineComponent({
  name: 'KBaseTable',
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
      default: 'loaded' // loading, loaded, noResults, noData, error
    }
  },
  emits: ['selection-change', 'row-click', 'cell-click', 'select', 'select-all', 'order-change'],
  setup(props, context) {
    const {emit} = context
    const {data} = toRefs(props)
    const groupBy = toRef(props, 'groupBy')
    const { groupField, dataGroup } = useDataGroup(data)
    
    watchEffect(() => {
      groupField.value = groupBy.value
    })
    const currentStatusClass = computed(() => {
      return Object.keys(tableStatus).reduce((t, c) => {
        t[`k-table-status--${c}`] = props.state === c
        return t
      }, {})
    })
    const columnStore = useColumnStore()
    const dataStore = useDataStore()
    const selectedRows = computed(() => {
      return [...dataStore.state.selection]
        .map((id) => dataStore.state.data.find((item) => item.id === id))
    })
    watchEffect(() => {
      dataStore.action.initState(data.value)
    })
    watchEffect(() => {
      emit('selection-change', selectedRows.value)
    })
    provide('dataStore', dataStore)
    provide('columnStore', columnStore)
    provide('tableEmit', emit)
    const columns = computed(() => {
      return props.groupBy ? columnStore.state.columns.filter((c) => c.field !== props.groupBy) : columnStore.state.columns
    })
    const hasSelection = computed(() => {
      return columns.some((c) => c.type === 'selection')
    })
    const getColStyle = (col) => {
      if (col.type === 'selection') {
        return {
          width: '30px'
        }
      }
      if (col.width) {
        const w = `${parseFloat(col.width, 10)}px`
        return {
          width: w
        }
      }
      return {}
    }
    return {
      dataGroup,
      currentStatusClass,
      tableStatus,
      columns,
      hasSelection,
      groupSlot: context.slots.group ?? defaultRenderGroup,
      getColStyle,
    }
  },
  components: {
    TableHeader,
    TableBody
  }
})
</script>
<style>
.k-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
  overflow: hidden;
  background: var(--sortable-table-accent-bg);
  border-radius: 4px;
  outline: 1px solid var(--border);
}
.k-table__status {
  text-align: center;
  padding: 30px 0px;
}
.k-table__group-by {
  color: var(--sortable-table-group-label);
  text-transform: capitalize;
}
.k-table > tbody > tr {
    border-bottom: 1px solid var(--sortable-table-top-divider);
    background-color: var(--body-bg);
}
.k-table > tbody > tr.group-row:first-child,
.k-table > tbody > tr.group-row:last-child,
.k-table > tbody.k-table-status--noData > tr {
  border-bottom: 0;
}
</style>
