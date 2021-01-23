import { reactive, readonly } from 'vue'
import { fetchList } from '@/api/template.js'

// state
export function createStore() {
  const state = {
    templates: [],
    loading: false,
    error: null,
  }
  return reactive(state)
}

// actions
function addTemplate(state) {
  return (...templates) => {
    state.templates.push(...templates)
  }
}

function removeTemplate(state) {
  return (template) => {
    const index = state.templates.findIndex((t) => t.id === template.id)
    if (index > -1) {
      return state.templates.splice(index, 1)
    }
  }
}
function updateTemplate(state) {
  return (template) => {
    const index = state.templates.findIndex((t) => t.id === template.id)
    if (index > -1) {
      return state.templates.splice(index, 1, template)
    }
  }
}

function syncTemplates(state) {
  return () => {
    state.loading = true
    return fetchList().then(({data}) => {
      state.templates = data
      state.error = null
    }).catch((err) => {
      state.templates = []
      state.error = err
    }).finally(() => {
      state.loading = false
    })
  }
}

function createAction(state) {
  return {
    addTemplate: addTemplate(state),
    removeTemplate: removeTemplate(state),
    updateTemplate: updateTemplate(state),
    syncTemplates: syncTemplates(state),
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