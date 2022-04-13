import { defineStore } from 'pinia'
import useIdGenerator from '@/composables/useIdGenerator.js'
const { next: nextId } = useIdGenerator()
const groupDefaultSettings = {
  speed: 300,
  duration: 5000,
  closeOnClick: true
}

const notificationStore = defineStore('notificationStore', {
  state: () => {
    return {
      groupEvents: {}
    }
  },
  actions: {
    addItem(event) {
      const { group = 'default', title, content, type = 'warn', data, speed, duration, closeOnClick } = event
      let events = this.groupEvents[group] ?? []
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
      this.groupEvents[group] = events

      return e
    },
    removeItem(id, group = 'default') {
      const events = this.groupEvents[group]
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
    },
    setGroup(group) {
      if (!this.groupEvents[group]) {
        this.groupEvents[group] = []
      }
    },
    notify(event) {
      const item = this.addItem(event)
      const duration = item.duration ?? groupDefaultSettings.duration
      const speed = item.speed ?? groupDefaultSettings.speed
      if (duration > 0) {
        const after = duration + 2 * speed
        item.timer = setTimeout(() => {
          item.timer = null
          this.removeItem(item.id, item.group)
        }, after)
      }
    },
    clear(group) {
      this.groupEvents[group] = []
    },
    clearAll() {
      this.groupEvents = {}
    }
  }
})

export default notificationStore
