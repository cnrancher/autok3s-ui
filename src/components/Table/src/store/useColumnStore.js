import {reactive, readonly} from 'vue'

// state
export function createStore() {
  const state = {
    columns: []
  }
  return reactive(state)
}

// actions

function updateColumnOrder(state) {
  return (id, order) => {
    const c = state.columns.find((c) => c.id === id)
    if (c) {
      c.order = order
    }
  }
}
function addColumn(state) {
  return (column) => {
    state.columns.push(column)
  }
}
function removeColumn(state) {
  return (column) => {
    const index = state.columns.findIndex(c => c.id === column.id)
    if (index > -1) {
      state.columns.splice(index, 1)
    }
  }
}
export function createAction(state) {
  return {
    addColumn: addColumn(state),
    updateColumnOrder: updateColumnOrder(state),
    removeColumn: removeColumn(state)
  }
}

export default function useStore() {
  const state = createStore()
  const action = createAction(state)
  return {
    state: readonly(state),
    action: readonly(action)
  }
}