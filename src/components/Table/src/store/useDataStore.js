import { computed, reactive, readonly, watch, onBeforeUnmount } from 'vue'

// state
export function createStore() {
  const state = {
    data: [],
    selection: new Set()
  }
  return reactive(state)
}

// actions
function initState(state) {
  return (data = [], selection = new Set()) => {
    state.data = data
    state.selection = selection
  }
}
function clearData(state) {
  return () => {
    state.data = []
  }
}
function addSelection(state) {
  return (id) => {
    if (state.data.some((d) => d.id === id)) {
      return state.selection.add(id)
    }
    return false
  }
}

function removeSelection(state) {
  return (id) => {
    return state.selection.delete(id)
  }
}

function clearSelection(state) {
  return () => {
    state.selection.clear()
  }
}

function checkAll(state) {
  return () => {
    state.data.forEach((item) => state.selection.add(item.id))
  }
}

export function createAction(state) {
  return {
    initState: initState(state),
    clearData: clearData(state),
    addSelection: addSelection(state),
    removeSelection: removeSelection(state),
    clearSelection: clearSelection(state),
    checkAll: checkAll(state)
  }
}

// getters

function isAllSelected(state) {
  return computed(() => {
    if (state.selection.length === 0 || state.data.length === 0) {
      return false
    }
    const ids = state.data.reduce((t, c) => {
      t.add(c.id)
      return t
    }, new Set())
    return ids.size === state.selection.size
  })
}
function selectionSize(state) {
  return computed(() => {
    return state.selection.size
  })
}
export function createGetter(state) {
  return {
    isAllSelected: isAllSelected(state),
    selectionSize: selectionSize(state)
  }
}

export default function useStore() {
  const state = createStore()
  const action = createAction(state)
  const getter = createGetter(state)
  watch(
    () => state.data,
    () => {
      ;[...state.selection]
        .filter((key) => !state.data.some((d) => d.id === key))
        .forEach((key) => state.selection.delete(key))
    }
  )
  onBeforeUnmount(() => {
    action.clearData()
  })
  return {
    state: readonly(state),
    action: readonly(action),
    getter: readonly(getter)
  }
}
