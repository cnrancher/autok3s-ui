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
        <table-body v-for="g in dataGroup" :key="g" :data="g.children" :group="g.group" :group-by="groupBy">
          <template v-if="$slots.group" #group="props">
            <slot name="group" v-bind="props"></slot>
          </template>
        </table-body>
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
export default {
  name: 'KBaseTable',
}
</script>
<script setup>
import useDataGroup from '@/composables/useDataGroup.js'
import TableHeader from './TableHeader.vue'
import TableBody from './TableBody.vue'
import useColumnStore from './store/useColumnStore.js'
import useDataStore from './store/useDataStore.js'
import { computed, watch, watchEffect, toRefs, toRef, provide, defineProps, defineEmits } from 'vue'

const tableStatus = {loading: 'Loading', loaded: '', error: 'Load Data Failed', noResults: 'No Result', noData: 'There are no rows to show.'}

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
    default: 'loaded' // loading, loaded, noResults, noData, error
  }
})

const emit = defineEmits(['selection-change', 'row-click', 'cell-click', 'select', 'select-all', 'order-change'])

const {data} = toRefs(props)
const groupBy = toRef(props, 'groupBy')
const { groupField, dataGroup } = useDataGroup(data)

watch(groupBy, (v) => {
  groupField.value = v
}, {
  immediate: true
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

</script>
<style>
.k-table {
  @apply bg-warm-gray-100 w-full border-collapse min-w-400px overflow-hidden;
  outline: 1px solid #d4d4d8;
}
.k-table__status {
  @apply text-center py-30px px-0;
}
.k-table__group-by {
  @apply capitalize text-gray-400;
}

.k-table > tbody > tr.group-row:first-child,
.k-table > tbody > tr.group-row:last-child,
.k-table > tbody.k-table-status--noData > tr {
  @apply border-b-0;
}
</style>
