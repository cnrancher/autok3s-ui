import { computed, onBeforeUnmount, reactive, readonly } from "vue"

// state
export function createStore() {
  const state = {
    tabs: [],
    active: null,
    open: false,
    userHeight: window.localStorage.getItem('wm-height'),
  }
  return reactive(state)
}

// actions
function addTab(state) {
  return (tab) => {
    const tabCached = state.tabs.find((item) => item.id === tab.id)
    if (tabCached) {
      tabCached.renewCount = (tabCached.renewCount ?? 0) + 1
      return
    }
    tab.renewCount = 0
    state.tabs.push(tab)
    state.active = tab.id
    state.open = true
  }
}

function removeTab(state) {
  return (id) => {
    const index = state.tabs.findIndex((item) => item.id === id)
    if (index > -1) {
      state.tabs.splice(index, 1)
      if (state.active === id) {
        const nextIndex = index % state.tabs.length
        state.active = state.tabs[nextIndex]?.id ?? null
      }
    }
    if (state.tabs.length === 0) {
      state.open = false
    }
  }
}

function setActiveTab(state) {
  return (id) => {
    const index = state.tabs.findIndex((item) => item.id === id)
    if (index > -1) {
      state.active = id
      return true
    }
    return false
  }
}

function close(state) {
  return () => {
    state.tabs = []
    state.open = false
  }
}

function setUserHeight(state) {
  return (height) => {
    state.userHeight = height
    window.localStorage.setItem('wm-height', height);
  }
}

export function createAction(state) {
  return {
    addTab: addTab(state),
    removeTab: removeTab(state),
    setActiveTab: setActiveTab(state),
    close: close(state),
    setUserHeight: setUserHeight(state)
  }
}

// getters
function activeTab(state) {
  return computed(() => {
    return state.tabs.find((item) => state.active === item.id)
  })
}

export function createGetter(state) {
  return {
    activeTab: activeTab(state)
  }
}

export default function useStore() {
  const state = createStore()
  const action = createAction(state)
  const getter = createGetter(state)
  onBeforeUnmount(() => {
    action.close()
  })
  return {
    state: readonly(state),
    action: readonly(action),
    getter: readonly(getter),
  }
}