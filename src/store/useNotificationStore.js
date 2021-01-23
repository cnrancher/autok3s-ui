
import { onBeforeUnmount, reactive, readonly } from "vue"
import useIdGenerator from '@/composables/useIdGenerator.js'
const {next: nextId, reset: resetId } = useIdGenerator()
const groupDefaultSettings = {
  speed: 300,
  duration: 5000,
  closeOnClick: true
}
// state
export function createStore() {
  const state = {
    groupEvents: {}
  }
  return reactive(state)
}

// actions
function addItem(state) {
  return (event) => {
    const {group = 'default', title, content, type = 'warn', data, speed, duration, closeOnClick} = event
    let events = state.groupEvents[group] ?? []
    const e = {
      id: nextId(),
      group,
      title,
      content,
      type,
      data,
      duration,
      speed,
      closeOnClick,
      createTime: new Date(),
      timer: null
    }
    events.push(e)
    state.groupEvents[group] = events
    return e
  }
}
function removeItem(state) {
  return (id, group = 'default') => {
    const events = state.groupEvents[group]
    if (!events) {
      return
    }
    const index = events.findIndex((e) => e.id === id)
    if (index > -1) {
      const timer = events[index].timer
      if (timer) {
        clearTimeout(timer)
      }
      events.splice(index, 1)
    }
  }
}
function setGroup(state) {
  return (group) => {
    if (!state.groupEvents[group]) {
      state.groupEvents[group] = []
    }
  }
}
function clear(state) {
  return (group = 'default') => {
    state.groupEvents[group] = []
  }
}

function clearAll(state) {
  return () => {
    state.groupEvents = {}
  }
}

export function createAction(state) {
  const remove = removeItem(state)
  const add = addItem(state)
  const addItemWithRemoveTimer = (event) => {
    const item = add(event)
    const duration = item.duration ?? groupDefaultSettings.duration
    const speed = item.speed ?? groupDefaultSettings.speed
    if (duration > 0) {
      const after = duration + 2 * speed
      item.timer = setTimeout(() => {
        item.timer = null
        remove(item.id, item.group)
      }, after)
    }
  }

  return {
    setGroup: setGroup(state),
    removeItem: remove,
    notify: addItemWithRemoveTimer,
    clear: clear(state),
    clearAl: clearAll(state)
  }
}

export default function useStore() {
  const state = createStore()
  const action = createAction(state)
  onBeforeUnmount(() => {
    action.clearAl()
  })
  return {
    state: readonly(state),
    action: readonly(action),
  }
}