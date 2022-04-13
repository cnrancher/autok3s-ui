import { reactive, onBeforeUnmount, computed, readonly } from 'vue'

// state
export function createStore() {
  const state = {
    tabs: [],
    active: null,
    closable: false
  }
  return reactive(state)
}
// actions
function addTab(state) {
  return (tab) => {
    if (!tab.name) {
      throw new Error('tab name is required')
    }
    if (state.tabs.some((d) => d.id === tab.id)) {
      throw new Error(`tab name(${tab.name}) already exists`)
    }
    state.tabs.push(tab)
  }
}
function removeTab(state) {
  return (id) => {
    const index = state.tabs.findIndex((d) => d.id === id)
    if (index > -1) {
      state.tabs.splice(index, 1)
      if (id === state.active) {
        const nextIndex = index % state.tabs.length
        state.active = state.tabs[nextIndex]?.id ?? null
      }
    }
  }
}
function setActiveTab(state) {
  return (id) => {
    const index = state.tabs.findIndex((d) => d.id === id)
    if (index > -1) {
      state.active = id
      return true
    }
    return false
  }
}

function clearData(state) {
  return () => {
    state.tabs = []
    state.active = null
  }
}
function setClosable(state) {
  return (closable) => {
    state.closable = closable
  }
}

function createAction(state) {
  return {
    addTab: addTab(state),
    removeTab: removeTab(state),
    setActiveTab: setActiveTab(state),
    clearData: clearData(state),
    setClosable: setClosable(state)
  }
}

// getters
function activeTab(state) {
  return computed(() => {
    return state.tabs.find((d) => d.id === state.active)
  })
}

function createGetter(state) {
  return {
    activeTab: activeTab(state)
  }
}

export default function useTabStore() {
  const state = createStore()
  const action = createAction(state)
  const getter = createGetter(state)
  onBeforeUnmount(() => {
    action.clearData()
  })
  return {
    state: readonly(state),
    action: readonly(action),
    getter: readonly(getter)
  }
}
