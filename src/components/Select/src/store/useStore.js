// state

import { computed, reactive, readonly } from 'vue'

// state
export function createStore() {
  const state = {
    options: [],
    value: null,
    values: null,
    loading: false,
    errors: []
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
    state.value = value
  }
}
function setValues(state) {
  return (values = []) => {
    if (!state.values) {
      state.values = []
    }
    if (values.length === 0) {
      state.values = []
    } else {
      state.values = [...values]
    }
  }
}

function clear(state) {
  return () => {
    state.options = []
    state.value = null
    state.values = []
    state.errors = []
  }
}
// getters
function activeOption(state) {
  return computed(() => {
    return state.options.find((item) => item.value === state.value)
  })
}
function activeOptions(state) {
  return computed(() => {
    return (
      state.values
        ?.filter((v) => state.options.find((o) => o.value === v))
        ?.map((v) => state.options.find((o) => o.value === v)) ?? []
    )
  })
}
export function createGetter(state) {
  return {
    activeOption: activeOption(state),
    activeOptions: activeOptions(state)
  }
}
export function createAction(state) {
  return {
    addOption: addOption(state),
    removeOption: removeOption(state),
    setValue: setValue(state),
    setValues: setValues(state),
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
    getter: readonly(getter)
  }
}
