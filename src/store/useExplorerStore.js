import { computed, reactive, readonly } from 'vue'
import { fetchList } from '@/api/explorer.js'
import {stringify} from '@/utils/error.js'

// state
export function createStore() {
  const state = {
    explorers: [],
    loading: false,
    error: null,
    socketState: null,
  }

  return reactive(state)
}

// actions
function initExplorer(state) {
  return (explorers, err) => {
    state.explorers = exports
    state.error = err
  }
}

function updateExplorer(state) {
  return (explorer) => {
    const index = state.explorers.findIndex((e) => e.id === explorer.id)

    if (index === -1) {
      return
    }
    const pre = state.explorers.splice(index, 1, explorer)

    return pre
  }
}

function removeExplorer(state) {
  return (explorer) => {
    const index = state.explorers.findIndex((e) => e.id === explorer.id)
    if (index === -1) {
      return
    }

    return state.explorers.splice(index, 1)
  }
}

function addExplorer(state) {
  return (...explorers) => {
    state.explorers.push(...explorers)
  }
}

function changeLoading(state) {
  return (loading) => {
    state.loading = loading
  }
}

function changeError(state) {
  return (err) => {
    state.error = err
  }
}

function changeSocketState(state) {
  return (socketState) => {
    state.socketState = socketState
  }
}

function syncExplorers(state) {
  return () => {
    state.loading = true
    return fetchList().then(({data}) => {
      state.explorers = data
      state.error = null
    }).catch((err) => {
      state.explorers = []
      state.error = stringify(err)
    })
    .finally(() => {
      state.loading = false
    })
  }
}

// getters
function clusterExplorerMap(state) {
  return computed(() => {
    return state.explorers.reduce((t, c) => {
      t[c.id] = c
      return t
    }, {})
  })
}

function createAction(state) {
  return {
    initExplorer: initExplorer(state),
    updateExplorer: updateExplorer(state),
    removeExplorer: removeExplorer(state),
    addExplorer: addExplorer(state),
    changeLoading: changeLoading(state),
    changeError: changeError(state),
    changeSocketState: changeSocketState(state),
    syncExplorers: syncExplorers(state),
  }
}

function createGetter(state) {
  return {
    clusterExplorerMap: clusterExplorerMap(state)
  }
}

export default function useStore() {
  const state = createStore()
  const action = createAction(state)
  const getter = createGetter(state)
  return {
    state: readonly(state),
    action: readonly(action),
    getter: readonly(getter),
  }
}