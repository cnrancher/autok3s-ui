// state

import { computed, onBeforeUnmount, reactive, readonly } from "vue"

// state
export function createStore() {
  const state = {
    options: [],
    value: null,
    loading: false,
    errors: [],
  }
  return reactive(state)
}
// actions
function addOption(state) {
  return (option) => {
    state.options.push(option)
  }
}

function removeOption(state) {
  return (option) => {
    const index = state.options.findIndex((item) => item === option || item.value === option.value)
    if (index > -1) {
      state.options.splice(index, 1)
      if (option === state.activeOption || option.value === state.value) {
        state.value = null
      }
    }
  }
}

function setValue(state) {
  return (value) => {
    const option = state.options.find((item) => item.value === value)
    if (option) {
      state.value = value
      return true
    }
    state.value = null
    return false
  }
}

function removeSelected(state) {
  return () => {
    state.value = null
  }
}

function clear(state) {
  return () => {
    state.options = null
    state.value = null
    state.errors = []
  }
}

// getters
function activeOption(state) {
  return computed(() => {
    return state.options.find((item) => item.value === state.value)
  })
}
export function createGetter(state) {
  return {
    activeOption: activeOption(state)
  }
}
export function createAction(state) {
  return {
    addOption: addOption(state),
    removeOption: removeOption(state),
    setValue: setValue(state),
    removeSelected: removeSelected(state),
    clear: clear(state)
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